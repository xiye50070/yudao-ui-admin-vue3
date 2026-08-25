import { defineComponent, h } from 'vue'
import { cleanup, render, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/views/Home/Index.vue'
import { useUserStore } from '@/store/modules/user'

const deliveryApi = vi.hoisted(() => ({
  getApplicationPage: vi.fn()
}))
const catalogApi = vi.hoisted(() => ({
  getDatasetPage: vi.fn(),
  getSubjectDomainList: vi.fn(),
  getSourceSystemPage: vi.fn()
}))
const masterDataApi = vi.hoisted(() => ({
  getMasterObjectPage: vi.fn()
}))
const noticeApi = vi.hoisted(() => ({
  getNoticePage: vi.fn()
}))
const routerApi = vi.hoisted(() => ({
  getRoutes: vi.fn(),
  push: vi.fn()
}))

vi.mock('@/api/dataMarket/delivery', () => deliveryApi)
vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('@/api/dataMarket/masterData', () => masterDataApi)
vi.mock('@/api/system/notice', () => noticeApi)
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => routerApi
}))

const IconStub = defineComponent({
  name: 'Icon',
  props: {
    icon: String,
    size: Number
  },
  setup(props) {
    return () => h('span', { 'data-icon': props.icon, 'aria-hidden': 'true' })
  }
})

const renderHome = () =>
  render(Home, {
    global: {
      stubs: { Icon: IconStub }
    }
  })

const route = (name: string, path: string) => ({ name, path, meta: {} })

const allWorkbenchRoutes = [
  route('DataMarketCatalog', '/data-market-management/catalog'),
  route('DataMarketDomain', '/data-market-management/domain'),
  route('DataMarketSourceSystem', '/data-market-management/source-system'),
  route('DataMarketDataset', '/data-market-management/dataset'),
  route('DataMarketApplication', '/data-market-management/application'),
  route('DataMarketDeliveryHistory', '/data-market-management/delivery'),
  route('DataMarketAcceptanceIssue', '/data-market-management/acceptance-issue'),
  route('DataMarketMasterData', '/data-market-management/master-data'),
  route('SystemNotice', '/system/notice')
]

const allWorkbenchPermissions = [
  'data-market:catalog:query',
  'data-market:domain:query',
  'data-market:source-system:query',
  'data-market:dataset:query',
  'data-market:application:management-query',
  'data-market:delivery:query',
  'data-market:acceptance:issue-query',
  'data-market:master-data:query',
  'system:notice:query'
]

const activeApplication = {
  id: 42,
  applicationNo: 'DM-20260825-0042',
  applicationType: 'CREATE',
  name: '客户经营分析数据申请',
  status: 'IN_APPROVAL',
  currentVersionNo: 1,
  datasetCount: 3,
  updateTime: '2026-08-25T09:30:00'
}

describe('data market operations home', () => {
  beforeEach(() => {
    const userStore = useUserStore()
    userStore.resetState()
    userStore.permissions = new Set(allWorkbenchPermissions)

    routerApi.push.mockReset()
    routerApi.getRoutes.mockReset().mockReturnValue(allWorkbenchRoutes)
    deliveryApi.getApplicationPage.mockReset().mockImplementation(({ pageSize, statuses }) => {
      if (pageSize === 5) return Promise.resolve({ list: [activeApplication], total: 26 })
      const totals = new Map<string, number>([
        ['SUBMITTING,SUBMIT_FAILED,RETURNED_SUPPLEMENT', 2],
        ['IN_APPROVAL', 5],
        ['CONFIGURING', 7],
        ['PENDING_ACCEPTANCE,RECTIFYING', 12],
        ['DELIVERED,COMPLETED', 286]
      ])
      return Promise.resolve({ list: [], total: totals.get(statuses.join(',')) ?? 0 })
    })
    catalogApi.getDatasetPage.mockReset().mockResolvedValue({ list: [], total: 2341 })
    catalogApi.getSubjectDomainList.mockReset().mockResolvedValue(
      Array.from({ length: 128 }, (_, index) => ({
        id: index + 1,
        code: `DOMAIN_${index + 1}`,
        name: `主题域 ${index + 1}`,
        parentId: 0,
        sort: index,
        status: 0
      }))
    )
    catalogApi.getSourceSystemPage.mockReset().mockResolvedValue({ list: [], total: 56 })
    masterDataApi.getMasterObjectPage.mockReset().mockResolvedValue({ list: [], total: 3782 })
    noticeApi.getNoticePage.mockReset().mockResolvedValue({
      list: [
        {
          id: 1,
          title: '数据市场平台维护通知',
          type: 1,
          content: '',
          status: 0,
          createTime: '2026-08-25T08:00:00'
        }
      ],
      total: 1
    })
  })

  afterEach(cleanup)

  it('renders verified operational data and removes every stock promotional block', async () => {
    const view = renderHome()

    await waitFor(() => expect(view.getByText('数据市场运营工作台')).toBeInTheDocument())
    await waitFor(() => expect(view.getByText('DM-20260825-0042')).toBeInTheDocument())

    expect(within(view.getByTestId('focus-total')).getByText('26')).toBeInTheDocument()
    expect(within(view.getByTestId('stage-approval')).getByText('5')).toBeInTheDocument()
    expect(within(view.getByTestId('stage-delivery')).getByText('7')).toBeInTheDocument()
    expect(within(view.getByTestId('stage-acceptance')).getByText('12')).toBeInTheDocument()
    expect(within(view.getByTestId('stage-completed')).getByText('286')).toBeInTheDocument()

    expect(view.getByTestId('metric-dataset')).toHaveTextContent('2,341')
    expect(view.getByTestId('metric-domain')).toHaveTextContent('128')
    expect(view.getByTestId('metric-source')).toHaveTextContent('56')
    expect(view.getByTestId('metric-master')).toHaveTextContent('3,782')
    expect(view.getByText('数据市场平台维护通知')).toBeInTheDocument()

    expect(view.queryByText('ruoyi-vue-pro')).not.toBeInTheDocument()
    expect(view.queryByText('商城中心')).not.toBeInTheDocument()
    expect(view.queryByText('AI 大模型')).not.toBeInTheDocument()
    expect(view.queryByText(/10w\+/)).not.toBeInTheDocument()
  })

  it('only calls and displays modules available to the current user while preserving valid zeroes', async () => {
    const userStore = useUserStore()
    userStore.permissions = new Set([
      'data-market:application:management-query',
      'data-market:dataset:query'
    ])
    routerApi.getRoutes.mockReturnValue([
      route('DataMarketApplication', '/data-market-management/application'),
      route('DataMarketDataset', '/data-market-management/dataset')
    ])
    deliveryApi.getApplicationPage.mockResolvedValue({ list: [], total: 0 })
    catalogApi.getDatasetPage.mockResolvedValue({ list: [], total: 0 })

    const view = renderHome()

    await waitFor(() => expect(view.getByTestId('metric-dataset')).toHaveTextContent('0'))
    expect(within(view.getByTestId('stage-intake')).getByText('0')).toBeInTheDocument()
    expect(view.getByText('申请管理')).toBeInTheDocument()
    expect(view.getByText('数据集管理')).toBeInTheDocument()

    expect(catalogApi.getSubjectDomainList).not.toHaveBeenCalled()
    expect(catalogApi.getSourceSystemPage).not.toHaveBeenCalled()
    expect(masterDataApi.getMasterObjectPage).not.toHaveBeenCalled()
    expect(noticeApi.getNoticePage).not.toHaveBeenCalled()
    expect(view.queryByText('主题域')).not.toBeInTheDocument()
    expect(view.queryByText('主数据对象')).not.toBeInTheDocument()
    expect(view.queryByText('系统公告')).not.toBeInTheDocument()
  })

  it('marks a confirmed module locally unavailable instead of inventing fallback data', async () => {
    const userStore = useUserStore()
    userStore.permissions = new Set(['data-market:dataset:query'])
    routerApi.getRoutes.mockReturnValue([
      route('DataMarketDataset', '/data-market-management/dataset')
    ])
    catalogApi.getDatasetPage.mockRejectedValue(new Error('dataset unavailable'))

    const view = renderHome()

    await waitFor(() => expect(view.getByTestId('metric-dataset')).toHaveTextContent('暂不可用'))
    expect(view.getByTestId('metric-dataset')).not.toHaveTextContent('2,341')
    expect(deliveryApi.getApplicationPage).not.toHaveBeenCalled()
  })
})
