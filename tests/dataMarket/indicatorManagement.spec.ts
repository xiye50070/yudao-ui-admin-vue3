import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IndicatorPage from '@/views/dataMarket/indicator/index.vue'
import source from '@/views/dataMarket/indicator/index.vue?raw'

const indicatorApi = vi.hoisted(() => ({
  getIndicatorPage: vi.fn(),
  getIndicator: vi.fn(),
  createIndicator: vi.fn(),
  updateIndicator: vi.fn(),
  deleteIndicator: vi.fn(),
  updateIndicatorStatus: vi.fn(),
  getIndicatorDomainList: vi.fn(),
  getIndicatorAcl: vi.fn(),
  updateIndicatorAcl: vi.fn()
}))

const catalogApi = vi.hoisted(() => ({
  getTags: vi.fn(),
  getFilterDimensions: vi.fn()
}))

const messageApi = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/indicator', () => indicatorApi)
vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => messageApi
}))

const domain = {
  id: 11,
  code: 'IND_FINANCE',
  name: '财务',
  description: '财务指标',
  sort: 1,
  status: 0
}

const tags = [
  {
    id: 21,
    dimensionId: 31,
    code: 'FINANCE',
    name: '财务领域',
    sort: 1,
    status: 0
  },
  {
    id: 22,
    dimensionId: 31,
    code: 'MAJOR_EVENT',
    name: '重大事项',
    sort: 2,
    status: 0
  }
]

const row = {
  id: 41,
  indicatorCode: 'GZJG-001',
  indicatorName: '资产负债率',
  indicatorDomainId: 11,
  indicatorDomain: domain,
  calculationDescription: '负债总额 / 资产总额',
  thresholdDescription: '预警值 47%',
  dataSourceDescription: 'NC 系统',
  businessPenetration: '穿透至下级企业',
  supplementaryDescription: null,
  tagIds: [21],
  tags: [tags[0]],
  status: 1,
  sort: 1,
  updateTime: '2026-08-27T10:00:00'
}

const renderPage = () =>
  render(IndicatorPage, {
    global: {
      plugins: [ElementPlus],
      stubs: { Icon: true },
      directives: {
        hasPermi: () => undefined,
        loading: () => undefined
      }
    }
  })

describe('indicator management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    indicatorApi.getIndicatorPage.mockResolvedValue({ list: [row], total: 1 })
    indicatorApi.getIndicator.mockResolvedValue(row)
    indicatorApi.createIndicator.mockResolvedValue(42)
    indicatorApi.updateIndicator.mockResolvedValue(undefined)
    indicatorApi.deleteIndicator.mockResolvedValue(undefined)
    indicatorApi.updateIndicatorStatus.mockResolvedValue(undefined)
    indicatorApi.getIndicatorDomainList.mockResolvedValue([domain])
    indicatorApi.getIndicatorAcl.mockResolvedValue([])
    indicatorApi.updateIndicatorAcl.mockResolvedValue(undefined)
    catalogApi.getTags.mockResolvedValue(tags)
    catalogApi.getFilterDimensions.mockResolvedValue([
      {
        id: 31,
        code: 'IND_REGULATORY_AREA',
        name: '监管领域',
        sort: 1,
        status: 0
      }
    ])
    messageApi.delConfirm.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('loads definition-only indicator rows with independent domains and shared tags', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: '指标配置' })).toBeInTheDocument()
    expect(await screen.findByText('资产负债率')).toBeInTheDocument()
    expect(screen.getAllByText('财务领域').length).toBeGreaterThan(0)
    expect(indicatorApi.getIndicatorPage).toHaveBeenCalledWith(
      expect.objectContaining({ pageNo: 1, pageSize: 10 })
    )
    expect(screen.queryByRole('button', { name: '申请指标' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '试算' })).not.toBeInTheDocument()
  })

  it('creates an indicator disabled by default with its domain and shared tags', async () => {
    renderPage()

    await fireEvent.click(await screen.findByRole('button', { name: '新增指标' }))
    const drawer = await screen.findByRole('dialog', { name: '新增指标' })
    await fireEvent.update(within(drawer).getByPlaceholderText('例如 GZJG-030'), 'GZJG-030')
    await fireEvent.update(within(drawer).getByPlaceholderText('请输入指标名称'), '测试指标')
    await fireEvent.click(within(drawer).getByRole('combobox', { name: '指标领域' }))
    await fireEvent.click(await screen.findByRole('option', { name: '财务' }))
    await fireEvent.click(within(drawer).getByRole('combobox', { name: '标准标签' }))
    await fireEvent.click(await screen.findByRole('option', { name: '财务领域' }))
    await fireEvent.click(await screen.findByRole('option', { name: '重大事项' }))
    await fireEvent.click(within(drawer).getByRole('button', { name: '保存' }))

    await waitFor(() =>
      expect(indicatorApi.createIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          indicatorCode: 'GZJG-030',
          indicatorName: '测试指标',
          indicatorDomainId: 11,
          tagIds: [21, 22],
          status: 1
        })
      )
    )
  })

  it('keeps the source focused on definitions, descriptions, independent domains and ACL', () => {
    expect(source).toContain('维护指标定义、说明、领域、标签、状态与访问范围')
    expect(source).toContain('calculationDescription')
    expect(source).toContain('thresholdDescription')
    expect(source).toContain('dataSourceDescription')
    expect(source).toContain('businessPenetration')
    expect(source).toContain('supplementaryDescription')
    expect(source).toContain('getIndicatorDomainList')
    expect(source).toContain('getTags')
    expect(source).toContain('启用后，租户内拥有指标浏览权限的用户均可查看')
    expect(source).not.toContain('getSubjectDomainList')
    expect(source).not.toContain('SubjectDomainSelect')
    expect(source).not.toContain('申请指标')
    expect(source).not.toContain('执行计算')
  })
})
