<template>
  <ContentWrap>
    <el-form :model="query" inline>
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          clearable
          placeholder="搜索系统名称、编码或说明"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button
          v-hasPermi="['data-market:caller-system:create']"
          type="primary"
          plain
          @click="open()"
        >
          新增调用系统
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column prop="name" label="系统名称" min-width="180" />
      <el-table-column prop="code" label="系统编码" min-width="150" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['data-market:caller-system:update']"
            link
            type="primary"
            @click="open(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['data-market:caller-system:delete']"
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

  <Dialog v-model="visible" :title="form.id ? '编辑调用系统' : '新增调用系统'" width="560px">
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
import { onMounted, reactive, ref } from 'vue'
import * as CallerSystemApi from '@/api/dataMarket/callerSystem'
import type { CallerSystemVO } from '@/api/dataMarket/callerSystem'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketCallerSystem' })

const message = useMessage()
const loading = ref(false)
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

function emptyForm(): CallerSystemVO {
  return { id: undefined, code: '', name: '', status: 0, sort: 0, description: '' }
}

const getList = async () => {
  loading.value = true
  try {
    const data = await CallerSystemApi.getCallerSystemPage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
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
