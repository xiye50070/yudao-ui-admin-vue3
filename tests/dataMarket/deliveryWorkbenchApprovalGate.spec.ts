import { render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeliveryWorkbench from '@/views/dataMarket/deliveryWorkbench/index.vue'

const deliveryApi = vi.hoisted(() => ({
  getApplication: vi.fn(),
  getApplicationDelivery: vi.fn()
}))
const deptApi = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const userApi = vi.hoisted(() => ({ getSimpleUserList: vi.fn() }))

vi.mock('@/api/dataMarket/delivery', () => deliveryApi)
vi.mock('@/api/system/dept', () => deptApi)
vi.mock('@/api/system/user', () => userApi)
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { applicationId: '42' }, params: {} })
}))
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({ success: vi.fn(), warning: vi.fn() })
}))

const application = {
  id: 42,
  applicationNo: 'DMA-CURRENT',
  applicationType: 'CREATE',
  name: '当前审批申请',
  status: 'IN_APPROVAL',
  currentVersionNo: 1,
  datasetCount: 1,
  deliveredApiCount: 0,
  updateTime: '2026-08-05 22:18:46',
  lockVersion: 3,
  baseInfo: {
    name: '当前审批申请',
    reason: '审批未完成',
    businessScenario: '测试',
    callerSystemId: 1,
    callerSystem: 'OA',
    environment: 'TEST',
    useStartDate: '2026-08-05',
    useEndDate: '2026-08-06',
    longTerm: false,
    frequencyType: 'PER_DAY',
    dailyVolume: 1,
    peakVolume: 1
  },
  datasets: [],
  cleaningRules: [],
  processingItems: []
}

describe('delivery workbench approval gate', () => {
  beforeEach(() => {
    deliveryApi.getApplication.mockReset().mockResolvedValue(application)
    deliveryApi.getApplicationDelivery.mockReset().mockRejectedValue({ code: 1012000044 })
    deptApi.getSimpleDeptList.mockReset().mockResolvedValue([])
    userApi.getSimpleUserList.mockReset().mockResolvedValue([])
  })

  it('does not render the create-plan form before the whole BPM process is approved', async () => {
    const view = render(DeliveryWorkbench, {
      global: {
        directives: { hasPermi: {}, loading: {} },
        stubs: {
          ContentWrap: { template: '<section><slot /></section>' },
          ElAlert: { props: ['title'], template: '<div>{{ title }}</div>' },
          ElResult: {
            props: ['title', 'subTitle'],
            template: '<div>{{ title }} {{ subTitle }}<slot name="extra" /></div>'
          },
          ElDescriptions: { template: '<div><slot /></div>' },
          ElDescriptionsItem: { template: '<div><slot /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true,
          ElInputNumber: true,
          ElButton: true,
          ElTable: true,
          ElTableColumn: true,
          ElTabs: true,
          ElTabPane: true,
          ElSelect: true,
          ElOption: true,
          ElSwitch: true,
          ElDivider: true,
          Dialog: true,
          UserDepartmentSelect: true
        }
      }
    })

    await waitFor(() => expect(view.getByText('IN_APPROVAL')).toBeInTheDocument())
    expect(view.queryByTestId('delivery-plan-form')).not.toBeInTheDocument()
  })
})
