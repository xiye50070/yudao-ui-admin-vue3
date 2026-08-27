<template>
  <DataMarketManagementPage
    page-key="caller-system"
    title="调用系统配置"
    description="维护数据接口调用方及其责任归属"
    icon="ep:link"
    tone="teal"
  >
    <template #actions>
      <el-tooltip content="刷新调用系统" placement="bottom">
        <el-button :loading="loading" aria-label="刷新调用系统" @click="getList">
          <Icon v-if="!loading" icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-button v-hasPermi="['data-market:caller-system:create']" type="primary" @click="open()">
        <Icon icon="ep:plus" />新增调用系统
      </el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:link" /></span
        ><span class="dm-summary-item__content"
          ><small>调用系统</small><strong>{{ total }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span
        ><span class="dm-summary-item__content"
          ><small>本页启用</small><strong>{{ currentEnabledCount }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:circle-close" /></span
        ><span class="dm-summary-item__content"
          ><small>本页停用</small><strong>{{ currentDisabledCount }}</strong></span
        ></div
      >
    </template>

    <section class="dm-panel">
      <header class="dm-panel__header">
        <div
          ><h2>调用系统列表</h2><p v-if="!loadError">共 {{ total }} 个调用系统</p
          ><p v-else>调用系统配置暂不可用</p></div
        >
        <div class="dm-toolbar caller-toolbar">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="搜索系统名称、编码或说明"
            aria-label="搜索调用系统"
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
        title="调用系统加载失败"
        sub-title="暂时无法获取调用系统配置，请稍后重试"
      >
        <template #extra><el-button type="primary" @click="getList">重新加载</el-button></template>
      </el-result>
      <template v-else>
        <div class="dm-table-wrap">
          <el-table v-loading="loading" :data="list" empty-text="暂无调用系统" table-layout="fixed">
            <el-table-column label="调用系统" min-width="260">
              <template #default="{ row }">
                <div class="dm-entity-cell"
                  ><span class="dm-entity-mark">{{ row.code.slice(0, 2) }}</span
                  ><span class="dm-entity-copy"
                    ><strong>{{ row.name }}</strong
                    ><small>{{ row.description || '暂无说明' }}</small></span
                  ></div
                >
              </template>
            </el-table-column>
            <el-table-column label="系统编码" min-width="160"
              ><template #default="{ row }"
                ><span class="dm-code">{{ row.code }}</span></template
              ></el-table-column
            >
            <el-table-column label="状态" width="108" align="center"
              ><template #default="{ row }"
                ><el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>{{
                  row.status === 0 ? '启用' : '停用'
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column prop="sort" label="排序" width="100" align="center" />
            <el-table-column label="操作" width="150" align="right">
              <template #default="{ row }"
                ><div class="dm-row-actions"
                  ><el-button
                    v-hasPermi="['data-market:caller-system:update']"
                    link
                    type="primary"
                    @click="open(row)"
                    >编辑</el-button
                  ><el-button
                    v-hasPermi="['data-market:caller-system:delete']"
                    link
                    type="danger"
                    @click="remove(row.id)"
                    >删除</el-button
                  ></div
                ></template
              >
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
    :title="form.id ? '编辑调用系统' : '新增调用系统'"
    width="min(580px, calc(100vw - 32px))"
    align-center
  >
    <div class="caller-dialog-intro"
      ><span><Icon icon="ep:link" /></span
      ><div
        ><strong>{{ form.id ? '完善调用系统信息' : '登记新的接口调用方' }}</strong
        ><p>系统编码用于稳定识别调用方，保存后建议保持不变。</p></div
      ></div
    >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="系统编码" prop="code">
        <el-input v-model="form.code" maxlength="64" placeholder="例如 CRM" />
      </el-form-item>
      <el-form-item label="系统名称" prop="name">
        <el-input v-model="form.name" maxlength="128" placeholder="例如 客户关系管理系统" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" />
      </el-form-item>
      <el-form-item label="说明" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="1000"
          show-word-limit
          placeholder="可填写适用范围或维护说明"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as CallerSystemApi from '@/api/dataMarket/callerSystem'
import type { CallerSystemVO } from '@/api/dataMarket/callerSystem'
import { useMessage } from '@/hooks/web/useMessage'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketCallerSystem' })

const message = useMessage()
const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)
const list = ref<CallerSystemVO[]>([])
const total = ref(0)
const visible = ref(false)
const formRef = ref<any>()
const query = reactive({ pageNo: 1, pageSize: 10, keyword: '' })
const form = reactive<CallerSystemVO>(emptyForm())
const rules = {
  code: [{ required: true, message: '请输入系统编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }]
}
const currentEnabledCount = computed(() => list.value.filter((item) => item.status === 0).length)
const currentDisabledCount = computed(() => list.value.filter((item) => item.status !== 0).length)

function emptyForm(): CallerSystemVO {
  return { id: undefined, code: '', name: '', status: 0, sort: 0, description: '' }
}

const getList = async () => {
  loading.value = true
  loadError.value = false
  try {
    const data = await CallerSystemApi.getCallerSystemPage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
    loadError.value = true
    message.error('调用系统配置加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  query.pageNo = 1
  getList()
}

const resetQuery = () => {
  query.keyword = ''
  handleQuery()
}

const open = (row?: CallerSystemVO) => {
  Object.assign(form, emptyForm(), row || {})
  visible.value = true
}

const save = async () => {
  if (!(await formRef.value.validate())) return
  saving.value = true
  try {
    form.id
      ? await CallerSystemApi.updateCallerSystem(form.id, form)
      : await CallerSystemApi.createCallerSystem(form)
    visible.value = false
    message.success('保存成功')
    await getList()
  } finally {
    saving.value = false
  }
}

const remove = async (id: number) => {
  await message.delConfirm()
  await CallerSystemApi.deleteCallerSystem(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>

<style scoped lang="scss">
.caller-toolbar :deep(.el-input) {
  width: min(320px, 32vw);
}

.caller-dialog-intro {
  display: flex;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: #effaf8;
  border: 1px solid #d7f0eb;
  border-radius: 9px;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    color: #0d9488;
    background: #dff6f2;
    border-radius: 9px;
    place-items: center;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #718096;
  }
}

@media (width <= 640px) {
  .caller-toolbar :deep(.el-input) {
    width: 100%;
  }
}
</style>
