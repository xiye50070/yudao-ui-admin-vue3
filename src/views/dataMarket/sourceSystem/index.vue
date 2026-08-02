<template>
  <ContentWrap>
    <el-button
      v-hasPermi="['data-market:source-system:create']"
      type="primary"
      plain
      @click="open()"
    >
      新增来源系统
    </el-button>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column prop="name" label="系统名称" />
      <el-table-column prop="code" label="系统编码" />
      <el-table-column label="负责人">
        <template #default="{ row }">{{ resolveUserName(row.ownerUserId) }}</template>
      </el-table-column>
      <el-table-column label="负责部门">
        <template #default="{ row }">{{ resolveDeptName(row.ownerDeptId) }}</template>
      </el-table-column>
      <el-table-column prop="description" label="说明" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['data-market:source-system:update']"
            link
            type="primary"
            @click="open(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['data-market:source-system:delete']"
            link
            type="danger"
            @click="remove(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="query.pageSize"
      v-model:page="query.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <Dialog v-model="visible" title="来源系统">
    <el-form
      ref="formRef"
      v-loading="referenceLoading"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="编码" prop="code">
        <el-input v-model="form.code" />
      </el-form-item>
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
      <el-form-item label="状态">
        <el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="form.description" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { SourceSystemVO } from '@/api/dataMarket/types'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import DepartmentCascader from '@/views/dataMarket/components/DepartmentCascader.vue'
import UserDepartmentSelect from '@/views/dataMarket/components/UserDepartmentSelect.vue'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketSourceSystem' })

const message = useMessage()
const loading = ref(false)
const list = ref<SourceSystemVO[]>([])
const total = ref(0)
const visible = ref(false)
const formRef = ref<any>()
const query = reactive({ pageNo: 1, pageSize: 10 })
const referenceLoading = ref(false)
const referenceReady = ref(false)
const departments = ref<DeptApi.DeptVO[]>([])
const users = ref<UserApi.UserVO[]>([])
const ownerPickerKey = ref(0)
let referenceRequest: Promise<void> | undefined

const form = reactive<SourceSystemVO>({
  name: '',
  code: '',
  ownerUserId: undefined,
  ownerDeptId: undefined,
  description: '',
  status: 0
})
const rules = {
  name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入系统编码', trigger: 'blur' }]
}
const userNameMap = computed(() => new Map(users.value.map((item) => [item.id, item.nickname])))
const deptNameMap = computed(() => new Map(departments.value.map((item) => [item.id, item.name])))

const resolveUserName = (id?: number) =>
  id === undefined ? '—' : userNameMap.value.get(id) || '已停用或不可见'
const resolveDeptName = (id?: number) =>
  id === undefined ? '—' : deptNameMap.value.get(id) || '已停用或不可见'

const getList = async () => {
  loading.value = true
  try {
    const data = await CatalogApi.getSourceSystemPage(query)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const loadReferences = () => {
  if (referenceReady.value) return Promise.resolve()
  if (referenceRequest) return referenceRequest
  referenceLoading.value = true
  referenceRequest = Promise.all([DeptApi.getSimpleDeptList(), UserApi.getSimpleUserList()])
    .then(([deptList, userList]) => {
      departments.value = deptList
      users.value = userList
      referenceReady.value = true
    })
    .catch(() => {
      referenceReady.value = false
      message.error('人员或部门数据加载失败，请重试')
    })
    .finally(() => {
      referenceLoading.value = false
      referenceRequest = undefined
    })
  return referenceRequest
}

const open = async (row?: SourceSystemVO) => {
  Object.assign(
    form,
    row || {
      id: undefined,
      name: '',
      code: '',
      ownerUserId: undefined,
      ownerDeptId: undefined,
      description: '',
      status: 0
    }
  )
  ownerPickerKey.value += 1
  visible.value = true
  await loadReferences()
}

const save = async () => {
  if (!(await formRef.value.validate())) return
  form.id
    ? await CatalogApi.updateSourceSystem(form.id, form)
    : await CatalogApi.createSourceSystem(form)
  visible.value = false
  message.success('保存成功')
  getList()
}

const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteSourceSystem(id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  getList()
  loadReferences()
})
</script>
