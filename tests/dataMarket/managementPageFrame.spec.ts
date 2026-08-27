import { defineComponent } from 'vue'
import ElementPlus from 'element-plus'
import { cleanup, render, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SourceSystemPage from '@/views/dataMarket/sourceSystem/index.vue'

const catalogApi = vi.hoisted(() => ({
  getSourceSystemPage: vi.fn(),
  createSourceSystem: vi.fn(),
  updateSourceSystem: vi.fn(),
  deleteSourceSystem: vi.fn()
}))
const departmentApi = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const userApi = vi.hoisted(() => ({ getSimpleUserList: vi.fn() }))

vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('@/api/system/dept', () => departmentApi)
vi.mock('@/api/system/user', () => userApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    delConfirm: vi.fn()
  })
}))

const DialogStub = defineComponent({
  name: 'Dialog',
  template: '<div><slot /><slot name="footer" /></div>'
})

const renderPage = () =>
  render(SourceSystemPage, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        Dialog: DialogStub,
        Pagination: true,
        DepartmentCascader: true,
        UserDepartmentSelect: true,
        Icon: true
      },
      directives: {
        hasPermi: () => undefined
      }
    }
  })

describe('data-market management page frame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogApi.getSourceSystemPage.mockResolvedValue({
      list: [
        {
          id: 7,
          code: 'FIN',
          name: '财务系统',
          ownerUserId: 101,
          ownerDeptId: 10,
          description: '财务核算数据来源',
          status: 0
        }
      ],
      total: 1
    })
    departmentApi.getSimpleDeptList.mockResolvedValue([
      { id: 10, name: '财务部', parentId: 0, sort: 1, status: 0 }
    ])
    userApi.getSimpleUserList.mockResolvedValue([
      { id: 101, nickname: '张三', username: 'zhangsan', deptId: 10, deptName: '财务部' }
    ])
  })

  afterEach(cleanup)

  it('places source-system management in a labelled business workspace', async () => {
    const view = renderPage()

    await view.findByText('财务系统')

    expect(view.getByRole('main')).toBeInTheDocument()
    expect(view.getByRole('heading', { name: '来源系统', level: 1 })).toBeInTheDocument()
    expect(view.getByText('维护数据来源、责任归属与目录接入状态')).toBeInTheDocument()
  })

  it('shows the authoritative result count and source-system status', async () => {
    const view = renderPage()

    const sourceName = await view.findByText('财务系统')
    const sourceRow = sourceName.closest('tr')

    expect(view.getByText('共 1 个来源系统')).toBeInTheDocument()
    expect(sourceRow).not.toBeNull()
    expect(within(sourceRow as HTMLTableRowElement).getByText('启用')).toBeInTheDocument()
  })
})
