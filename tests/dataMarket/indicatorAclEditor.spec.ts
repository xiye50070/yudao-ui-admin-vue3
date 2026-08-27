import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IndicatorAclDialog from '@/views/dataMarket/indicator/IndicatorAclDialog.vue'

const indicatorApi = vi.hoisted(() => ({
  getIndicatorAcl: vi.fn(),
  updateIndicatorAcl: vi.fn()
}))
const deptApi = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const roleApi = vi.hoisted(() => ({ getSimpleRoleList: vi.fn() }))
const messageApi = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn()
}))

vi.mock('@/api/dataMarket/indicator', () => indicatorApi)
vi.mock('@/api/system/dept', () => deptApi)
vi.mock('@/api/system/role', () => roleApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => messageApi
}))

const renderDialog = () =>
  render(IndicatorAclDialog, {
    props: { modelValue: true, indicatorId: 41, indicatorName: '资产负债率' },
    global: {
      plugins: [ElementPlus],
      stubs: { Icon: true },
      directives: {
        hasPermi: () => undefined,
        loading: () => undefined
      }
    }
  })

describe('indicator ACL editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deptApi.getSimpleDeptList.mockResolvedValue([
      { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 }
    ])
    roleApi.getSimpleRoleList.mockResolvedValue([
      { id: 20, name: '指标查看人', code: 'indicator_viewer', status: 0 }
    ])
    indicatorApi.updateIndicatorAcl.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('rejects duplicate ACL principals', async () => {
    indicatorApi.getIndicatorAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 10, includeChildDept: false },
      { principalType: 'DEPT', principalId: 10, includeChildDept: true }
    ])
    renderDialog()

    await screen.findAllByRole('combobox', { name: '授权部门' })
    await fireEvent.click(screen.getByRole('button', { name: '保存 ACL' }))

    await waitFor(() =>
      expect(messageApi.warning).toHaveBeenCalledWith('同一部门或角色不能重复授权')
    )
    expect(indicatorApi.updateIndicatorAcl).not.toHaveBeenCalled()
  })

  it('normalizes includeChildDept to false for role ACL', async () => {
    indicatorApi.getIndicatorAcl.mockResolvedValue([
      { principalType: 'ROLE', principalId: 20, includeChildDept: true }
    ])
    renderDialog()

    await screen.findByRole('combobox', { name: '授权角色' })
    await fireEvent.click(screen.getByRole('button', { name: '保存 ACL' }))

    await waitFor(() =>
      expect(indicatorApi.updateIndicatorAcl).toHaveBeenCalledWith(41, [
        { principalType: 'ROLE', principalId: 20, includeChildDept: false }
      ])
    )
  })

  it('marks a principal that no longer exists without exposing its raw ID', async () => {
    indicatorApi.getIndicatorAcl.mockResolvedValue([
      { principalType: 'DEPT', principalId: 999, includeChildDept: false }
    ])
    renderDialog()

    expect(
      await screen.findByText('原授权主体已不存在，请重新选择或删除')
    ).toBeInTheDocument()
    expect(screen.queryByText('999')).not.toBeInTheDocument()
  })

  it('explains that zero ACL rules means tenant-wide visibility', async () => {
    indicatorApi.getIndicatorAcl.mockResolvedValue([])
    renderDialog()

    expect(
      await screen.findByText('未配置 ACL 时，租户内拥有指标浏览权限的用户均可查看该指标。')
    ).toBeInTheDocument()
  })
})
