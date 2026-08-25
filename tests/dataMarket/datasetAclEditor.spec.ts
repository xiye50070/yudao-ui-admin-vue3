import { computed, defineComponent, h, inject, provide, type ComputedRef } from 'vue'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DatasetPage from '@/views/dataMarket/dataset/index.vue'

const catalogMocks = vi.hoisted(() => ({
  getDatasetPage: vi.fn(),
  getSubjectDomainList: vi.fn(),
  getSourceSystemPage: vi.fn()
}))
const securityMocks = vi.hoisted(() => ({
  getDatasetAcl: vi.fn(),
  updateDatasetAcl: vi.fn()
}))
const deptMocks = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const roleMocks = vi.hoisted(() => ({ getSimpleRoleList: vi.fn() }))
const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  confirm: vi.fn(),
  delConfirm: vi.fn()
}))

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

vi.mock('@/api/dataMarket/catalog', () => catalogMocks)
vi.mock('@/api/dataMarket/security', () => securityMocks)
vi.mock('@/api/system/dept', () => deptMocks)
vi.mock('@/api/system/role', () => roleMocks)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => messageMocks
}))

const tableRowsKey = Symbol('tableRows')

const SlotStub = defineComponent({
  template: '<div><slot /><slot name="footer" /></div>'
})

const DialogStub = defineComponent({
  props: { title: String },
  template: '<section :data-testid="`dialog-${title}`"><slot /><slot name="footer" /></section>'
})

const TableStub = defineComponent({
  props: { data: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    provide(
      tableRowsKey,
      computed(() => props.data as Record<string, unknown>[])
    )
    return () => h('div', slots.default?.())
  }
})

const TableColumnStub = defineComponent({
  setup(_, { slots }) {
    const rows = inject<ComputedRef<Record<string, unknown>[]>>(
      tableRowsKey,
      computed(() => [])
    )
    return () =>
      h(
        'div',
        rows.value.map((row, index) =>
          h('div', { key: index }, slots.default?.({ row, $index: index }))
        )
      )
  }
})

const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})

const SelectStub = defineComponent({
  props: { placeholder: String, modelValue: [String, Number, Array] },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    const isPrincipalType = () => props.modelValue === 'DEPT' || props.modelValue === 'ROLE'
    const switchPrincipalType = () => {
      const next = props.modelValue === 'DEPT' ? 'ROLE' : 'DEPT'
      emit('update:modelValue', next)
      emit('change', next)
    }
    return () =>
      h(
        'div',
        {
          'data-testid': props.placeholder === '请选择角色' ? 'role-principal-select' : 'select',
          'data-model-value': props.modelValue
        },
        [
          slots.default?.(),
          isPrincipalType()
            ? h('button', { type: 'button', onClick: switchPrincipalType }, '切换主体类型')
            : undefined
        ]
      )
  }
})

const OptionStub = defineComponent({
  props: { label: String },
  template: '<span>{{ label }}<slot /></span>'
})

const TreeSelectStub = defineComponent({
  props: { data: { type: Array, default: () => [] }, modelValue: Number },
  emits: ['update:modelValue', 'change'],
  computed: {
    names(): string {
      const visit = (items: any[]): string[] =>
        items.flatMap((item) => [item.name, ...visit(item.children || [])])
      return visit(this.data as any[]).join('、')
    },
    firstDepartmentId(): number | undefined {
      return (this.data[0] as { id?: number } | undefined)?.id
    }
  },
  methods: {
    selectFirstDepartment() {
      this.$emit('update:modelValue', this.firstDepartmentId)
      this.$emit('change', this.firstDepartmentId)
    }
  },
  template:
    '<div data-testid="department-principal-select">{{ names }}<button type="button" :aria-label="`选择部门：${names}`" @click="selectFirstDepartment" /></div>'
})

const InputNumberStub = defineComponent({
  template: '<input type="number" />'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: DialogStub,
    ElDrawer: SlotStub,
    ElForm: SlotStub,
    ElFormItem: SlotStub,
    ElTable: TableStub,
    ElTableColumn: TableColumnStub,
    ElButton: ButtonStub,
    ElInput: true,
    ElInputNumber: InputNumberStub,
    ElSwitch: true,
    ElSelect: SelectStub,
    ElTreeSelect: TreeSelectStub,
    ElOption: OptionStub,
    ElTag: SlotStub,
    ElAlert: true,
    Pagination: true,
    DatasetActions: true,
    DatasetStandardDrawer: true,
    Icon: true,
    SubjectDomainSelect: true,
    SourceSystemSelect: true
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('dataset ACL editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogMocks.getDatasetPage.mockResolvedValue({
      list: [
        {
          id: 42,
          datasetCode: 'EMPLOYEE',
          businessName: '员工数据',
          sourceSystemId: 1,
          subjectDomainId: 1,
          sensitivityLevel: 1,
          publishStatus: 0
        }
      ],
      total: 1
    })
    catalogMocks.getSubjectDomainList.mockResolvedValue([])
    catalogMocks.getSourceSystemPage.mockResolvedValue({ list: [], total: 0 })
    securityMocks.getDatasetAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 10, includeChildDept: true },
      { principalType: 'ROLE', principalId: 20, includeChildDept: false }
    ])
    deptMocks.getSimpleDeptList.mockResolvedValue([
      { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 }
    ])
    roleMocks.getSimpleRoleList.mockResolvedValue([
      { id: 20, name: '数据申请人', code: 'data_market_applicant', status: 0 }
    ])
    securityMocks.updateDatasetAcl.mockResolvedValue(undefined)
  })

  it('selects ACL principals by department or role name without exposing numeric IDs', async () => {
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() => {
      expect(dialog.getByTestId('department-principal-select')).toHaveTextContent('业务中心')
      expect(dialog.getByTestId('role-principal-select')).toHaveTextContent(
        '数据申请人（data_market_applicant）'
      )
    })
    expect(dialog.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(dialog.queryByText('10')).not.toBeInTheDocument()
    expect(dialog.queryByText('20')).not.toBeInTheDocument()
  })

  it('replaces a deleted principal with a business-facing recovery message', async () => {
    securityMocks.getDatasetAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 999, includeChildDept: false }
    ])
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    expect(await dialog.findByText('原授权主体已不存在，请重新选择或删除')).toBeInTheDocument()
    expect(dialog.queryByText('999')).not.toBeInTheDocument()
  })

  it('removes an ACL rule by its visible row action', async () => {
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() => expect(dialog.getByText('业务中心')).toBeInTheDocument())
    await fireEvent.click(dialog.getAllByRole('button', { name: '删除' })[0])

    await waitFor(() => expect(dialog.queryByText('业务中心')).not.toBeInTheDocument())
    expect(dialog.getByTestId('role-principal-select')).toHaveTextContent('数据申请人')
  })

  it('rejects duplicate authorization for the same department', async () => {
    securityMocks.getDatasetAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 10, includeChildDept: false },
      { principalType: 'DEPT', principalId: 10, includeChildDept: true }
    ])
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() =>
      expect(dialog.getAllByTestId('department-principal-select')).toHaveLength(2)
    )
    await fireEvent.click(dialog.getByRole('button', { name: '保存 ACL' }))

    await waitFor(() =>
      expect(messageMocks.warning).toHaveBeenCalledWith('同一部门或角色不能重复授权')
    )
    expect(securityMocks.updateDatasetAcl).not.toHaveBeenCalled()
  })

  it('rejects duplicate authorization for the same role', async () => {
    securityMocks.getDatasetAcl.mockResolvedValue([
      { principalType: 'ROLE', principalId: 20, includeChildDept: false },
      { principalType: 'ROLE', principalId: 20, includeChildDept: false }
    ])
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() => expect(dialog.getAllByTestId('role-principal-select')).toHaveLength(2))
    await fireEvent.click(dialog.getByRole('button', { name: '保存 ACL' }))

    await waitFor(() =>
      expect(messageMocks.warning).toHaveBeenCalledWith('同一部门或角色不能重复授权')
    )
    expect(securityMocks.updateDatasetAcl).not.toHaveBeenCalled()
  })

  it('saves a department selection with its internal ID only in the API payload', async () => {
    securityMocks.getDatasetAcl.mockResolvedValue([])
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() => expect(dialog.getByRole('button', { name: '新增 ACL' })).toBeEnabled())
    await fireEvent.click(dialog.getByRole('button', { name: '新增 ACL' }))
    await fireEvent.click(dialog.getByRole('button', { name: '选择部门：业务中心' }))
    await fireEvent.click(dialog.getByRole('button', { name: '保存 ACL' }))

    await waitFor(() =>
      expect(securityMocks.updateDatasetAcl).toHaveBeenCalledWith(42, [
        { principalType: 'DEPT', principalId: 10, includeChildDept: false }
      ])
    )
  })

  it('clears the previous selection when the principal type changes', async () => {
    securityMocks.getDatasetAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 10, includeChildDept: true }
    ])
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() => expect(dialog.getByText('业务中心')).toBeInTheDocument())
    await fireEvent.click(dialog.getByRole('button', { name: '切换主体类型' }))

    const roleSelect = await dialog.findByTestId('role-principal-select')
    expect(roleSelect).not.toHaveAttribute('data-model-value', '10')
  })

  it('does not save an empty ACL when principal references fail to load', async () => {
    roleMocks.getSimpleRoleList.mockRejectedValue(new Error('role service unavailable'))
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))
    await waitFor(() => expect(messageMocks.error).toHaveBeenCalledWith('ACL 配置加载失败，请重试'))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await fireEvent.click(dialog.getByRole('button', { name: '保存 ACL' }))
    expect(securityMocks.updateDatasetAcl).not.toHaveBeenCalled()
  })

  it('disables saving while ACL principals are still loading', async () => {
    securityMocks.getDatasetAcl.mockReturnValue(new Promise(() => undefined))
    render(DatasetPage, { global })

    await fireEvent.click(await screen.findByRole('button', { name: 'ACL' }))

    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    const saveButton = dialog.getByRole('button', { name: '保存 ACL' })
    expect(saveButton).toBeDisabled()
    saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await Promise.resolve()
    expect(securityMocks.updateDatasetAcl).not.toHaveBeenCalled()
  })

  it('keeps the latest dataset ACL when earlier requests finish out of order', async () => {
    const firstAcl =
      deferred<Array<{ principalType: 'DEPT'; principalId: number; includeChildDept: boolean }>>()
    const secondAcl =
      deferred<Array<{ principalType: 'ROLE'; principalId: number; includeChildDept: boolean }>>()
    catalogMocks.getDatasetPage.mockResolvedValue({
      list: [
        {
          id: 42,
          datasetCode: 'EMPLOYEE',
          businessName: '员工数据',
          sourceSystemId: 1,
          subjectDomainId: 1,
          sensitivityLevel: 1,
          publishStatus: 0
        },
        {
          id: 43,
          datasetCode: 'CUSTOMER',
          businessName: '客户数据',
          sourceSystemId: 1,
          subjectDomainId: 1,
          sensitivityLevel: 1,
          publishStatus: 0
        }
      ],
      total: 2
    })
    securityMocks.getDatasetAcl
      .mockImplementationOnce(() => firstAcl.promise)
      .mockImplementationOnce(() => secondAcl.promise)
    render(DatasetPage, { global })

    const aclButtons = await screen.findAllByRole('button', { name: 'ACL' })
    await fireEvent.click(aclButtons[0])
    await fireEvent.click(aclButtons[1])

    secondAcl.resolve([{ principalType: 'ROLE', principalId: 20, includeChildDept: false }])
    const dialog = within(screen.getByTestId('dialog-数据集 ACL'))
    await waitFor(() =>
      expect(dialog.getByTestId('role-principal-select')).toHaveTextContent('数据申请人')
    )

    firstAcl.resolve([{ principalType: 'DEPT', principalId: 10, includeChildDept: true }])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(dialog.queryByTestId('department-principal-select')).not.toBeInTheDocument()

    await fireEvent.click(dialog.getByRole('button', { name: '保存 ACL' }))
    await waitFor(() =>
      expect(securityMocks.updateDatasetAcl).toHaveBeenCalledWith(43, [
        { principalType: 'ROLE', principalId: 20, includeChildDept: false }
      ])
    )
  })
})
