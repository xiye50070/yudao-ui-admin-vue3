import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeliveryWorkbench from '@/views/dataMarket/deliveryWorkbench/index.vue'
import { acceptanceBlockingMessages } from '@/views/dataMarket/deliveryWorkbench/acceptanceReadiness'

const deliveryApi = vi.hoisted(() => ({
  getApplication: vi.fn(),
  getApplicationDelivery: vi.fn(),
  submitApplicationAcceptance: vi.fn()
}))

vi.mock('@/api/dataMarket/delivery', () => deliveryApi)
vi.mock('@/api/system/dept', () => ({ getSimpleDeptList: vi.fn().mockResolvedValue([]) }))
vi.mock('@/api/system/user', () => ({ getSimpleUserList: vi.fn().mockResolvedValue([]) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { applicationId: '8' }, params: {} })
}))
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({
    success: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn().mockResolvedValue(undefined)
  })
}))

const application = {
  id: 8,
  applicationNo: 'DMA-0008',
  applicationType: 'CREATE',
  name: '统一验收门禁',
  status: 'CONFIGURING',
  currentVersionNo: 1,
  datasetCount: 1,
  deliveredApiCount: 2,
  updateTime: '2026-08-11 15:00:00',
  lockVersion: 1,
  baseInfo: {},
  datasets: [],
  cleaningRules: [],
  processingItems: []
}

const workbench = {
  id: 3,
  applicationId: 8,
  deliveryNo: 'DMD-0003',
  status: 'CONFIGURING',
  planDescription: '交付两个 API',
  ownerUserId: 1,
  lockVersion: 0,
  acceptanceReadiness: {
    ready: false,
    unreadyApiCount: 2
  },
  tasks: [],
  apis: [
    {
      id: 2,
      apiNo: 'API-0002',
      name: '订单 API',
      status: 'ACTIVE',
      versions: [],
      credentials: []
    }
  ]
}

const renderWorkbench = () =>
  render(DeliveryWorkbench, {
    global: {
      directives: { hasPermi: {}, loading: {} },
      stubs: {
        ContentWrap: { template: '<section><slot /></section>' },
        ElAlert: {
          props: ['title'],
          template: '<div role="alert">{{ title }}<slot /></div>'
        },
        ElResult: true,
        ElDescriptions: { template: '<div><slot /></div>' },
        ElDescriptionsItem: { template: '<div><slot /></div>' },
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { props: ['label'], template: '<label>{{ label }}<slot /></label>' },
        ElSteps: { template: '<div><slot /></div>' },
        ElStep: true,
        ElInput: true,
        ElInputNumber: true,
        ElTag: true,
        ElButton: {
          props: ['type'],
          template: '<button type="button" :disabled="$attrs.disabled"><slot /></button>'
        },
        ElTable: { template: '<div><slot /></div>' },
        ElTableColumn: true,
        ElSelect: true,
        ElOption: true,
        ElSwitch: true,
        ElDivider: true,
        UserDepartmentSelect: true
      }
    }
  })

describe('delivery acceptance readiness', () => {
  beforeEach(() => {
    deliveryApi.getApplication.mockReset().mockResolvedValue(application)
    deliveryApi.getApplicationDelivery.mockReset().mockResolvedValue(workbench)
    deliveryApi.submitApplicationAcceptance.mockReset().mockResolvedValue(1)
  })

  it('describes only the current application API blocker', () => {
    expect(acceptanceBlockingMessages(workbench.acceptanceReadiness)).toEqual([
      '还有 2 个 API 未完成发布版本、生产运行绑定或有效凭证配置'
    ])
  })

  it('disables acceptance submission and does not call the API while blockers remain', async () => {
    const view = renderWorkbench()

    await waitFor(() => expect(view.getByText('提交统一验收')).toBeInTheDocument())
    expect(
      view.getByText('还有 2 个 API 未完成发布版本、生产运行绑定或有效凭证配置')
    ).toBeInTheDocument()
    expect(view.queryByText('当前阶段')).not.toBeInTheDocument()
    expect(view.queryByText('完成阶段')).not.toBeInTheDocument()
    const submit = view.getByText('提交统一验收').closest('button')
    expect(submit).not.toBeNull()
    expect(submit as HTMLButtonElement).toBeDisabled()
    await fireEvent.click(submit as HTMLButtonElement)
    expect(deliveryApi.submitApplicationAcceptance).not.toHaveBeenCalled()
  })

  it('submits one ready application by its route application id', async () => {
    deliveryApi.getApplicationDelivery.mockResolvedValueOnce({
      ...workbench,
      acceptanceReadiness: { ready: true, unreadyApiCount: 0 }
    })
    const view = renderWorkbench()

    await waitFor(() => expect(view.getByText('提交统一验收')).toBeInTheDocument())
    expect(view.queryByText('当前阶段')).not.toBeInTheDocument()
    expect(view.queryByText('完成阶段')).not.toBeInTheDocument()
    expect(view.getByText('验收说明（可选）')).toBeInTheDocument()
    await fireEvent.click(view.getByText('提交统一验收'))

    await waitFor(() =>
      expect(deliveryApi.submitApplicationAcceptance).toHaveBeenCalledWith(8, undefined)
    )
  })
})
