import { defineComponent, h, inject, provide, toRef } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApplicationView from '@/views/dataMarket/application/index.vue'

const deliveryApi = vi.hoisted(() => ({
  getApplicationPage: vi.fn(),
  getApplication: vi.fn(),
  getApplicationTimeline: vi.fn()
}))

vi.mock('@/api/dataMarket/delivery', () => deliveryApi)
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const tableRowKey = Symbol('tableRow')

const TableRowStub = defineComponent({
  props: ['row'],
  setup(props, { slots }) {
    provide(tableRowKey, toRef(props, 'row'))
    return () => h('div', slots.default?.())
  }
})

const TableStub = defineComponent({
  props: ['data'],
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        { 'data-testid': 'application-rows' },
        props.data.map((row) =>
          h(TableRowStub, { key: row.id, row }, { default: () => slots.default?.() })
        )
      )
  }
})

const TableColumnStub = defineComponent({
  props: ['prop'],
  setup(props, { slots }) {
    const row = inject<any>(tableRowKey)
    return () =>
      h(
        'div',
        slots.default ? slots.default({ row: row.value }) : String(row.value[props.prop] ?? '')
      )
  }
})

const ButtonStub = defineComponent({
  emits: ['click'],
  setup(_, { attrs, emit, slots }) {
    return () => h('button', { ...attrs, onClick: () => emit('click') }, slots.default?.())
  }
})

const currentApplication = {
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
    reason: '审批绑定测试',
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

describe('data-market application BPM binding', () => {
  beforeEach(() => {
    deliveryApi.getApplicationPage.mockReset()
    deliveryApi.getApplication.mockReset()
    deliveryApi.getApplicationTimeline.mockReset()
    deliveryApi.getApplicationPage.mockResolvedValue({
      list: [
        {
          ...currentApplication,
          id: 7,
          applicationNo: 'DMA-UNRELATED',
          name: '无关草稿',
          status: 'DRAFT'
        },
        currentApplication
      ],
      total: 2
    })
    deliveryApi.getApplication.mockResolvedValue(currentApplication)
    deliveryApi.getApplicationTimeline.mockResolvedValue([])
  })

  it('shows only the application identified by the BPM business key', async () => {
    const view = render(ApplicationView, {
      props: { id: 'DATA_MARKET:42' },
      global: {
        stubs: {
          ContentWrap: { template: '<section><slot /></section>' },
          ElTable: TableStub,
          ElTableColumn: TableColumnStub,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElInputNumber: true,
          ElButton: ButtonStub,
          ElDrawer: { template: '<aside><slot /></aside>' },
          ElEmpty: true,
          Pagination: true
        }
      }
    })

    await waitFor(() => expect(view.getByText('DMA-CURRENT')).toBeInTheDocument())
    expect(view.queryByText('DMA-UNRELATED')).not.toBeInTheDocument()
  })

  it('does not expose delivery creation while the application is still in approval', async () => {
    const view = render(ApplicationView, {
      props: { id: 'DATA_MARKET:42' },
      global: {
        directives: { hasPermi: {}, loading: {} },
        stubs: {
          ContentWrap: { template: '<section><slot /></section>' },
          ElTable: TableStub,
          ElTableColumn: TableColumnStub,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElInputNumber: true,
          ElButton: ButtonStub,
          ElDrawer: { template: '<aside><slot /></aside>' },
          ElEmpty: true,
          ElDescriptions: { template: '<div><slot /></div>' },
          ElDescriptionsItem: { template: '<div><slot /></div>' },
          ElDivider: true,
          ElCollapse: true,
          ElCollapseItem: true,
          ElTimeline: true,
          ElTimelineItem: true,
          ElTag: true,
          Pagination: true
        }
      }
    })

    await fireEvent.click(await view.findByTestId('application-no-42'))
    await waitFor(() => expect(view.getByText('当前审批申请')).toBeInTheDocument())
    expect(view.queryByTestId('create-delivery-42')).not.toBeInTheDocument()
  })
})
