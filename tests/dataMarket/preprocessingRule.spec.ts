import { defineComponent, h } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PreprocessingRulePage from '@/views/dataMarket/preprocessingRule/index.vue'

const apiMocks = vi.hoisted(() => ({
  getPreprocessingRulePage: vi.fn(),
  createPreprocessingRule: vi.fn(),
  updatePreprocessingRule: vi.fn(),
  deletePreprocessingRule: vi.fn(),
  getEnabledPreprocessingRules: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
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
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input aria-label="排序" type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />'
})
const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})
const AlertStub = defineComponent({
  props: ['title'],
  template: '<div role="alert">{{ title }}</div>'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: DialogStub,
    ElForm: FormStub,
    ElFormItem: SlotStub,
    ElInput: InputStub,
    ElInputNumber: InputNumberStub,
    ElSwitch: true,
    ElSelect: true,
    ElOption: true,
    ElTable: true,
    ElTableColumn: true,
    ElButton: ButtonStub,
    ElTag: true,
    ElAlert: AlertStub,
    Pagination: true
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('data-market preprocessing rule configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.getPreprocessingRulePage.mockResolvedValue({ list: [], total: 0 })
    apiMocks.createPreprocessingRule.mockResolvedValue(101)
    apiMocks.updatePreprocessingRule.mockResolvedValue(undefined)
    apiMocks.deletePreprocessingRule.mockResolvedValue(undefined)
    apiMocks.getEnabledPreprocessingRules.mockResolvedValue([])
  })

  it('validates parameter JSON and creates a named rule without exposing an ID field', async () => {
    const wrapper = render(PreprocessingRulePage, { global })

    await waitFor(() => expect(apiMocks.getPreprocessingRulePage).toHaveBeenCalledTimes(1))
    await fireEvent.click(wrapper.getByRole('button', { name: '新增预处理规则' }))
    await fireEvent.update(wrapper.getByPlaceholderText('例如 TRIM'), 'TRIM')
    await fireEvent.update(wrapper.getByPlaceholderText('例如 去除首尾空格'), '去除首尾空格')
    await fireEvent.update(wrapper.getByLabelText('参数结构 JSON'), '{invalid')
    await fireEvent.click(wrapper.getByRole('button', { name: '保存' }))

    expect(apiMocks.createPreprocessingRule).not.toHaveBeenCalled()
    expect(wrapper.getByRole('alert')).toHaveTextContent('参数结构必须是合法 JSON')
    expect(wrapper.queryByLabelText(/ID/i)).not.toBeInTheDocument()

    await fireEvent.update(wrapper.getByLabelText('参数结构 JSON'), '{"type":"object"}')
    await fireEvent.click(wrapper.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(apiMocks.createPreprocessingRule).toHaveBeenCalledTimes(1))
    expect(apiMocks.createPreprocessingRule).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TRIM',
        name: '去除首尾空格',
        parameterSchema: '{"type":"object"}',
        status: 0
      })
    )
  })
})
