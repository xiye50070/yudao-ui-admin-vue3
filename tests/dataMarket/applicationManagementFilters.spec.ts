import { defineComponent, h, inject, provide, toRef } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApplicationView from '@/views/dataMarket/application/index.vue'

const deliveryApi = vi.hoisted(() => ({
  getApplicationPage: vi.fn(),
  getApplication: vi.fn(),
  getApplicationTimeline: vi.fn()
}))
const deptApi = vi.hoisted(() => ({ getSimpleDeptList: vi.fn() }))
const userApi = vi.hoisted(() => ({ getSimpleUserList: vi.fn() }))

vi.mock('@/api/dataMarket/delivery', () => deliveryApi)
vi.mock('@/api/system/dept', () => deptApi)
vi.mock('@/api/system/user', () => userApi)
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
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
        props.data.map((row) =>
          h(TableRowStub, { key: row.id, row }, { default: () => slots.default?.() })
        )
      )
  }
})
const TableColumnStub = defineComponent({
  props: ['prop', 'label'],
  setup(props, { slots }) {
    const row = inject<any>(tableRowKey)
    return () =>
      h('div', [
        h('span', { 'data-column-label': props.label }, props.label),
        slots.default ? slots.default({ row: row.value }) : String(row.value[props.prop] ?? '')
      ])
  }
})
const ButtonStub = defineComponent({
  emits: ['click'],
  setup(_, { attrs, emit, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          onClick: (event: MouseEvent) => {
            event.preventDefault()
            emit('click')
          }
        },
        slots.default?.()
      )
  }
})
const ModelButtonStub = defineComponent({
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const testId = String(attrs['data-testid'] || '')
    const nextValues: Record<string, unknown> = {
      'application-status-filter': ['IN_APPROVAL', 'CONFIGURING'],
      'application-applicant-filter': 'user:7',
      'application-update-time-filter': ['2026-08-01 00:00:00', '2026-08-06 23:59:59'],
      'application-update-time-sort': 'ASC'
    }
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          onClick: (event: MouseEvent) => {
            event.preventDefault()
            emit('update:modelValue', nextValues[testId])
          }
        },
        String(props.modelValue ?? '')
      )
  }
})

const application = {
  id: 42,
  applicationNo: 'DMA-42',
  applicationType: 'CREATE',
  name: '待交付申请',
  status: 'CONFIGURING',
  currentVersionNo: 1,
  datasetCount: 1,
  deliveredApiCount: 0,
  applicantUserId: 7,
  applicantDeptId: 11,
  updateTime: '2026-08-06T10:20:30'
}

const globalOptions = {
  directives: { hasPermi: {}, loading: {} },
  stubs: {
    ContentWrap: { template: '<section><slot /></section>' },
    ElForm: { template: '<form><slot /></form>' },
    ElFormItem: { template: '<label><slot /></label>' },
    ElSelect: ModelButtonStub,
    ElCascader: ModelButtonStub,
    ElDatePicker: ModelButtonStub,
    ElOption: true,
    ElButton: ButtonStub,
    ElTable: TableStub,
    ElTableColumn: TableColumnStub,
    ElTag: { template: '<span><slot /></span>' },
    ElAlert: { props: ['title'], template: '<div>{{ title }}<slot /></div>' },
    ElDrawer: { template: '<aside><slot /></aside>' },
    ElEmpty: true,
    Pagination: true
  }
}

describe('application management filters', () => {
  beforeEach(() => {
    deliveryApi.getApplicationPage.mockReset().mockResolvedValue({ list: [application], total: 1 })
    deliveryApi.getApplication.mockReset()
    deliveryApi.getApplicationTimeline.mockReset()
    deptApi.getSimpleDeptList.mockReset().mockResolvedValue([
      { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
      { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 }
    ])
    userApi.getSimpleUserList
      .mockReset()
      .mockResolvedValue([{ id: 7, nickname: '王明', username: 'wangming', deptId: 11, status: 0 }])
  })

  it('sends structured filters and renders readable applicant, status and update time', async () => {
    const view = render(ApplicationView, { global: globalOptions })

    await waitFor(() => expect(view.getByText('DMA-42')).toBeInTheDocument())
    expect(view.getByText('王明（wangming）')).toBeInTheDocument()
    expect(view.getByText('待交付')).toBeInTheDocument()
    expect(view.getAllByText('申请数量')).not.toHaveLength(0)
    expect(view.getByText('2026-08-06 10:20:30')).toBeInTheDocument()

    deliveryApi.getApplicationPage.mockClear()
    await fireEvent.click(view.getByTestId('application-status-filter'))
    await fireEvent.click(view.getByTestId('application-applicant-filter'))
    await fireEvent.click(view.getByTestId('application-update-time-filter'))
    await fireEvent.click(view.getByTestId('application-update-time-sort'))
    await fireEvent.click(view.getByTestId('application-filter-submit'))

    await waitFor(() =>
      expect(deliveryApi.getApplicationPage).toHaveBeenCalledWith({
        pageNo: 1,
        pageSize: 10,
        statuses: ['IN_APPROVAL', 'CONFIGURING'],
        applicantUserId: 7,
        updateTime: ['2026-08-01 00:00:00', '2026-08-06 23:59:59'],
        updateTimeSort: 'ASC'
      })
    )
  })

  it('keeps application rows visible and disables applicant filtering when references fail', async () => {
    deptApi.getSimpleDeptList.mockRejectedValue(new Error('department unavailable'))

    const view = render(ApplicationView, { global: globalOptions })

    await waitFor(() => expect(view.getByText('DMA-42')).toBeInTheDocument())
    expect(view.getByText('申请人数据加载失败')).toBeInTheDocument()
    expect(view.getByTestId('application-applicant-filter')).toBeDisabled()
  })
})
