import { defineComponent, h } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LogicalFieldTypePage from '@/views/dataMarket/logicalFieldType/index.vue'

const apiMocks = vi.hoisted(() => ({
  getLogicalFieldTypePage: vi.fn(),
  getLogicalFieldType: vi.fn(),
  getEnabledLogicalFieldTypes: vi.fn(),
  createLogicalFieldType: vi.fn(),
  updateLogicalFieldType: vi.fn(),
  deleteLogicalFieldType: vi.fn(),
  previewFieldType: vi.fn(),
  getEnabledPreprocessingRules: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/preprocessing', () => apiMocks)
vi.mock('@/hooks/web/useMessage', () => ({ useMessage: () => messageMocks }))

const SlotStub = defineComponent({ template: '<div><slot /></div>' })
const DialogStub = defineComponent({
  props: ['modelValue', 'title'],
  template:
    '<section v-if="modelValue"><h2>{{ title }}</h2><slot /><slot name="footer" /></section>'
})
const FormStub = defineComponent({
  setup(_, { slots, expose }) {
    expose({ validate: () => Promise.resolve(true) })
    return () => h('div', slots.default?.())
  }
})
const InputStub = defineComponent({
  inheritAttrs: false,
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template:
    '<input v-bind="$attrs" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const InputNumberStub = defineComponent({
  inheritAttrs: false,
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input v-bind="$attrs" type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />'
})
const SelectStub = defineComponent({
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number, Array] },
    multiple: Boolean
  },
  emits: ['update:modelValue'],
  methods: {
    update(event: Event) {
      const target = event.target as HTMLSelectElement
      if (this.multiple) {
        this.$emit(
          'update:modelValue',
          Array.from(target.selectedOptions).map((option) => Number(option.value))
        )
        return
      }
      this.$emit('update:modelValue', target.value)
    }
  },
  template:
    '<select v-bind="$attrs" :multiple="multiple" :value="modelValue" @change="update"><slot /></select>'
})
const OptionStub = defineComponent({
  props: ['label', 'value', 'disabled'],
  template: '<option :value="value" :disabled="disabled">{{ label }}</option>'
})
const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: DialogStub,
    ElForm: FormStub,
    ElFormItem: SlotStub,
    ElInput: InputStub,
    ElInputNumber: InputNumberStub,
    ElSelect: SelectStub,
    ElOption: OptionStub,
    ElSwitch: true,
    ElTable: true,
    ElTableColumn: true,
    ElButton: ButtonStub,
    ElTag: true,
    ElAlert: SlotStub,
    Pagination: true
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('data-market logical field type configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.getLogicalFieldTypePage.mockResolvedValue({ list: [], total: 0 })
    apiMocks.getEnabledPreprocessingRules.mockResolvedValue([
      {
        id: 101,
        code: 'TRIM',
        name: '去除首尾空格',
        category: 'STANDARDIZE',
        description: '',
        sort: 10,
        status: 0
      },
      {
        id: 102,
        code: 'MASK',
        name: '脱敏处理',
        category: 'SECURITY',
        description: '',
        sort: 20,
        status: 0
      }
    ])
    apiMocks.createLogicalFieldType.mockResolvedValue(201)
    apiMocks.updateLogicalFieldType.mockResolvedValue(undefined)
    apiMocks.deleteLogicalFieldType.mockResolvedValue(undefined)
    apiMocks.previewFieldType.mockResolvedValue({
      actualType: 'VARCHAR2(100)',
      normalizedActualType: 'VARCHAR2(100)',
      status: 'MATCHED',
      logicalType: { id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 },
      candidates: [{ id: 201, code: 'TEXT', name: '文本', sort: 10, status: 0 }]
    })
  })

  it('configures multiple matchers and named preprocessing rules without exposing IDs', async () => {
    const wrapper = render(LogicalFieldTypePage, { global })

    await waitFor(() => expect(apiMocks.getLogicalFieldTypePage).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(apiMocks.getEnabledPreprocessingRules).toHaveBeenCalledTimes(1))
    await fireEvent.click(wrapper.getByRole('button', { name: '新增字段类型' }))
    await fireEvent.update(wrapper.getByPlaceholderText('例如 TEXT'), 'TEXT')
    await fireEvent.update(wrapper.getByPlaceholderText('例如 文本'), '文本')

    await fireEvent.click(wrapper.getByRole('button', { name: '新增匹配条件' }))
    await fireEvent.click(wrapper.getByRole('button', { name: '新增匹配条件' }))
    await fireEvent.update(wrapper.getByLabelText('匹配表达式 1'), 'VARCHAR')
    await fireEvent.update(wrapper.getByLabelText('匹配表达式 2'), '^VARCHAR2\\(\\d+\\)$')
    await fireEvent.update(wrapper.getByLabelText('匹配方式 2'), 'REGEX')

    expect(wrapper.getByRole('option', { name: '去除首尾空格（TRIM）' })).toBeInTheDocument()
    expect(wrapper.getByRole('option', { name: '脱敏处理（MASK）' })).toBeInTheDocument()
    const ruleSelect = wrapper.getByLabelText('适用预处理规则') as HTMLSelectElement
    ruleSelect.options[0].selected = true
    ruleSelect.options[1].selected = true
    await fireEvent.change(ruleSelect)

    await fireEvent.update(wrapper.getByLabelText('实际类型试算'), 'VARCHAR2(100)')
    await fireEvent.click(wrapper.getByRole('button', { name: '试算' }))
    expect(await wrapper.findByText('匹配结果：文本（TEXT）')).toBeInTheDocument()

    await fireEvent.click(wrapper.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(apiMocks.createLogicalFieldType).toHaveBeenCalledTimes(1))
    expect(apiMocks.createLogicalFieldType).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TEXT',
        name: '文本',
        ruleTemplateIds: [101, 102],
        matchers: [
          expect.objectContaining({ matchMode: 'EXACT', matchExpression: 'VARCHAR' }),
          expect.objectContaining({
            matchMode: 'REGEX',
            matchExpression: '^VARCHAR2\\(\\d+\\)$'
          })
        ]
      })
    )
    expect(wrapper.queryByLabelText(/ID/i)).not.toBeInTheDocument()
  })
})
