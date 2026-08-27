import { computed, defineComponent, h, inject, provide, type InjectionKey, type Ref } from 'vue'
import { fireEvent, render, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DatasetPage from '@/views/dataMarket/dataset/index.vue'

const catalogMocks = vi.hoisted(() => ({
  getDatasetPage: vi.fn(),
  getDataset: vi.fn(),
  createDataset: vi.fn(),
  updateDataset: vi.fn(),
  deleteDataset: vi.fn(),
  getDatasetFields: vi.fn(),
  updateDatasetFields: vi.fn(),
  getSubjectDomainList: vi.fn(),
  getTags: vi.fn(),
  getSourceSystemPage: vi.fn(),
  publishDataset: vi.fn()
}))

const preprocessingMocks = vi.hoisted(() => ({
  getEnabledLogicalFieldTypes: vi.fn(),
  previewFieldType: vi.fn()
}))

const securityMocks = vi.hoisted(() => ({
  getDatasetAcl: vi.fn(),
  updateDatasetAcl: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  confirm: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/catalog', () => catalogMocks)
vi.mock('@/api/dataMarket/preprocessing', () => preprocessingMocks)
vi.mock('@/api/dataMarket/security', () => securityMocks)
vi.mock('@/hooks/web/useMessage', () => ({ useMessage: () => messageMocks }))

const SlotStub = defineComponent({ template: '<div><slot /></div>' })
const DialogStub = defineComponent({
  props: ['modelValue', 'title'],
  template:
    '<section v-if="modelValue"><h2>{{ title }}</h2><slot /><slot name="footer" /></section>'
})
const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})
const InputStub = defineComponent({
  inheritAttrs: false,
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue', 'change'],
  template: `<input
    v-bind="$attrs"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    @change="$emit('change', $event.target.value)"
  />`
})
const SelectStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: [String, Number, Array] }, multiple: Boolean },
  emits: ['update:modelValue', 'change'],
  methods: {
    update(event: Event) {
      const target = event.target as HTMLSelectElement
      const raw = this.multiple
        ? Array.from(target.selectedOptions).map((option) => option.value)
        : target.value
      const value = Array.isArray(raw)
        ? raw.map((item) => (Number.isNaN(Number(item)) ? item : Number(item)))
        : Number.isNaN(Number(raw))
          ? raw
          : Number(raw)
      this.$emit('update:modelValue', value)
      this.$emit('change', value)
    }
  },
  template:
    '<select v-bind="$attrs" :multiple="multiple" :value="modelValue" @change="update"><slot /></select>'
})
const OptionStub = defineComponent({
  props: ['label', 'value', 'disabled'],
  template: '<option :value="value" :disabled="disabled">{{ label }}</option>'
})

const tableRowKey: InjectionKey<Ref<any>> = Symbol('table-row')
const TableStub = defineComponent({
  props: ['data'],
  setup(props, { slots }) {
    const row = computed(() => props.data?.[0])
    provide(tableRowKey, row)
    return () => h('div', slots.default?.())
  }
})
const TableColumnStub = defineComponent({
  props: {
    label: String,
    width: [String, Number],
    minWidth: [String, Number]
  },
  setup(props, { slots }) {
    const row = inject(tableRowKey)!
    return () =>
      h(
        'section',
        {
          'data-column-label': props.label,
          'data-column-width': props.width,
          'data-column-min-width': props.minWidth
        },
        [
          props.label ? h('div', { role: 'columnheader' }, props.label) : undefined,
          row.value && slots.default ? slots.default({ row: row.value }) : undefined
        ]
      )
  }
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: DialogStub,
    ElDrawer: DialogStub,
    ElForm: SlotStub,
    ElFormItem: SlotStub,
    ElInput: InputStub,
    ElInputNumber: true,
    ElSelect: SelectStub,
    ElOption: OptionStub,
    ElSwitch: true,
    ElTable: TableStub,
    ElTableColumn: TableColumnStub,
    ElButton: ButtonStub,
    ElAlert: true,
    ElTag: true,
    Pagination: true,
    Icon: true,
    DatasetActions: true,
    DatasetStandardDrawer: true,
    SourceSystemSelect: true,
    SubjectDomainSelect: true
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('dataset field logical-type selector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogMocks.getDatasetPage.mockResolvedValue({
      list: [{ id: 42, businessName: '员工数据', datasetCode: 'EMPLOYEE' }],
      total: 1
    })
    catalogMocks.getSubjectDomainList.mockResolvedValue([])
    catalogMocks.getSourceSystemPage.mockResolvedValue({ list: [], total: 0 })
    catalogMocks.getDatasetFields.mockResolvedValue([
      {
        id: 8,
        datasetId: 42,
        fieldCode: 'EMPLOYEE_NO',
        fieldName: '员工编号',
        dataType: 'VARCHAR',
        nullable: false,
        primaryKey: true,
        joinKey: false,
        sensitivityLevel: 1,
        status: 0,
        logicalTypeMatchStatus: 'UNMATCHED',
        logicalTypeCandidates: []
      }
    ])
    preprocessingMocks.getEnabledLogicalFieldTypes.mockResolvedValue([
      { id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 },
      { id: 202, code: 'DATE', name: '日期', sort: 20, status: 0 }
    ])
    preprocessingMocks.previewFieldType.mockResolvedValue({
      actualType: 'VARCHAR2(100)',
      normalizedActualType: 'VARCHAR2(100)',
      status: 'MATCHED',
      logicalType: { id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 },
      candidates: [{ id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 }]
    })
  })

  it('keeps actual types separate and only rematches an assigned logical type explicitly', async () => {
    const wrapper = render(DatasetPage, { global })

    await waitFor(() => expect(catalogMocks.getDatasetPage).toHaveBeenCalledTimes(1))
    await fireEvent.click(await wrapper.findByRole('button', { name: '字段' }))
    await waitFor(() => expect(catalogMocks.getDatasetFields).toHaveBeenCalledWith(42))
    await waitFor(() =>
      expect(preprocessingMocks.getEnabledLogicalFieldTypes).toHaveBeenCalledTimes(1)
    )

    expect(wrapper.getByRole('columnheader', { name: '实际类型' })).toBeInTheDocument()
    expect(wrapper.getByRole('columnheader', { name: '逻辑类型' })).toBeInTheDocument()
    expect(wrapper.getByRole('option', { name: '文本（TEXT）' })).toBeInTheDocument()
    expect(wrapper.queryByLabelText(/逻辑类型 ID/i)).not.toBeInTheDocument()

    const actualTypeInput = wrapper.getByLabelText('员工编号实际类型')
    await fireEvent.update(actualTypeInput, 'VARCHAR2(100)')
    await fireEvent.change(actualTypeInput)
    await waitFor(() =>
      expect(preprocessingMocks.previewFieldType).toHaveBeenCalledWith('VARCHAR2(100)')
    )
    const logicalTypeSelect = wrapper.getByLabelText('员工编号逻辑类型')
    expect(logicalTypeSelect).toHaveValue('201')

    await fireEvent.update(logicalTypeSelect, '202')
    expect(logicalTypeSelect).toHaveValue('202')

    await fireEvent.update(actualTypeInput, 'NUMBER(10)')
    await fireEvent.change(actualTypeInput)
    expect(preprocessingMocks.previewFieldType).toHaveBeenCalledTimes(1)
    expect(logicalTypeSelect).toHaveValue('202')

    preprocessingMocks.previewFieldType.mockResolvedValueOnce({
      actualType: 'NUMBER(10)',
      normalizedActualType: 'NUMBER(10)',
      status: 'MATCHED',
      logicalType: { id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 },
      candidates: [{ id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 }]
    })
    await fireEvent.click(wrapper.getByRole('button', { name: '重新匹配' }))
    await waitFor(() => expect(preprocessingMocks.previewFieldType).toHaveBeenCalledTimes(2))
    expect(logicalTypeSelect).toHaveValue('201')
  })

  it('keeps the sensitivity number control inside a dedicated field column', async () => {
    const wrapper = render(DatasetPage, { global })

    await waitFor(() => expect(catalogMocks.getDatasetPage).toHaveBeenCalledTimes(1))
    await fireEvent.click(await wrapper.findByRole('button', { name: '字段' }))
    await waitFor(() => expect(catalogMocks.getDatasetFields).toHaveBeenCalledWith(42))

    const fieldDialog = wrapper.getByRole('heading', { name: '字段编辑' }).parentElement!
    const sensitivityColumn = within(fieldDialog)
      .getByRole('columnheader', { name: '敏感级' })
      .closest('[data-column-label="敏感级"]')

    expect(sensitivityColumn).toHaveAttribute('data-column-width', '168')
    const sensitivityInput = within(fieldDialog).getByLabelText('员工编号敏感级')
    expect(sensitivityInput).toHaveClass('!w-1/1')
  })
})
