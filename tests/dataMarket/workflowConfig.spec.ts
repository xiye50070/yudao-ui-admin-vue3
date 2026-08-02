import { defineComponent, h } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowConfigPage from '@/views/dataMarket/workflowConfig/index.vue'

const workflowMocks = vi.hoisted(() => ({
  getWorkflowConfig: vi.fn(),
  updateWorkflowConfig: vi.fn()
}))

const definitionMocks = vi.hoisted(() => ({
  getSimpleProcessDefinitionList: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('@/api/dataMarket/workflow', () => workflowMocks)
vi.mock('@/api/bpm/definition', () => definitionMocks)
vi.mock('@/hooks/web/useMessage', () => ({ useMessage: () => messageMocks }))

const SlotStub = defineComponent({ template: '<div><slot /></div>' })

const FormStub = defineComponent({
  setup(_, { slots, expose }) {
    expose({ validate: () => Promise.resolve(true) })
    return () => h('div', { 'data-testid': 'workflow-form' }, slots.default?.())
  }
})

const SelectStub = defineComponent({
  props: ['modelValue', 'loading', 'disabled'],
  emits: ['update:modelValue', 'change'],
  template: `
    <div
      data-testid="process-definition-select"
      :data-loading="String(Boolean(loading))"
      :data-disabled="String(Boolean(disabled))"
    >
      <button
        data-testid="choose-active-flow"
        @click="$emit('update:modelValue', 'active-flow'); $emit('change', 'active-flow')"
      >选择流程</button>
      <slot />
    </div>
  `
})

const OptionStub = defineComponent({
  props: {
    label: String,
    value: String,
    disabled: Boolean
  },
  template:
    '<span data-testid="definition-option" :data-value="value" :data-disabled="String(Boolean(disabled))">{{ label }}</span>'
})

const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>'
})

const global = {
  stubs: {
    ContentWrap: SlotStub,
    ElAlert: true,
    ElTabs: SlotStub,
    ElTabPane: SlotStub,
    ElForm: FormStub,
    ElFormItem: SlotStub,
    ElSelect: SelectStub,
    ElOption: OptionStub,
    ElSwitch: true,
    ElButton: ButtonStub
  },
  directives: { hasPermi: () => undefined }
}

describe('data-market workflow configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workflowMocks.getWorkflowConfig.mockResolvedValue({
      processDefinitionKey: 'current-flow',
      processDefinitionName: '当前流程',
      status: 0
    })
    workflowMocks.updateWorkflowConfig.mockResolvedValue(undefined)
    definitionMocks.getSimpleProcessDefinitionList.mockResolvedValue([
      { id: 'definition-1', key: 'active-flow', name: '启用流程' },
      { id: 'definition-2', key: 'active-flow', name: '启用流程' }
    ])
  })

  it('loads active definitions, deduplicates keys and saves the selected name and key', async () => {
    const wrapper = render(WorkflowConfigPage, { global })

    await waitFor(() =>
      expect(definitionMocks.getSimpleProcessDefinitionList).toHaveBeenCalledTimes(1)
    )
    expect(wrapper.getByTestId('process-definition-select')).toBeInTheDocument()
    expect(await wrapper.findAllByText('启用流程（active-flow）')).toHaveLength(1)

    await fireEvent.click(wrapper.getByTestId('choose-active-flow'))
    await fireEvent.click(wrapper.getByRole('button', { name: '保存 新建申请 流程' }))

    await waitFor(() => expect(workflowMocks.updateWorkflowConfig).toHaveBeenCalledTimes(1))
    expect(workflowMocks.updateWorkflowConfig).toHaveBeenCalledWith(
      'CREATE',
      expect.objectContaining({
        processDefinitionKey: 'active-flow',
        processDefinitionName: '启用流程',
        status: 0
      })
    )
  })

  it('keeps a missing historical definition visible as a disabled option', async () => {
    workflowMocks.getWorkflowConfig.mockResolvedValue({
      processDefinitionKey: 'retired-flow',
      processDefinitionName: '旧流程',
      status: 0
    })

    const wrapper = render(WorkflowConfigPage, { global })

    const legacyOption = await wrapper.findByText('旧流程（retired-flow） · 已停用或不可见')
    expect(legacyOption).toHaveAttribute('data-disabled', 'true')
  })
})
