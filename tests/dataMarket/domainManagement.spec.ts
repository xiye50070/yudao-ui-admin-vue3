import { defineComponent, h } from 'vue'
import ElementPlus from 'element-plus'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DomainManagement from '@/views/dataMarket/domain/index.vue'
import { hasPermi } from '@/directives/permission/hasPermi'
import { useUserStoreWithOut } from '@/store/modules/user'

const catalogApi = vi.hoisted(() => ({
  getSubjectDomainList: vi.fn(),
  createSubjectDomain: vi.fn(),
  updateSubjectDomain: vi.fn(),
  deleteSubjectDomain: vi.fn()
}))

const messageApi = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => messageApi
}))

const IconStub = defineComponent({
  name: 'Icon',
  props: { icon: String, size: Number },
  setup(props) {
    return () => h('span', { 'data-icon': props.icon, 'aria-hidden': 'true' })
  }
})

const DialogStub = defineComponent({
  name: 'Dialog',
  props: {
    modelValue: Boolean,
    title: String,
    width: String,
    alignCenter: Boolean
  },
  emits: ['update:modelValue'],
  template:
    '<section v-if="modelValue" role="dialog" :aria-label="title" :data-width="width"><h2>{{ title }}</h2><slot /><slot name="footer" /></section>'
})

const SubjectDomainSelectStub = defineComponent({
  name: 'SubjectDomainSelect',
  props: {
    modelValue: { type: Number, default: 0 },
    domains: { type: Array, default: () => [] },
    excludeBranchId: Number,
    allowTopLevel: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        'select',
        {
          'aria-label': '上级主题域',
          'data-testid': 'subject-domain-select',
          value: props.modelValue,
          onChange: (event: Event) =>
            emit('update:modelValue', Number((event.target as HTMLSelectElement).value))
        },
        [
          ...(props.allowTopLevel ? [h('option', { value: 0 }, '顶级主题域')] : []),
          ...(props.domains as typeof domains)
            .filter((domain) => domain.id !== props.excludeBranchId)
            .map((domain) => h('option', { value: domain.id }, domain.name))
        ]
      )
  }
})

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
  },
  {
    id: 13,
    code: 'HR_EMPLOYEE',
    name: '员工管理',
    parentId: 12,
    description: '员工主数据分类',
    sort: 1,
    status: 1
  }
]

const renderPage = () =>
  render(DomainManagement, {
    global: {
      plugins: [
        ElementPlus,
        {
          install(app) {
            hasPermi(app)
          }
        }
      ],
      stubs: {
        Dialog: DialogStub,
        Icon: IconStub,
        SubjectDomainSelect: SubjectDomainSelectStub
      }
    }
  })

describe('data market domain management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUserStoreWithOut().permissions = new Set([
      'data-market:domain:create',
      'data-market:domain:update',
      'data-market:domain:delete'
    ])
    catalogApi.getSubjectDomainList.mockResolvedValue(domains)
    catalogApi.createSubjectDomain.mockResolvedValue(undefined)
    catalogApi.updateSubjectDomain.mockResolvedValue(undefined)
    catalogApi.deleteSubjectDomain.mockResolvedValue(undefined)
    messageApi.delConfirm.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('summarizes the real subject-domain list by current status', async () => {
    const view = renderPage()

    await waitFor(() =>
      expect(view.getByRole('heading', { name: '业务主题域' })).toBeInTheDocument()
    )

    await waitFor(() =>
      expect(within(view.getByTestId('metric-total')).getByText('3')).toBeInTheDocument()
    )
    expect(within(view.getByTestId('metric-enabled')).getByText('2')).toBeInTheDocument()
    expect(within(view.getByTestId('metric-disabled')).getByText('1')).toBeInTheDocument()
  })

  it('shows the parent theme resolved from the loaded domain hierarchy', async () => {
    const view = renderPage()

    const childName = await view.findByText('员工管理')
    const childRow = childName.closest('tr')

    expect(childRow).not.toBeNull()
    expect(within(childRow as HTMLTableRowElement).getByText('人事系统')).toBeInTheDocument()
  })

  it('filters loaded domains by a keyword from the real name, code, or description fields', async () => {
    const view = renderPage()

    await view.findByText('员工管理')
    await fireEvent.update(view.getByPlaceholderText('搜索主题域名称、编码或说明'), '员工主数据')

    await waitFor(() => expect(view.queryByText('协同办公')).not.toBeInTheDocument())
    expect(view.getByText('员工管理')).toBeInTheDocument()
    expect(view.getByTestId('domain-result-count')).toHaveTextContent('显示 1 / 共 3')
  })

  it('filters the loaded list by the real enabled or disabled status', async () => {
    const view = renderPage()

    await view.findByText('员工管理')
    await fireEvent.click(view.getByRole('combobox', { name: '按状态筛选' }))
    await fireEvent.click(await view.findByRole('option', { name: '停用' }))

    await waitFor(() => expect(view.queryByText('协同办公')).not.toBeInTheDocument())
    expect(view.getByText('员工管理')).toBeInTheDocument()
    expect(view.getByTestId('domain-result-count')).toHaveTextContent('显示 1 / 共 3')
  })

  it('offers an in-page retry when the subject-domain request fails', async () => {
    catalogApi.getSubjectDomainList
      .mockRejectedValueOnce(new Error('domain unavailable'))
      .mockResolvedValueOnce(domains)
    const view = renderPage()

    await view.findByText('主题域加载失败')
    await fireEvent.click(view.getByRole('button', { name: '重新加载' }))

    await view.findByText('员工管理')
    expect(view.queryByText('主题域加载失败')).not.toBeInTheDocument()
  })

  it('does not present zero metrics as authoritative when the first request fails', async () => {
    catalogApi.getSubjectDomainList.mockRejectedValueOnce(new Error('domain unavailable'))
    const view = renderPage()

    await view.findByText('主题域加载失败')

    expect(within(view.getByTestId('metric-total')).getByText('—')).toBeInTheDocument()
    expect(within(view.getByTestId('metric-enabled')).getByText('—')).toBeInTheDocument()
    expect(within(view.getByTestId('metric-disabled')).getByText('—')).toBeInTheDocument()
  })

  it('does not keep presenting previously loaded metrics when a refresh fails', async () => {
    catalogApi.getSubjectDomainList
      .mockResolvedValueOnce(domains)
      .mockRejectedValueOnce(new Error('refresh unavailable'))
    const view = renderPage()

    await waitFor(() =>
      expect(within(view.getByTestId('metric-total')).getByText('3')).toBeInTheDocument()
    )
    await fireEvent.click(view.getByRole('button', { name: '刷新主题域' }))
    await view.findByText('主题域加载失败')

    expect(within(view.getByTestId('metric-total')).getByText('—')).toBeInTheDocument()
    expect(within(view.getByTestId('metric-enabled')).getByText('—')).toBeInTheDocument()
    expect(within(view.getByTestId('metric-disabled')).getByText('—')).toBeInTheDocument()
  })

  it('uses a neutral identifier when a referenced parent is absent from the loaded list', async () => {
    catalogApi.getSubjectDomainList.mockResolvedValueOnce([
      ...domains,
      {
        id: 14,
        code: 'ARCHIVE',
        name: '档案管理',
        parentId: 999,
        description: '档案分类',
        sort: 2,
        status: 0
      }
    ])
    const view = renderPage()

    const childName = await view.findByText('档案管理')
    const childRow = childName.closest('tr')

    expect(childRow).not.toBeNull()
    expect(
      within(childRow as HTMLTableRowElement).getByText('未找到（ID：999）')
    ).toBeInTheDocument()
  })

  it('validates and creates a domain with the current Element Plus form values', async () => {
    const view = renderPage()

    await view.findByText('员工管理')
    await fireEvent.click(view.getByRole('button', { name: '新增主题域' }))
    const dialog = view.getByRole('dialog', { name: '新增主题域' })

    expect(dialog).toHaveAttribute('data-width', 'min(600px, calc(100vw - 32px))')
    expect(within(dialog).getByPlaceholderText('请输入主题域名称')).toHaveAttribute(
      'maxlength',
      '64'
    )
    expect(within(dialog).getByPlaceholderText('说明该主题域覆盖的业务范围')).toHaveAttribute(
      'maxlength',
      '500'
    )

    await fireEvent.update(within(dialog).getByPlaceholderText('请输入主题域名称'), '客户管理')
    await fireEvent.update(
      within(dialog).getByPlaceholderText('例如 HR 或 CUSTOMER_DATA'),
      'CUSTOMER'
    )
    await fireEvent.update(within(dialog).getByRole('combobox', { name: '上级主题域' }), '12')
    await fireEvent.click(within(dialog).getByRole('button', { name: '保存' }))

    await waitFor(() =>
      expect(catalogApi.createSubjectDomain).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '客户管理',
          code: 'CUSTOMER',
          parentId: 12,
          status: 0
        })
      )
    )
    expect(messageApi.success).toHaveBeenCalledWith('保存成功')
    expect(view.queryByRole('dialog', { name: '新增主题域' })).not.toBeInTheDocument()
  })

  it('does not submit an empty create form to the API', async () => {
    const view = renderPage()

    await view.findByText('员工管理')
    await fireEvent.click(view.getByRole('button', { name: '新增主题域' }))
    const dialog = view.getByRole('dialog', { name: '新增主题域' })
    await fireEvent.click(within(dialog).getByRole('button', { name: '保存' }))
    await Promise.resolve()
    await Promise.resolve()

    expect(catalogApi.createSubjectDomain).not.toHaveBeenCalled()
    expect(catalogApi.updateSubjectDomain).not.toHaveBeenCalled()
  })

  it('prefills and updates the selected real domain', async () => {
    const view = renderPage()

    await view.findByText('协同办公')
    await fireEvent.click(view.getAllByRole('button', { name: '编辑' })[0])
    const dialog = view.getByRole('dialog', { name: '编辑主题域' })
    const nameInput = within(dialog).getByPlaceholderText('请输入主题域名称')

    expect(nameInput).toHaveValue('协同办公')
    expect(within(dialog).getByPlaceholderText('例如 HR 或 CUSTOMER_DATA')).toHaveValue('OA')
    expect(within(dialog).getByRole('combobox', { name: '上级主题域' })).toHaveValue('0')

    await fireEvent.update(nameInput, '协同办公域')
    await fireEvent.click(within(dialog).getByRole('button', { name: '保存' }))

    await waitFor(() =>
      expect(catalogApi.updateSubjectDomain).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ name: '协同办公域', code: 'OA', parentId: 0 })
      )
    )
  })

  it('confirms deletion before calling the domain delete API', async () => {
    const view = renderPage()

    await view.findByText('协同办公')
    await fireEvent.click(view.getAllByRole('button', { name: '删除' })[0])

    await waitFor(() => expect(messageApi.delConfirm).toHaveBeenCalledTimes(1))
    expect(catalogApi.deleteSubjectDomain).toHaveBeenCalledWith(11)
    expect(messageApi.success).toHaveBeenCalledWith('删除成功')
  })

  it('renders management actions from the existing domain permissions', async () => {
    useUserStoreWithOut().permissions = new Set(['data-market:domain:update'])
    const view = renderPage()

    await view.findByText('协同办公')

    expect(view.queryByRole('button', { name: '新增主题域' })).not.toBeInTheDocument()
    expect(view.getAllByRole('button', { name: '编辑' })).toHaveLength(3)
    expect(view.queryByRole('button', { name: '删除' })).not.toBeInTheDocument()
  })
})
