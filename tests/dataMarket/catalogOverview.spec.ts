import { defineComponent, h } from 'vue'
import ElementPlus from 'element-plus'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CatalogOverview from '@/views/dataMarket/catalog/index.vue'
import { useUserStore } from '@/store/modules/user'

const catalogApi = vi.hoisted(() => ({
  getDatasetPage: vi.fn(),
  getSubjectDomainList: vi.fn(),
  getTags: vi.fn(),
  getSourceSystemPage: vi.fn()
}))

const routerApi = vi.hoisted(() => ({
  getRoutes: vi.fn(),
  push: vi.fn()
}))

vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => routerApi
}))

const IconStub = defineComponent({
  name: 'Icon',
  props: { icon: String, size: Number },
  setup(props) {
    return () => h('span', { 'data-icon': props.icon, 'aria-hidden': 'true' })
  }
})

const route = (name: string, path: string) => ({ name, path, meta: {} })

const allRoutes = [
  route('DataMarketCatalog', '/data-market-management/catalog'),
  route('DataMarketDomain', '/data-market-management/domain'),
  route('DataMarketTag', '/data-market-management/tag'),
  route('DataMarketSourceSystem', '/data-market-management/source-system'),
  route('DataMarketDataset', '/data-market-management/dataset')
]

const allPermissions = [
  'data-market:catalog:query',
  'data-market:domain:query',
  'data-market:tag:query',
  'data-market:source-system:query',
  'data-market:dataset:query'
]

const domains = [
  {
    id: 11,
    code: 'OA',
    name: '协同办公',
    parentId: 0,
    description: '协同办公测试主题域',
    sort: 0,
    status: 0
  },
  {
    id: 12,
    code: 'HR',
    name: '人事系统',
    parentId: 0,
    description: '人事系统测试主题域',
    sort: 0,
    status: 0
  }
]

const sourceSystems = [
  { id: 21, code: 'OA', name: '协同办公系统', status: 0 },
  { id: 22, code: 'HR', name: '人事系统', status: 0 }
]

const datasets = [
  {
    id: 31,
    businessName: '测试B',
    datasetCode: '测试B',
    physicalName: 'oa_test_b',
    sourceSystemId: 21,
    subjectDomainId: 11,
    sensitivityLevel: 2,
    publishStatus: 1
  },
  {
    id: 32,
    businessName: '测试家庭信息数据集',
    datasetCode: 'test_family',
    physicalName: 'employee_family',
    sourceSystemId: 22,
    subjectDomainId: 12,
    sensitivityLevel: 1,
    publishStatus: 1
  }
]

const renderCatalog = () =>
  render(CatalogOverview, {
    global: {
      plugins: [ElementPlus],
      stubs: { Icon: IconStub }
    }
  })

describe('data market catalog overview', () => {
  beforeEach(() => {
    const userStore = useUserStore()
    userStore.resetState()
    userStore.permissions = new Set(allPermissions)

    routerApi.getRoutes.mockReset().mockReturnValue(allRoutes)
    routerApi.push.mockReset()
    catalogApi.getSubjectDomainList.mockReset().mockResolvedValue(domains)
    catalogApi.getTags.mockReset().mockResolvedValue([
      {
        id: 41,
        dimensionId: 51,
        code: 'SOURCE',
        name: '来源系统',
        color: '#8aa2f0',
        sort: 0,
        status: 0
      }
    ])
    catalogApi.getSourceSystemPage.mockReset().mockResolvedValue({
      list: sourceSystems,
      total: 2
    })
    catalogApi.getDatasetPage.mockReset().mockResolvedValue({ list: datasets, total: 4 })
  })

  afterEach(cleanup)

  it('renders the verified Element Plus catalog and uses the page total for source systems', async () => {
    catalogApi.getSourceSystemPage.mockResolvedValue({
      list: [sourceSystems[0]],
      total: 2
    })

    const view = renderCatalog()

    await waitFor(() => expect(view.getByRole('heading', { name: '数据目录' })).toBeInTheDocument())
    await waitFor(() => expect(view.getByText('测试家庭信息数据集')).toBeInTheDocument())

    expect(view.getByTestId('metric-dataset')).toHaveTextContent('4')
    expect(view.getByTestId('metric-domain')).toHaveTextContent('2')
    expect(view.getByTestId('metric-tag')).toHaveTextContent('1')
    expect(view.getByTestId('metric-source')).toHaveTextContent('2')
    expect(
      within(view.getByTestId('domain-OA')).getByText('协同办公测试主题域')
    ).toBeInTheDocument()
    expect(view.container.querySelector('.catalog-tag')).toHaveTextContent('来源系统')
    expect(view.getAllByText('协同办公系统').length).toBeGreaterThan(0)
    expect(view.getAllByText('已发布').length).toBeGreaterThan(0)
  })

  it('submits real search filters and navigates through the existing dataset route', async () => {
    const view = renderCatalog()

    await waitFor(() => expect(view.getAllByText('测试B').length).toBeGreaterThan(0))
    await fireEvent.update(
      view.getByPlaceholderText('搜索数据集名称、编码或物理表名'),
      'test_family'
    )
    await fireEvent.click(view.getByRole('button', { name: '查询' }))

    await waitFor(() =>
      expect(catalogApi.getDatasetPage).toHaveBeenLastCalledWith({
        pageNo: 1,
        pageSize: 10,
        keyword: 'test_family'
      })
    )

    await fireEvent.click(view.getByRole('button', { name: '进入数据集管理' }))
    expect(routerApi.push).toHaveBeenCalledWith({ name: 'DataMarketDataset' })
  })

  it('keeps the latest dataset result when requests resolve out of order', async () => {
    const view = renderCatalog()

    await waitFor(() => expect(view.getAllByText('测试B').length).toBeGreaterThan(0))

    let resolveEarlier!: (value: { list: typeof datasets; total: number }) => void
    let resolveLatest!: (value: { list: typeof datasets; total: number }) => void
    const earlierRequest = new Promise<{ list: typeof datasets; total: number }>((resolve) => {
      resolveEarlier = resolve
    })
    const latestRequest = new Promise<{ list: typeof datasets; total: number }>((resolve) => {
      resolveLatest = resolve
    })
    catalogApi.getDatasetPage
      .mockImplementationOnce(() => earlierRequest)
      .mockImplementationOnce(() => latestRequest)

    const searchInput = view.getByPlaceholderText('搜索数据集名称、编码或物理表名')
    await fireEvent.update(searchInput, 'earlier')
    await fireEvent.click(view.getByRole('button', { name: '查询' }))
    await fireEvent.update(searchInput, 'latest')
    await fireEvent.click(view.getByRole('button', { name: '查询' }))

    resolveLatest({
      list: [{ ...datasets[0], id: 101, businessName: '最新请求结果' }],
      total: 1
    })
    await waitFor(() => expect(view.getByText('最新请求结果')).toBeInTheDocument())

    resolveEarlier({
      list: [{ ...datasets[0], id: 100, businessName: '较早请求结果' }],
      total: 1
    })
    await earlierRequest
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(view.getByText('最新请求结果')).toBeInTheDocument()
    expect(view.queryByText('较早请求结果')).not.toBeInTheDocument()
  })

  it('only calls permitted modules, preserves a real zero, and isolates API failures', async () => {
    const userStore = useUserStore()
    userStore.permissions = new Set([
      'data-market:dataset:query',
      'data-market:source-system:query'
    ])
    routerApi.getRoutes.mockReturnValue([
      route('DataMarketDataset', '/data-market-management/dataset'),
      route('DataMarketSourceSystem', '/data-market-management/source-system')
    ])
    catalogApi.getDatasetPage.mockResolvedValue({ list: [], total: 0 })
    catalogApi.getSourceSystemPage.mockRejectedValue(new Error('source unavailable'))

    const view = renderCatalog()

    await waitFor(() => expect(view.getByTestId('metric-dataset')).toHaveTextContent('0'))
    await waitFor(() => expect(view.getByTestId('metric-source')).toHaveTextContent('暂不可用'))

    expect(catalogApi.getSubjectDomainList).not.toHaveBeenCalled()
    expect(catalogApi.getTags).not.toHaveBeenCalled()
    expect(view.queryByTestId('metric-domain')).not.toBeInTheDocument()
    expect(view.queryByTestId('metric-tag')).not.toBeInTheDocument()
    expect(view.getByText('暂无匹配的数据集')).toBeInTheDocument()
  })
})
