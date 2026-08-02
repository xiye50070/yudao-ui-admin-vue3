import { defineComponent, nextTick } from 'vue'
import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import DepartmentCascader from '@/views/dataMarket/components/DepartmentCascader.vue'
import SourceSystemSelect from '@/views/dataMarket/components/SourceSystemSelect.vue'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
import UserDepartmentSelect from '@/views/dataMarket/components/UserDepartmentSelect.vue'
import userDepartmentSelectSource from '@/views/dataMarket/components/UserDepartmentSelect.vue?raw'

const domains = [
  { id: 1, name: '经营', code: 'BIZ', parentId: 0, sort: 1, status: 0 },
  { id: 2, name: '客户', code: 'CUSTOMER', parentId: 1, sort: 1, status: 0 }
]

const departments = [
  { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
  { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 },
  { id: 20, name: '技术中心', parentId: 0, sort: 2, status: 0 }
]

const users = [
  { id: 101, nickname: '王明', username: 'wangming', deptId: 11, deptName: '客户部' },
  { id: 102, nickname: '李工', username: 'ligong', deptId: 20, deptName: '技术中心' }
]

const TreeSelectStub = defineComponent({
  name: 'ElTreeSelect',
  props: ['modelValue', 'data'],
  emits: ['update:modelValue'],
  template:
    '<button data-testid="tree" @click="$emit(\'update:modelValue\', 2)">{{ data[0]?.name }}</button>'
})

const CascaderStub = defineComponent({
  name: 'ElCascader',
  props: ['modelValue', 'options', 'props'],
  emits: ['update:modelValue'],
  template:
    '<button data-testid="cascader" :data-emit-path="String(props.emitPath)" @click="$emit(\'update:modelValue\', 11)">cascader</button>'
})

const DepartmentCascaderStub = defineComponent({
  name: 'DepartmentCascader',
  emits: ['update:modelValue'],
  template:
    '<button data-testid="lookup-dept" @click="$emit(\'update:modelValue\', 10)">lookup</button>'
})

const UserSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue', 'filterMethod'],
  emits: ['update:modelValue'],
  template: `
    <div>
      <button data-testid="user-search" @click="filterMethod('wang')">search</button>
      <button data-testid="user" @click="$emit('update:modelValue', 101)">user</button>
      <slot />
    </div>
  `
})

const RemoteSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue', 'remoteMethod'],
  emits: ['update:modelValue'],
  template: `
    <div>
      <button data-testid="remote-search" @click="remoteMethod('客户')">search</button>
      <button data-testid="source-select" @click="$emit('update:modelValue', 2)">select</button>
      <slot />
    </div>
  `
})

const OptionStub = defineComponent({
  name: 'ElOption',
  props: ['label', 'value', 'disabled'],
  template: '<span data-testid="option">{{ label }}</span>'
})

describe('data-market reference selector components', () => {
  it('lets the owner lookup columns wrap with the available container width', () => {
    expect(userDepartmentSelectSource).toContain(
      'grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))'
    )
  })

  it('emits scalar IDs and exposes hierarchy options', async () => {
    const subject = render(SubjectDomainSelect, {
      props: { modelValue: 0, domains, allowTopLevel: true },
      global: { stubs: { ElTreeSelect: TreeSelectStub } }
    })
    expect(subject.getByTestId('tree')).toHaveTextContent('顶级主题域')
    await fireEvent.click(subject.getByTestId('tree'))
    expect(subject.emitted('update:modelValue')).toEqual([[2]])
    subject.unmount()

    const department = render(DepartmentCascader, {
      props: { modelValue: undefined, departments },
      global: { stubs: { ElCascader: CascaderStub } }
    })
    expect(department.getByTestId('cascader')).toHaveAttribute('data-emit-path', 'false')
    await fireEvent.click(department.getByTestId('cascader'))
    expect(department.emitted('update:modelValue')).toEqual([[11]])
  })

  it('keeps lookup department local and emits only the chosen user', async () => {
    const wrapper = render(UserDepartmentSelect, {
      props: { modelValue: undefined, departments, users },
      global: {
        stubs: {
          DepartmentCascader: DepartmentCascaderStub,
          ElSelect: UserSelectStub,
          ElOption: OptionStub,
          ElTag: true
        }
      }
    })

    await fireEvent.click(wrapper.getByTestId('lookup-dept'))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.queryByText('王明（wangming）')).toBeInTheDocument()
    expect(wrapper.queryByText('李工（ligong）')).not.toBeInTheDocument()

    await fireEvent.click(wrapper.getByTestId('user-search'))
    await nextTick()
    expect(wrapper.queryByText('王明（wangming）')).toBeInTheDocument()

    await fireEvent.click(wrapper.getByTestId('user'))
    expect(wrapper.emitted('update:modelValue')).toEqual([[101]])
  })

  it('forwards source-system searches without changing the selected id', async () => {
    const wrapper = render(SourceSystemSelect, {
      props: {
        modelValue: 1,
        options: [{ id: 1, name: '客户系统', code: 'CRM' }]
      },
      global: { stubs: { ElSelect: RemoteSelectStub, ElOption: OptionStub } }
    })

    expect(wrapper.queryByText('客户系统（CRM）')).toBeInTheDocument()
    await fireEvent.click(wrapper.getByTestId('remote-search'))
    expect(wrapper.emitted('search')).toEqual([['客户']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await fireEvent.click(wrapper.getByTestId('source-select'))
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
  })
})
