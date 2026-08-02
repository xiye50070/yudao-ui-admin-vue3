import { defineComponent } from 'vue'
import { render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DomainPage from '@/views/dataMarket/domain/index.vue'
import SourceSystemPage from '@/views/dataMarket/sourceSystem/index.vue'

const catalogMocks = vi.hoisted(() => ({
  getSubjectDomainList: vi.fn(),
  getSourceSystemPage: vi.fn(),
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

const SubjectDomainSelectStub = defineComponent({
  name: 'SubjectDomainSelect',
  props: { allowTopLevel: Boolean },
  template:
    '<div data-testid="subject-domain-select" :data-allow-top-level="allowTopLevel ? \'true\' : \'false\'"></div>'
})

const DepartmentCascaderStub = defineComponent({
  name: 'DepartmentCascader',
  template: '<div data-testid="department-cascader"></div>'
})

const UserDepartmentSelectStub = defineComponent({
  name: 'UserDepartmentSelect',
  template: '<div data-testid="user-department-select"></div>'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: SlotStub,
    ElForm: SlotStub,
    ElFormItem: SlotStub,
    ElTable: true,
    ElTableColumn: true,
    ElButton: true,
    ElInput: true,
    ElInputNumber: true,
    ElSwitch: true,
    Pagination: true,
    Icon: true,
    SubjectDomainSelect: SubjectDomainSelectStub,
    DepartmentCascader: DepartmentCascaderStub,
    UserDepartmentSelect: UserDepartmentSelectStub
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
    domain.unmount()

    const source = render(SourceSystemPage, { global })
    await waitFor(() => expect(catalogMocks.getSourceSystemPage).toHaveBeenCalled())
    expect(source.getByTestId('department-cascader')).toBeInTheDocument()
    expect(source.getByTestId('user-department-select')).toBeInTheDocument()
  })
})
