import { defineComponent } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DomainPage from '@/views/dataMarket/domain/index.vue'
import DatasetPage from '@/views/dataMarket/dataset/index.vue'
import datasetPageSource from '@/views/dataMarket/dataset/index.vue?raw'
import SourceSystemPage from '@/views/dataMarket/sourceSystem/index.vue'

const catalogMocks = vi.hoisted(() => ({
  getSubjectDomainList: vi.fn(),
  getSourceSystemPage: vi.fn(),
  getDatasetPage: vi.fn(),
  getDataset: vi.fn(),
  createDataset: vi.fn(),
  updateDataset: vi.fn(),
  publishDataset: vi.fn(),
  createSubjectDomain: vi.fn(),
  updateSubjectDomain: vi.fn(),
  deleteSubjectDomain: vi.fn(),
  createSourceSystem: vi.fn(),
  updateSourceSystem: vi.fn(),
  deleteSourceSystem: vi.fn()
}))

const deptMocks = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const userMocks = vi.hoisted(() => ({ getSimpleUserList: vi.fn() }))

vi.mock('@/api/dataMarket/catalog', () => catalogMocks)
vi.mock('@/api/system/dept', () => deptMocks)
vi.mock('@/api/system/user', () => userMocks)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    delConfirm: vi.fn()
  })
}))

const domains = [
  { id: 1, name: '经营', code: 'BIZ', parentId: 0, sort: 1, status: 0 },
  { id: 2, name: '客户', code: 'CUSTOMER', parentId: 1, sort: 1, status: 0 }
]

const departments = [
  { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
  { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 }
]

const users = [{ id: 101, nickname: '王明', username: 'wangming', deptId: 11, deptName: '客户部' }]

const SlotStub = defineComponent({
  template: '<div><slot /><slot name="footer" /></div>'
})

const FormStub = defineComponent({
  props: { labelWidth: String },
  template:
    '<div data-testid="el-form" :data-label-width="labelWidth"><slot /><slot name="footer" /></div>'
})

const SubjectDomainSelectStub = defineComponent({
  name: 'SubjectDomainSelect',
  props: { allowTopLevel: Boolean, domains: { type: Array, default: () => [] } },
  template:
    "<div data-testid=\"subject-domain-select\" :data-allow-top-level=\"allowTopLevel ? 'true' : 'false'\">{{ domains.map((item) => item.name).join(',') }}</div>"
})

const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})

const DepartmentCascaderStub = defineComponent({
  name: 'DepartmentCascader',
  template: '<div data-testid="department-cascader"></div>'
})

const UserDepartmentSelectStub = defineComponent({
  name: 'UserDepartmentSelect',
  template: '<div data-testid="user-department-select"></div>'
})

const SourceSystemSelectStub = defineComponent({
  name: 'SourceSystemSelect',
  template: '<div data-testid="source-system-select"></div>'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: SlotStub,
    ElDrawer: SlotStub,
    ElForm: FormStub,
    ElFormItem: SlotStub,
    ElTable: true,
    ElTableColumn: true,
    ElButton: ButtonStub,
    ElInput: true,
    ElInputNumber: true,
    ElSwitch: true,
    ElSelect: true,
    ElOption: true,
    ElAlert: true,
    Pagination: true,
    DatasetActions: true,
    Icon: true,
    SubjectDomainSelect: SubjectDomainSelectStub,
    DepartmentCascader: DepartmentCascaderStub,
    UserDepartmentSelect: UserDepartmentSelectStub,
    SourceSystemSelect: SourceSystemSelectStub
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('data-market reference selector page wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogMocks.getSubjectDomainList.mockResolvedValue(domains)
    catalogMocks.getSourceSystemPage.mockResolvedValue({ list: [], total: 0 })
    catalogMocks.getDatasetPage.mockResolvedValue({ list: [], total: 0 })
    deptMocks.getSimpleDeptList.mockResolvedValue(departments)
    userMocks.getSimpleUserList.mockResolvedValue(users)
  })

  it('uses business selectors on domain and source-system forms', async () => {
    const domain = render(DomainPage, { global })
    await waitFor(() => expect(catalogMocks.getSubjectDomainList).toHaveBeenCalled())
    expect(domain.getByTestId('subject-domain-select')).toHaveAttribute(
      'data-allow-top-level',
      'true'
    )
    expect(domain.getByTestId('el-form')).toHaveAttribute('data-label-width', '110px')
    domain.unmount()

    const source = render(SourceSystemPage, { global })
    await waitFor(() => expect(catalogMocks.getSourceSystemPage).toHaveBeenCalled())
    expect(source.getByTestId('department-cascader')).toBeInTheDocument()
    expect(source.getByTestId('user-department-select')).toBeInTheDocument()
  })

  it('uses source-system and subject-domain selectors on dataset forms', async () => {
    const dataset = render(DatasetPage, { global })
    await waitFor(() => expect(catalogMocks.getDatasetPage).toHaveBeenCalled())
    expect(dataset.getByTestId('source-system-select')).toBeInTheDocument()
    expect(dataset.getAllByTestId('subject-domain-select')).toHaveLength(2)
  })

  it('refreshes subject domains whenever the dataset drawer opens', async () => {
    catalogMocks.getSubjectDomainList
      .mockResolvedValueOnce([domains[0]])
      .mockResolvedValueOnce(domains)

    const dataset = render(DatasetPage, { global })
    await waitFor(() => {
      expect(catalogMocks.getSubjectDomainList).toHaveBeenCalledTimes(1)
      expect(dataset.getAllByTestId('subject-domain-select')[0]).toHaveTextContent('经营')
      expect(dataset.getAllByTestId('subject-domain-select')[0]).not.toHaveTextContent('客户')
    })

    await fireEvent.click(dataset.getByRole('button', { name: '新增数据集' }))

    await waitFor(() => expect(catalogMocks.getSubjectDomainList).toHaveBeenCalledTimes(2))
    expect(dataset.getAllByTestId('subject-domain-select')[0]).toHaveTextContent('客户')
  })

  it('uses a standard-tag multi-select instead of accepting raw tag IDs', () => {
    expect(datasetPageSource).toContain('label="标准标签" prop="tagIds"')
    expect(datasetPageSource).toContain('v-model="publishForm.tagIds"')
    expect(datasetPageSource).toContain('placeholder="请选择标准标签"')
    expect(datasetPageSource).toContain('multiple')
    expect(datasetPageSource).not.toContain('tagIdsText')
  })
})
