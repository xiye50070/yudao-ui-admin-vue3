# 数据市场管理端引用选择器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把业务主题域、来源系统和数据集表单中的裸 ID 输入改造成可搜索、可回显且保留现有接口契约的层级引用选择器。

**Architecture:** 在数据市场视图目录中增加一个纯函数模块和四个小型选择器组件，统一处理树构建、循环排除、缺失历史引用、部门后代过滤及来源系统选项合并。主题域、来源系统和数据集页面只加载引用数据、维护业务表单并向现有接口提交数值 ID；不修改后端、数据库或请求模型。

**Tech Stack:** Vue 3.5、TypeScript 6、Vite 8、Element Plus 2.13、Vitest 4、Testing Library/Vue Test Utils、现有 Axios 适配器。

## Global Constraints

- 管理端仓库固定为 `/Users/wangmingzhang/idea_project/yudao-ui-admin-vue3-data-market`。
- 不修改数据库表结构、后端接口、请求字段或权限模型。
- 不新增 npm 依赖，复用 Element Plus 和现有 `/system/user/simple-list`、`/system/dept/simple-list`、数据市场目录接口。
- 所有级联和树选择器必须以单个数值 ID 更新表单，不能提交路径数组、名称或页面筛选状态。
- 负责人查找部门与来源系统负责部门互相独立，不自动赋值、不互相校验、不互相清空。
- 负责人部门筛选包含所选部门及其全部下级部门，并同时支持昵称、账号、部门名称搜索。
- 数据集必须选择实际主题域；只有主题域自身的上级选择器允许“顶级主题域”并映射为 `parentId = 0`。
- 编辑历史数据时不得因为引用选项已停用或不可见而自动清空已保存 ID。
- 页面展示业务名称，不再把裸 ID 作为主题域、来源系统、负责人或负责部门的主要文案。
- 保留现有蓝白管理端样式和自适应布局；负责人组合控件在窄宽度下允许换行。

---

## File Structure

- Create `src/views/dataMarket/referenceSelectors.ts`: 无 Vue 状态的层级、筛选、缺失引用和来源系统选项纯函数。
- Create `src/views/dataMarket/components/SubjectDomainSelect.vue`: 主题域树选择器，支持虚拟顶级节点和排除编辑分支。
- Create `src/views/dataMarket/components/DepartmentCascader.vue`: 多层级部门级联选择器，始终向外发出单个部门 ID。
- Create `src/views/dataMarket/components/UserDepartmentSelect.vue`: 独立部门级联筛选和可搜索负责人选择组合控件。
- Create `src/views/dataMarket/components/SourceSystemSelect.vue`: 来源系统远程搜索选择器。
- Modify `src/views/dataMarket/domain/index.vue`: 使用主题域组件替换“上级 ID”。
- Modify `src/views/dataMarket/sourceSystem/index.vue`: 加载用户、部门引用，替换负责人/负责部门输入并显示名称。
- Modify `src/views/dataMarket/dataset/index.vue`: 加载主题域和来源系统引用，替换新增、编辑、发布中的 ID 输入并显示名称。
- Create `tests/dataMarket/referenceSelectors.spec.ts`: 纯函数单元测试。
- Create `tests/dataMarket/referenceSelectorComponents.spec.ts`: 四个选择器组件的输入输出测试。
- Create `tests/dataMarket/referenceSelectorPages.spec.ts`: 三个管理页面的选择器接线测试。

---

### Task 1: 引用树与人员筛选纯函数

**Files:**
- Create: `src/views/dataMarket/referenceSelectors.ts`
- Test: `tests/dataMarket/referenceSelectors.spec.ts`

**Interfaces:**
- Consumes: `SubjectDomainVO`, `SourceSystemVO`, `DeptVO`, `UserVO` 的现有字段。
- Produces: `ReferenceNode`, `SourceSystemOption`, `collectBranchIds`, `buildReferenceTree`, `buildSubjectDomainParentTree`, `ensureSelectedReferenceNode`, `filterOwnerUsers`, `formatSourceSystemLabel`, `mergeSourceSystemOptions`。

- [ ] **Step 1: 写入失败的层级、筛选和合并测试**

```ts
import { describe, expect, it } from 'vitest'
import {
  buildReferenceTree,
  buildSubjectDomainParentTree,
  collectBranchIds,
  ensureSelectedReferenceNode,
  filterOwnerUsers,
  formatSourceSystemLabel,
  mergeSourceSystemOptions
} from '@/views/dataMarket/referenceSelectors'

const domains = [
  { id: 1, name: '经营', code: 'BIZ', parentId: 0, sort: 1, status: 0 },
  { id: 2, name: '客户', code: 'CUSTOMER', parentId: 1, sort: 1, status: 0 },
  { id: 3, name: '客户画像', code: 'PORTRAIT', parentId: 2, sort: 1, status: 0 },
  { id: 4, name: '财务', code: 'FIN', parentId: 0, sort: 2, status: 0 }
]

const departments = [
  { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
  { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 },
  { id: 12, name: '客户运营组', parentId: 11, sort: 1, status: 0 },
  { id: 20, name: '技术中心', parentId: 0, sort: 2, status: 0 }
]

const users = [
  { id: 101, nickname: '王明', username: 'wangming', deptId: 11, deptName: '客户部' },
  { id: 102, nickname: '李工', username: 'ligong', deptId: 20, deptName: '技术中心' },
  { id: 103, nickname: '赵云', username: 'zhaoyun', deptId: 12, deptName: '客户运营组' }
]

describe('data-market reference selectors', () => {
  it('builds hierarchy and removes the edited domain branch', () => {
    expect(buildSubjectDomainParentTree(domains, 2)).toEqual([
      {
        id: 0,
        name: '顶级主题域',
        children: [
          { id: 1, name: '经营', children: [] },
          { id: 4, name: '财务', children: [] }
        ]
      }
    ])
  })

  it('collects a department and every descendant', () => {
    expect([...collectBranchIds(departments, 10)]).toEqual([10, 11, 12])
    expect(buildReferenceTree(departments)[0].children?.[0].children?.[0].id).toBe(12)
  })

  it('combines department range and user text search while retaining the selected user', () => {
    expect(filterOwnerUsers(users, departments, { deptId: 10, keyword: 'wang' }).map((u) => u.id)).toEqual([101])
    expect(filterOwnerUsers(users, departments, { deptId: 10, keyword: '技术', selectedUserId: 102 }).map((u) => u.id)).toEqual([102])
  })

  it('adds a readable placeholder for an unavailable saved reference', () => {
    expect(ensureSelectedReferenceNode([], 99)).toEqual([
      { id: 99, name: '已停用或不可见', disabled: true, children: [] }
    ])
  })

  it('formats and de-duplicates source-system options by id', () => {
    expect(formatSourceSystemLabel({ id: 1, name: '客户系统', code: 'CRM' })).toBe('客户系统（CRM）')
    expect(
      mergeSourceSystemOptions(
        [{ id: 1, name: '客户系统' }],
        [{ id: 1, name: '客户系统', code: 'CRM' }, { id: 2, name: '财务系统', code: 'FIN' }]
      )
    ).toEqual([
      { id: 1, name: '客户系统', code: 'CRM' },
      { id: 2, name: '财务系统', code: 'FIN' }
    ])
  })
})
```

- [ ] **Step 2: 运行聚焦测试并确认 RED**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectors.spec.ts`

Expected: FAIL，提示无法解析 `@/views/dataMarket/referenceSelectors` 或导出函数不存在。

- [ ] **Step 3: 实现最小纯函数模块**

```ts
import type { SourceSystemVO } from '@/api/dataMarket/types'
import type { DeptVO } from '@/api/system/dept'
import type { UserVO } from '@/api/system/user'

export interface FlatReference {
  id?: number
  name: string
  parentId: number
  sort?: number
  status?: number
}

export interface ReferenceNode {
  id: number
  name: string
  disabled?: boolean
  children: ReferenceNode[]
}

export interface SourceSystemOption {
  id: number
  name: string
  code?: string
  status?: number
}

export const collectBranchIds = (items: FlatReference[], rootId?: number): Set<number> => {
  if (rootId === undefined) return new Set()
  const childrenByParent = new Map<number, number[]>()
  items.forEach((item) => {
    if (item.id === undefined) return
    const children = childrenByParent.get(item.parentId) || []
    children.push(item.id)
    childrenByParent.set(item.parentId, children)
  })
  const ids = new Set<number>()
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    if (ids.has(id)) continue
    ids.add(id)
    queue.push(...(childrenByParent.get(id) || []))
  }
  return ids
}

export const buildReferenceTree = (
  items: FlatReference[],
  excludedRootId?: number
): ReferenceNode[] => {
  const excluded = collectBranchIds(items, excludedRootId)
  const rows = items
    .filter((item): item is FlatReference & { id: number } => item.id !== undefined && !excluded.has(item.id))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  const nodes = new Map(rows.map((row) => [row.id, {
    id: row.id,
    name: row.name,
    ...(row.status !== undefined && row.status !== 0 ? { disabled: true } : {}),
    children: []
  }]))
  const roots: ReferenceNode[] = []
  rows.forEach((row) => {
    const node = nodes.get(row.id)!
    const parent = nodes.get(row.parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

export const buildSubjectDomainParentTree = (
  items: FlatReference[],
  excludedRootId?: number
): ReferenceNode[] => [{
  id: 0,
  name: '顶级主题域',
  children: buildReferenceTree(items, excludedRootId)
}]

const containsNode = (nodes: ReferenceNode[], id: number): boolean =>
  nodes.some((node) => node.id === id || containsNode(node.children, id))

export const ensureSelectedReferenceNode = (
  nodes: ReferenceNode[],
  selectedId?: number,
  fallbackName = '已停用或不可见'
): ReferenceNode[] => {
  if (selectedId === undefined || containsNode(nodes, selectedId)) return nodes
  return [{ id: selectedId, name: fallbackName, disabled: true, children: [] }, ...nodes]
}

export const filterOwnerUsers = (
  users: UserVO[],
  departments: DeptVO[],
  options: { deptId?: number; keyword?: string; selectedUserId?: number } = {}
): UserVO[] => {
  const deptIds = options.deptId === undefined ? undefined : collectBranchIds(departments, options.deptId)
  const keyword = options.keyword?.trim().toLocaleLowerCase() || ''
  return users.filter((user) => {
    if (user.id === options.selectedUserId) return true
    if (deptIds && !deptIds.has(user.deptId)) return false
    if (!keyword) return true
    return [user.nickname, user.username, user.deptName]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(keyword))
  })
}

export const formatSourceSystemLabel = (item: SourceSystemOption): string =>
  item.code ? `${item.name}（${item.code}）` : item.name

export const mergeSourceSystemOptions = (
  current: SourceSystemOption[],
  incoming: Array<SourceSystemOption | SourceSystemVO>
): SourceSystemOption[] => {
  const map = new Map<number, SourceSystemOption>()
  ;[...current, ...incoming].forEach((item) => item.id && map.set(item.id, {
    id: item.id,
    name: item.name,
    ...(item.code ? { code: item.code } : {}),
    ...(item.status !== undefined ? { status: item.status } : {})
  }))
  return [...map.values()]
}
```

- [ ] **Step 4: 运行聚焦测试并确认 GREEN**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectors.spec.ts`

Expected: 5 tests PASS。

- [ ] **Step 5: 提交纯函数与测试**

```bash
git add src/views/dataMarket/referenceSelectors.ts tests/dataMarket/referenceSelectors.spec.ts
git commit -m "test(data-market): cover reference selector logic"
```

---

### Task 2: 可复用主题域、部门、人员与来源系统选择器

**Files:**
- Create: `src/views/dataMarket/components/SubjectDomainSelect.vue`
- Create: `src/views/dataMarket/components/DepartmentCascader.vue`
- Create: `src/views/dataMarket/components/UserDepartmentSelect.vue`
- Create: `src/views/dataMarket/components/SourceSystemSelect.vue`
- Test: `tests/dataMarket/referenceSelectorComponents.spec.ts`

**Interfaces:**
- Consumes: Task 1 的 `ReferenceNode`、`SourceSystemOption` 和纯函数。
- Produces: 四个 `v-model<number | undefined>` 组件；`SourceSystemSelect` 额外发出 `search(query: string)`，其余 UI 查找状态不向父组件泄漏。

- [ ] **Step 1: 写入失败的组件输入输出测试**

测试使用 `@vue/test-utils` 的 `mount` 和命名 stub：

```ts
const TreeSelectStub = defineComponent({
  name: 'ElTreeSelect',
  props: ['modelValue', 'data'],
  emits: ['update:modelValue'],
  template: '<button data-test="tree" @click="$emit(\'update:modelValue\', 2)">tree</button>'
})

const CascaderStub = defineComponent({
  name: 'ElCascader',
  props: ['modelValue', 'options', 'props'],
  emits: ['update:modelValue'],
  template: '<button data-test="cascader" @click="$emit(\'update:modelValue\', 11)">cascader</button>'
})

const DepartmentCascaderStub = defineComponent({
  name: 'DepartmentCascader',
  emits: ['update:modelValue'],
  template: '<button data-test="lookup-dept" @click="$emit(\'update:modelValue\', 10)">lookup</button>'
})

const UserSelectStub = defineComponent({
  name: 'ElSelect',
  emits: ['update:modelValue'],
  template: '<button data-test="user" @click="$emit(\'update:modelValue\', 101)"><slot /></button>'
})

const RemoteSelectStub = defineComponent({
  name: 'ElSelect',
  props: { remoteMethod: Function },
  template: '<button data-test="remote-search" @click="remoteMethod(\'客户\')"><slot /></button>'
})

it('emits scalar IDs and exposes hierarchy options', async () => {
  const subject = mount(SubjectDomainSelect, {
    props: { modelValue: 0, domains, allowTopLevel: true },
    global: { stubs: { ElTreeSelect: TreeSelectStub } }
  })
  expect(subject.findComponent(TreeSelectStub).props('data')[0].name).toBe('顶级主题域')
  await subject.get('[data-test="tree"]').trigger('click')
  expect(subject.emitted('update:modelValue')).toEqual([[2]])

  const department = mount(DepartmentCascader, {
    props: { modelValue: undefined, departments },
    global: { stubs: { ElCascader: CascaderStub } }
  })
  expect(department.findComponent(CascaderStub).props('props').emitPath).toBe(false)
  await department.get('[data-test="cascader"]').trigger('click')
  expect(department.emitted('update:modelValue')).toEqual([[11]])
})

it('keeps lookup department local and emits only the chosen user', async () => {
  const wrapper = mount(UserDepartmentSelect, {
    props: { modelValue: undefined, departments, users },
    global: { stubs: { DepartmentCascader: DepartmentCascaderStub, ElSelect: UserSelectStub, ElOption: true } }
  })
  await wrapper.get('[data-test="lookup-dept"]').trigger('click')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  await wrapper.get('[data-test="user"]').trigger('click')
  expect(wrapper.emitted('update:modelValue')).toEqual([[101]])
})

it('forwards remote source-system searches without changing the selected id', async () => {
  const wrapper = mount(SourceSystemSelect, {
    props: { modelValue: 1, options: [{ id: 1, name: '客户系统', code: 'CRM' }] },
    global: { stubs: { ElSelect: RemoteSelectStub, ElOption: true } }
  })
  await wrapper.get('[data-test="remote-search"]').trigger('click')
  expect(wrapper.emitted('search')).toEqual([['客户']])
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})
```

负责人文本过滤已由 Task 1 的纯函数测试覆盖；本组件测试只验证查找部门状态不向业务 `v-model` 泄漏。

- [ ] **Step 2: 运行组件测试并确认 RED**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectorComponents.spec.ts`

Expected: FAIL，四个组件文件尚不存在。

- [ ] **Step 3: 实现 `SubjectDomainSelect.vue` 和 `DepartmentCascader.vue`**

`SubjectDomainSelect.vue` 必须使用以下公开 props 和计算方式：

```ts
const props = withDefaults(defineProps<{
  modelValue?: number
  domains: SubjectDomainVO[]
  allowTopLevel?: boolean
  excludeBranchId?: number
  disabled?: boolean
  placeholder?: string
}>(), {
  allowTopLevel: false,
  disabled: false,
  placeholder: '请选择主题域'
})

const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const value = computed({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next)
})
const data = computed(() => ensureSelectedReferenceNode(
  props.allowTopLevel
    ? buildSubjectDomainParentTree(props.domains, props.excludeBranchId)
    : buildReferenceTree(props.domains),
  props.modelValue
))
```

模板使用 `el-tree-select`，设置 `filterable`、`check-strictly`、`default-expand-all`、`node-key="id"`、`:props="{ value: 'id', label: 'name', children: 'children', disabled: 'disabled' }"` 和 `class="!w-1/1"`。

`DepartmentCascader.vue` 的 props 固定为 `modelValue?: number`、`departments: DeptVO[]`、`disabled?: boolean`、`placeholder?: string`。选项使用 `ensureSelectedReferenceNode(buildReferenceTree(departments), modelValue)`，保证历史引用缺失时仍显示可读占位；级联设置为：

```ts
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  disabled: 'disabled',
  emitPath: false,
  checkStrictly: true
} as const
```

模板启用 `filterable`、`clearable` 和全宽样式；`v-model` 计算属性只发出单个 `number | undefined`。

- [ ] **Step 4: 实现 `UserDepartmentSelect.vue` 和 `SourceSystemSelect.vue`**

`UserDepartmentSelect.vue` 的 props 固定为 `modelValue?: number`、`departments: DeptVO[]`、`users: UserVO[]`、`disabled?: boolean`，并使用本地 `lookupDeptId`、`keyword` 和 Task 1 的 `filterOwnerUsers`：

```ts
const lookupDeptId = ref<number>()
const keyword = ref('')
const candidates = computed(() => filterOwnerUsers(props.users, props.departments, {
  deptId: lookupDeptId.value,
  keyword: keyword.value,
  selectedUserId: props.modelValue
}))
```

模板使用响应式两列布局：左侧 `DepartmentCascader` 的占位文案为“按部门筛选负责人”，右侧 `el-select` 为负责人。用户选项 label 为 `昵称（账号）`，自定义内容同时显示 `deptName`；缺失的已选用户增加 value 为原 ID、label 为“已停用或不可见”的 disabled 选项。部门筛选只更新 `lookupDeptId`，用户选择才发出 `update:modelValue`。

`SourceSystemSelect.vue` 的公开接口固定为：

```ts
defineProps<{
  modelValue?: number
  options: SourceSystemOption[]
  loading?: boolean
  disabled?: boolean
}>()
defineEmits<{
  'update:modelValue': [value: number | undefined]
  search: [query: string]
}>()
```

模板使用 `el-select` 的 `filterable`、`remote`、`clearable`、`:remote-method="query => emit('search', query)"`、`:loading`；打开下拉框时发出空搜索。每个选项调用 `formatSourceSystemLabel`，value 只使用系统 ID。

- [ ] **Step 5: 运行组件测试并确认 GREEN**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectorComponents.spec.ts`

Expected: 3 tests PASS。

- [ ] **Step 6: 提交组件与测试**

```bash
git add src/views/dataMarket/components tests/dataMarket/referenceSelectorComponents.spec.ts
git commit -m "feat(data-market): add reference selector components"
```

---

### Task 3: 业务主题域和来源系统页面接线

**Files:**
- Modify: `src/views/dataMarket/domain/index.vue:1-101`
- Modify: `src/views/dataMarket/sourceSystem/index.vue:1-129`
- Create: `tests/dataMarket/referenceSelectorPages.spec.ts`

**Interfaces:**
- Consumes: Task 2 的 `SubjectDomainSelect`, `DepartmentCascader`, `UserDepartmentSelect`。
- Produces: 主题域父级和来源系统责任人/部门的业务化新增、编辑、列表展示。

- [ ] **Step 1: 写入失败的页面接线测试**

在 `referenceSelectorPages.spec.ts` mock 现有接口：

```ts
vi.mock('@/api/dataMarket/catalog', () => ({
  getSubjectDomainList: vi.fn(async () => domains),
  getSourceSystemPage: vi.fn(async () => ({ list: [], total: 0 })),
  getDatasetPage: vi.fn(async () => ({ list: [], total: 0 })),
  createSubjectDomain: vi.fn(), updateSubjectDomain: vi.fn(), deleteSubjectDomain: vi.fn(),
  createSourceSystem: vi.fn(), updateSourceSystem: vi.fn(), deleteSourceSystem: vi.fn()
}))
vi.mock('@/api/system/dept', () => ({ getSimpleDeptList: vi.fn(async () => departments) }))
vi.mock('@/api/system/user', () => ({ getSimpleUserList: vi.fn(async () => users) }))
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({ success: vi.fn(), error: vi.fn(), delConfirm: vi.fn() })
}))
```

使用会渲染 default/footer slot 的 `Dialog`、`ElForm`、`ElFormItem` stub 挂载页面，并断言：

```ts
import type { Component } from 'vue'
import { defineComponent } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'

const SlotStub = defineComponent({
  template: '<div><slot /><slot name="footer" /></div>'
})

const mountPage = (component: Component) => shallowMount(component, {
  global: {
    stubs: {
      ContentWrap: SlotStub,
      Dialog: SlotStub,
      ElDrawer: SlotStub,
      ElForm: SlotStub,
      ElFormItem: SlotStub,
      ElTable: true,
      ElTableColumn: true,
      ElButton: true,
      ElInput: true,
      ElInputNumber: true,
      ElSelect: true,
      ElOption: true,
      ElSwitch: true,
      Pagination: true,
      DatasetActions: true,
      Icon: true
    },
    directives: {
      hasPermi: () => undefined,
      loading: () => undefined
    }
  }
})
```

```ts
it('uses business selectors on domain and source-system forms', async () => {
  const domain = mountPage(DomainPage)
  await flushPromises()
  expect(domain.findComponent(SubjectDomainSelect).props('allowTopLevel')).toBe(true)

  const source = mountPage(SourceSystemPage)
  await flushPromises()
  expect(source.findComponent(DepartmentCascader).exists()).toBe(true)
  expect(source.findComponent(UserDepartmentSelect).exists()).toBe(true)
})
```

- [ ] **Step 2: 运行页面测试并确认 RED**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectorPages.spec.ts -t "domain and source-system"`

Expected: FAIL，两个页面仍使用 `el-input-number`。

- [ ] **Step 3: 替换主题域的上级 ID**

在 `domain/index.vue`：

```vue
<el-form-item label="上级主题域" prop="parentId">
  <SubjectDomainSelect
    v-model="form.parentId"
    :domains="list"
    :exclude-branch-id="form.id"
    allow-top-level
    placeholder="请选择上级主题域"
  />
</el-form-item>
```

新增 `parentId` change 规则，保留新增默认值 `0`。编辑时组件基于 `form.id` 排除当前节点及后代，不改变保存函数。

- [ ] **Step 4: 加载来源系统的部门和用户引用**

在 `sourceSystem/index.vue` 新增：

```ts
const referenceLoading = ref(false)
const referenceReady = ref(false)
const departments = ref<DeptApi.DeptVO[]>([])
const users = ref<UserApi.UserVO[]>([])
const ownerPickerKey = ref(0)

const userNameMap = computed(() => new Map(users.value.map((item) => [item.id, item.nickname])))
const deptNameMap = computed(() => new Map(departments.value.map((item) => [item.id, item.name])))

const loadReferences = async () => {
  referenceLoading.value = true
  try {
    ;[departments.value, users.value] = await Promise.all([
      DeptApi.getSimpleDeptList(),
      UserApi.getSimpleUserList()
    ])
    referenceReady.value = true
  } catch {
    referenceReady.value = false
    message.error('人员或部门数据加载失败，请重试')
  } finally {
    referenceLoading.value = false
  }
}
```

页面初始化执行 `Promise.all([getList(), loadReferences()])`。`open` 改为 async：引用尚未就绪时先等待 `loadReferences()`，随后每次执行 `ownerPickerKey.value += 1`，只重置负责人组件内部的查找条件，不修改 `form.ownerUserId` 或 `form.ownerDeptId`。

- [ ] **Step 5: 替换来源系统控件和列表列**

```vue
<el-form-item label="负责人">
  <UserDepartmentSelect
    :key="ownerPickerKey"
    v-model="form.ownerUserId"
    :departments="departments"
    :users="users"
    :disabled="!referenceReady"
  />
</el-form-item>
<el-form-item label="负责部门">
  <DepartmentCascader
    v-model="form.ownerDeptId"
    :departments="departments"
    :disabled="!referenceReady"
    placeholder="请选择负责部门"
  />
</el-form-item>
```

列表两列改为具名 slot：空值显示 `—`，有值但字典无法解析显示“已停用或不可见”，其余显示昵称或部门名称。表单增加 `v-loading="referenceLoading"`，保存请求仍直接使用 `form`，因此查找部门不会进入请求体。

- [ ] **Step 6: 运行页面测试、纯函数测试和类型检查**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectors.spec.ts tests/dataMarket/referenceSelectorComponents.spec.ts tests/dataMarket/referenceSelectorPages.spec.ts`

Expected: PASS。

Run: `pnpm typecheck:data-market`

Expected: exit 0。

- [ ] **Step 7: 提交主题域和来源系统接线**

```bash
git add src/views/dataMarket/domain/index.vue src/views/dataMarket/sourceSystem/index.vue tests/dataMarket/referenceSelectorPages.spec.ts
git commit -m "feat(data-market): replace catalog reference ids"
```

---

### Task 4: 数据集来源系统和主题域选择器

**Files:**
- Modify: `src/views/dataMarket/dataset/index.vue:1-360`
- Modify: `tests/dataMarket/referenceSelectorPages.spec.ts`

**Interfaces:**
- Consumes: Task 1 的 `SourceSystemOption`, `mergeSourceSystemOptions`；Task 2 的 `SubjectDomainSelect`, `SourceSystemSelect`。
- Produces: 数据集新增、编辑、发布和列表统一的业务引用展示，接口继续提交 `sourceSystemId`、`subjectDomainId`。

- [ ] **Step 1: 写入失败的数据集接线测试**

扩展页面测试中的 Catalog mock，加入 `getDataset`、`createDataset`、`updateDataset`、`publishDataset` 空实现，然后增加：

```ts
it('uses source-system and subject-domain selectors on dataset forms', async () => {
  const dataset = mountPage(DatasetPage)
  await flushPromises()
  expect(dataset.findComponent(SourceSystemSelect).exists()).toBe(true)
  expect(dataset.findAllComponents(SubjectDomainSelect)).toHaveLength(2)
})
```

两个 `SubjectDomainSelect` 分别对应数据集新增/编辑抽屉和发布弹窗。

- [ ] **Step 2: 运行数据集接线测试并确认 RED**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectorPages.spec.ts -t "dataset forms"`

Expected: FAIL，数据集页面仍使用数值输入框。

- [ ] **Step 3: 增加数据集引用加载和来源系统远程搜索**

```ts
const subjectDomains = ref<SubjectDomainVO[]>([])
const sourceSystemOptions = ref<SourceSystemOption[]>([])
const sourceSystemLoading = ref(false)
let sourceSearchSequence = 0

const loadSubjectDomains = async () => {
  try {
    subjectDomains.value = await CatalogApi.getSubjectDomainList()
  } catch {
    message.error('主题域数据加载失败，请重试')
  }
}

const searchSourceSystems = async (keyword = '') => {
  const sequence = ++sourceSearchSequence
  sourceSystemLoading.value = true
  try {
    const page = await CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 50, keyword })
    if (sequence !== sourceSearchSequence) return
    sourceSystemOptions.value = mergeSourceSystemOptions(sourceSystemOptions.value, page.list)
  } catch {
    if (sequence === sourceSearchSequence) message.error('来源系统数据加载失败，请重试')
  } finally {
    if (sequence === sourceSearchSequence) sourceSystemLoading.value = false
  }
}
```

`onMounted` 并行调用 `getList()`、`loadSubjectDomains()`、`searchSourceSystems()`。`openDrawer` 在主题域或来源系统选项尚未加载时再次等待对应加载函数；编辑详情返回 `sourceSystemId + sourceSystemName` 但当前选项不存在时，先合并 `{ id, name: sourceSystemName || '已停用或不可见' }`，保证回显不被清空。

- [ ] **Step 4: 替换新增、编辑和发布控件**

```vue
<el-form-item label="来源系统" prop="sourceSystemId">
  <SourceSystemSelect
    v-model="form.sourceSystemId"
    :options="sourceSystemOptions"
    :loading="sourceSystemLoading"
    @search="searchSourceSystems"
  />
</el-form-item>
<el-form-item label="业务主题域" prop="subjectDomainId">
  <SubjectDomainSelect v-model="form.subjectDomainId" :domains="subjectDomains" />
</el-form-item>
```

发布弹窗的主题域项使用同一组件绑定 `publishForm.subjectDomainId`，不启用 `allowTopLevel`。保留现有 required 规则与数值字段。

- [ ] **Step 5: 把数据集列表 ID 列替换为名称列**

来源系统列显示 `row.sourceSystemName`，主题域列显示 `row.subjectDomainName`；名称缺失时用当前 options/domain 字典解析，仍缺失则显示“已停用或不可见”。列标题分别为“来源系统”和“业务主题域”。

- [ ] **Step 6: 运行数据集测试和数据市场完整单测**

Run: `pnpm exec vitest run tests/dataMarket/referenceSelectorPages.spec.ts tests/dataMarket/referenceSelectors.spec.ts tests/dataMarket/referenceSelectorComponents.spec.ts`

Expected: PASS。

Run: `pnpm test:unit`

Expected: all data-market and existing unit tests PASS。

- [ ] **Step 7: 提交数据集接线**

```bash
git add src/views/dataMarket/dataset/index.vue tests/dataMarket/referenceSelectorPages.spec.ts
git commit -m "feat(data-market): add dataset reference selectors"
```

---

### Task 5: 静态检查、构建和浏览器验收

**Files:**
- Modify only if verification reveals a defect: files already listed in Tasks 1-4.

**Interfaces:**
- Consumes: Tasks 1-4 的最终实现。
- Produces: 可复现的测试、类型、构建和页面验收证据。

- [ ] **Step 1: 运行格式和差异检查**

Run: `pnpm exec prettier --check src/views/dataMarket/referenceSelectors.ts src/views/dataMarket/components/*.vue src/views/dataMarket/domain/index.vue src/views/dataMarket/sourceSystem/index.vue src/views/dataMarket/dataset/index.vue tests/dataMarket/referenceSelector*.spec.ts`

Expected: 所有文件通过 Prettier。

Run: `git diff --check`

Expected: 无空白错误。

- [ ] **Step 2: 运行完整自动化验证**

Run: `pnpm test:unit`

Expected: exit 0。

Run: `pnpm typecheck:data-market`

Expected: exit 0。

Run: `pnpm build:local`

Expected: exit 0，Vite 构建成功。

- [ ] **Step 3: 在 5174 管理端执行页面验收**

按以下顺序验证：

1. 业务主题域：新增默认顶级；编辑时自身和后代不在上级候选中；保存后父级 ID 正确。
2. 来源系统：负责部门可展开多层；负责人可先按独立部门筛选，再按昵称或账号搜索；两个部门选择互不改变。
3. 来源系统列表：负责人和部门显示名称，无裸 ID。
4. 数据集：来源系统可按名称/编码远程搜索；业务主题域可多层选择；编辑正确回显。
5. 数据集发布：主题域选择器与新增抽屉一致，不能选择虚拟顶级节点。
6. 窄窗口：负责人组合控件换行后不溢出，抽屉和弹窗仍可操作。

- [ ] **Step 4: 检查最终提交范围**

Run: `git status --short`

Expected: 仅包含本计划列出的文件；不得混入用户的其他改动。

- [ ] **Step 5: 提交仅由验证产生的修正**

仅当 Step 1-3 暴露问题并产生修正时执行：

```bash
git add src/views/dataMarket/referenceSelectors.ts src/views/dataMarket/components src/views/dataMarket/domain/index.vue src/views/dataMarket/sourceSystem/index.vue src/views/dataMarket/dataset/index.vue tests/dataMarket/referenceSelector*.spec.ts
git commit -m "fix(data-market): harden reference selector flows"
```
