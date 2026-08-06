import { defineComponent, h } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CallerSystemPage from '@/views/dataMarket/callerSystem/index.vue'

const callerSystemMocks = vi.hoisted(() => ({
  getCallerSystemPage: vi.fn(),
  createCallerSystem: vi.fn(),
  updateCallerSystem: vi.fn(),
  deleteCallerSystem: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  delConfirm: vi.fn()
}))

vi.mock('@/api/dataMarket/callerSystem', () => callerSystemMocks)
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
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template:
    '<input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
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

const global = {
  stubs: {
    ContentWrap: SlotStub,
    Dialog: DialogStub,
    ElForm: FormStub,
    ElFormItem: SlotStub,
    ElInput: InputStub,
    ElInputNumber: InputNumberStub,
    ElSwitch: true,
    ElTable: true,
    ElTableColumn: true,
    ElButton: ButtonStub,
    ElTag: true,
    Pagination: true
  },
  directives: {
    hasPermi: () => undefined,
    loading: () => undefined
  }
}

describe('data-market caller-system configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callerSystemMocks.getCallerSystemPage.mockResolvedValue({ list: [], total: 0 })
    callerSystemMocks.createCallerSystem.mockResolvedValue(81)
    callerSystemMocks.updateCallerSystem.mockResolvedValue(undefined)
    callerSystemMocks.deleteCallerSystem.mockResolvedValue(undefined)
  })

  it('loads the independent configuration page and creates a sorted option', async () => {
    const wrapper = render(CallerSystemPage, { global })

    await waitFor(() => expect(callerSystemMocks.getCallerSystemPage).toHaveBeenCalledTimes(1))
    await fireEvent.click(wrapper.getByRole('button', { name: '新增调用系统' }))
    await fireEvent.update(wrapper.getByPlaceholderText('例如 CRM'), 'CRM')
    await fireEvent.update(wrapper.getByPlaceholderText('例如 客户关系管理系统'), '客户关系管理系统')
    await fireEvent.update(wrapper.getByLabelText('排序'), '20')
    await fireEvent.click(wrapper.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(callerSystemMocks.createCallerSystem).toHaveBeenCalledTimes(1))
    expect(callerSystemMocks.createCallerSystem).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CRM', name: '客户关系管理系统', status: 0, sort: 20 })
    )
    expect(messageMocks.success).toHaveBeenCalledWith('保存成功')
  })
})
