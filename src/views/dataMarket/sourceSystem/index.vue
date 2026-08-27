<template>
  <DataMarketManagementPage
    page-key="source-system"
    title="来源系统"
    description="维护数据来源、责任归属与目录接入状态"
    icon="ep:monitor"
  >
    <template #actions>
      <el-tooltip content="刷新来源系统" placement="bottom">
        <el-button :loading="loading" aria-label="刷新来源系统" @click="getList">
          <Icon v-if="!loading" icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-button v-hasPermi="['data-market:source-system:create']" type="primary" @click="open()">
        <Icon icon="ep:plus" />新增来源系统
      </el-button>
    </template>

    <section class="dm-panel">
      <header class="dm-panel__header">
        <div>
          <h2>来源系统列表</h2>
          <p v-if="!loadError">共 {{ total }} 个来源系统</p>
          <p v-else>来源系统数据暂不可用</p>
        </div>
        <div class="dm-toolbar">
          <el-input
            v-model="query.keyword"
            clearable
            aria-label="搜索来源系统"
            placeholder="搜索系统名称或编码"
            @keyup.enter="handleQuery"
          >
            <template #prefix><Icon icon="ep:search" /></template>
          </el-input>
          <el-button type="primary" plain @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>
      </header>

      <el-result
        v-if="loadError"
        class="dm-load-result"
        icon="warning"
        title="来源系统加载失败"
        sub-title="暂时无法获取来源系统，请稍后重试"
      >
        <template #extra>
          <el-button type="primary" @click="getList">重新加载</el-button>
        </template>
      </el-result>
      <template v-else>
        <div class="dm-table-wrap">
          <el-table v-loading="loading" :data="list" empty-text="暂无来源系统" table-layout="fixed">
            <el-table-column label="来源系统" min-width="250">
              <template #default="{ row }">
                <div class="dm-entity-cell">
                  <span class="dm-entity-mark" aria-hidden="true">{{ row.code.slice(0, 2) }}</span>
                  <span class="dm-entity-copy">
                    <strong :title="row.name">{{ row.name }}</strong>
                    <small :title="row.description || '暂无说明'">{{
                      row.description || '暂无说明'
                    }}</small>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="系统编码" min-width="150">
              <template #default="{ row }">
                <span class="dm-code" :title="row.code">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column label="负责人" min-width="140">
              <template #default="{ row }">{{ resolveUserName(row.ownerUserId) }}</template>
            </el-table-column>
            <el-table-column label="负责部门" min-width="150">
              <template #default="{ row }">{{ resolveDeptName(row.ownerDeptId) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="108" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>
                  {{ row.status === 0 ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="148" align="right">
              <template #default="{ row }">
                <div class="dm-row-actions">
                  <el-button
                    v-hasPermi="['data-market:source-system:update']"
                    link
                    type="primary"
                    @click="open(row)"
                  >
                    <Icon icon="ep:edit-pen" />编辑
                  </el-button>
                  <el-button
                    v-hasPermi="['data-market:source-system:delete']"
                    link
                    type="danger"
                    @click="remove(row.id)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <Pagination
          v-model:limit="query.pageSize"
          v-model:page="query.pageNo"
          :total="total"
          @pagination="getList"
        />
      </template>
    </section>
  </DataMarketManagementPage>

  <Dialog
    v-model="visible"
    :title="form.id ? '编辑来源系统' : '新增来源系统'"
    width="min(600px, calc(100vw - 32px))"
    align-center
  >
    <div class="source-dialog-intro">
      <span><Icon icon="ep:monitor" /></span>
      <div>
        <strong>{{ form.id ? '完善来源系统信息' : '登记新的数据来源' }}</strong>
        <p>系统编码保存后应保持稳定，责任归属来自当前组织与用户数据。</p>
      </div>
    </div>
    <el-form
      ref="formRef"
      v-loading="referenceLoading"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="系统名称" prop="name">
        <el-input v-model="form.name" maxlength="128" placeholder="请输入来源系统名称" />
      </el-form-item>
      <el-form-item label="系统编码" prop="code">
        <el-input v-model="form.code" maxlength="64" placeholder="例如 ERP 或 HR" />
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
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="说明该系统提供的数据范围"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :loading="saving" type="primary" @click="save">保存</el-button>
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
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketSourceSystem' })

const message = useMessage()
const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)
const list = ref<SourceSystemVO[]>([])
const total = ref(0)
const visible = ref(false)
const formRef = ref<any>()
const query = reactive({ pageNo: 1, pageSize: 10, keyword: '' })
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
  id === undefined ? '—' : userNameMap.value.get(id) || `未找到（ID：${id}）`
const resolveDeptName = (id?: number) =>
  id === undefined ? '—' : deptNameMap.value.get(id) || `未找到（ID：${id}）`

const getList = async () => {
  loading.value = true
  loadError.value = false
  try {
    const data = await CatalogApi.getSourceSystemPage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  query.pageNo = 1
  void getList()
}

const resetQuery = () => {
  query.keyword = ''
  handleQuery()
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
  if (saving.value) return
  saving.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    form.id
      ? await CatalogApi.updateSourceSystem(form.id, form)
      : await CatalogApi.createSourceSystem(form)
    visible.value = false
    message.success('保存成功')
    await getList()
  } finally {
    saving.value = false
  }
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

<style scoped lang="scss">
.source-dialog-intro {
  display: flex;
  padding: 14px 16px;
  margin-bottom: 22px;
  background: #f5f9ff;
  border: 1px solid #dceaff;
  border-radius: 9px;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    font-size: 20px;
    color: #1677ff;
    background: #e5f0ff;
    border-radius: 9px;
    flex: 0 0 38px;
    place-items: center;
  }

  strong {
    font-size: 14px;
    color: #24344f;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #718096;
  }
}

:deep(.dm-toolbar .el-input) {
  width: min(300px, 32vw);
}

@media (width <= 640px) {
  :deep(.dm-toolbar .el-input) {
    width: 100%;
  }
}
</style>
