import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IndicatorDomainPage from '@/views/dataMarket/indicatorDomain/index.vue'
import source from '@/views/dataMarket/indicatorDomain/index.vue?raw'

const indicatorApi = vi.hoisted(() => ({
  getIndicatorDomainList: vi.fn(),
  createIndicatorDomain: vi.fn(),
  updateIndicatorDomain: vi.fn(),
  deleteIndicatorDomain: vi.fn()
}))

const messageApi = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/indicator', () => indicatorApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => messageApi
}))

const domains = [
  {
    id: 11,
    code: 'IND_FINANCE',
    name: '财务',
    description: '财务监管指标',
    sort: 1,
    status: 0
  },
  {
    id: 12,
    code: 'IND_CONTRACT',
    name: '合同',
    description: '合同监管指标',
    sort: 2,
    status: 1
  }
]

const renderPage = () =>
  render(IndicatorDomainPage, {
    global: {
      plugins: [ElementPlus],
      stubs: { Icon: true },
      directives: {
        hasPermi: () => undefined,
        loading: () => undefined
      }
    }
  })

describe('indicator-domain management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    indicatorApi.getIndicatorDomainList.mockResolvedValue(domains)
    indicatorApi.createIndicatorDomain.mockResolvedValue(13)
    indicatorApi.updateIndicatorDomain.mockResolvedValue(undefined)
    indicatorApi.deleteIndicatorDomain.mockResolvedValue(undefined)
    messageApi.delConfirm.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('loads the independent flat indicator domains in the shared management frame', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: '指标领域' })).toBeInTheDocument()
    expect(await screen.findByText('财务')).toBeInTheDocument()
    expect(screen.getByText('合同')).toBeInTheDocument()
    expect(indicatorApi.getIndicatorDomainList).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('上级领域')).not.toBeInTheDocument()
  })

  it('reports a backend reference error when an edited domain cannot be disabled', async () => {
    indicatorApi.updateIndicatorDomain.mockRejectedValueOnce(
      new Error('指标领域已被启用指标引用，不能停用')
    )
    renderPage()

    await fireEvent.click((await screen.findAllByRole('button', { name: '编辑' }))[0])
    const drawer = await screen.findByRole('dialog', { name: '编辑指标领域' })
    await fireEvent.click(drawer.querySelector('[role="switch"]') as HTMLElement)
    await fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() =>
      expect(messageApi.error).toHaveBeenCalledWith('指标领域已被启用指标引用，不能停用')
    )
  })

  it('keeps indicator-domain APIs and permissions separate from data-market subject domains', () => {
    expect(source).toContain('getIndicatorDomainList')
    expect(source).toContain('data-market:indicator-domain:create')
    expect(source).toContain('data-market:indicator-domain:update')
    expect(source).toContain('data-market:indicator-domain:delete')
    expect(source).not.toContain('getSubjectDomainList')
    expect(source).not.toContain('SubjectDomainSelect')
    expect(source).not.toContain('data-market:domain:')
  })
})
