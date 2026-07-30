<template>
  <ContentWrap
    ><el-form :inline="true"
      ><el-form-item
        ><el-input
          v-model="query.keyword"
          placeholder="数据集名称或编码"
          clearable
          @keyup.enter="getList" /></el-form-item
      ><el-form-item
        ><el-button @click="getList">查询</el-button
        ><el-button
          v-hasPermi="['data-market:dataset:create']"
          type="primary"
          plain
          @click="openDrawer()"
          ><Icon icon="ep:plus" class="mr-5px" />新增数据集</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="list"
      ><el-table-column prop="businessName" label="数据集名称" /><el-table-column
        prop="datasetCode"
        label="编码"
      /><el-table-column prop="sourceSystemName" label="来源系统" /><el-table-column
        prop="sensitivityLevel"
        label="敏感级"
        width="90"
      /><el-table-column prop="fieldCount" label="字段数" width="90" /><el-table-column
        prop="status"
        label="状态"
      /><el-table-column label="操作" width="250"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:dataset:update']"
            link
            type="primary"
            @click="openDrawer(row)"
            >编辑</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:update']"
            link
            type="primary"
            @click="openFields(row)"
            >字段</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:publish']"
            link
            type="success"
            @click="publish(row)"
            >发布</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:delete']"
            link
            type="danger"
            @click="remove(row.id)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    ><Pagination
      v-model:limit="query.pageSize"
      v-model:page="query.pageNo"
      :total="total"
      @pagination="getList"
  /></ContentWrap>
  <el-drawer v-model="drawer" :title="form.id ? '编辑数据集' : '新增数据集'" size="560px"
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
      ><el-form-item label="数据集名称" prop="businessName"
        ><el-input v-model="form.businessName" /></el-form-item
      ><el-form-item label="来源系统" prop="sourceSystemId"
        ><el-input-number
          v-model="form.sourceSystemId"
          :min="1"
          placeholder="请输入来源系统 ID" /></el-form-item
      ><el-form-item label="物理表名"><el-input v-model="form.physicalName" /></el-form-item
      ><el-form-item label="主题域 ID"
        ><el-input-number v-model="form.subjectDomainId" :min="1" /></el-form-item
      ><el-form-item label="敏感级别"
        ><el-select v-model="form.sensitivityLevel"
          ><el-option
            v-for="level in [0, 1, 2, 3, 4]"
            :key="level"
            :label="`L${level}`"
            :value="level" /></el-select></el-form-item
      ><el-form-item label="说明"
        ><el-input v-model="form.description" type="textarea" /></el-form-item></el-form
    ><template #footer
      ><el-button @click="drawer = false">取消</el-button><DatasetActions @save="save" /></template
  ></el-drawer>
  <Dialog v-model="fieldVisible" title="字段编辑" width="760px"
    ><el-table :data="fields"
      ><el-table-column label="字段名"
        ><template #default="{ row }"><el-input v-model="row.name" /></template></el-table-column
      ><el-table-column label="类型"
        ><template #default="{ row }"
          ><el-input v-model="row.dataType" /></template></el-table-column
      ><el-table-column label="敏感级"
        ><template #default="{ row }"
          ><el-input-number
            v-model="row.sensitivityLevel"
            :min="0"
            :max="4" /></template></el-table-column
      ><el-table-column label="说明"
        ><template #default="{ row }"
          ><el-input v-model="row.description" /></template></el-table-column></el-table
    ><el-button v-hasPermi="['data-market:dataset:update']" class="mt-12px" @click="addField"
      >新增字段</el-button
    ><template #footer
      ><el-button v-hasPermi="['data-market:dataset:update']" type="primary" @click="saveFields"
        >保存字段</el-button
      ></template
    ></Dialog
  >
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { DatasetFieldVO, DatasetVO } from '@/api/dataMarket/types'
import DatasetActions from './DatasetActions.vue'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketDataset' })
const message = useMessage()
const loading = ref(false)
const list = ref<DatasetVO[]>([])
const total = ref(0)
const query = reactive({ pageNo: 1, pageSize: 10, keyword: '' })
const drawer = ref(false)
const fieldVisible = ref(false)
const formRef = ref<any>()
const currentId = ref<number>()
const fields = ref<DatasetFieldVO[]>([])
const form = reactive<DatasetVO>({
  businessName: '',
  sourceSystemId: undefined,
  physicalName: '',
  subjectDomainId: undefined,
  sensitivityLevel: 0,
  description: ''
})
const rules = {
  businessName: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
  sourceSystemId: [{ required: true, message: '请选择来源系统', trigger: 'change' }]
}
const getList = async () => {
  loading.value = true
  try {
    const data = await CatalogApi.getDatasetPage(query)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const openDrawer = async (row?: DatasetVO) => {
  Object.assign(form, {
    id: undefined,
    businessName: '',
    sourceSystemId: undefined,
    physicalName: '',
    subjectDomainId: undefined,
    sensitivityLevel: 0,
    description: ''
  })
  if (row?.id) Object.assign(form, await CatalogApi.getDataset(row.id))
  drawer.value = true
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  form.id ? await CatalogApi.updateDataset(form.id, form) : await CatalogApi.createDataset(form)
  drawer.value = false
  message.success('保存成功')
  getList()
}
const openFields = async (row: DatasetVO) => {
  currentId.value = row.id
  fields.value = row.id ? await CatalogApi.getDatasetFields(row.id) : []
  fieldVisible.value = true
}
const addField = () => fields.value.push({ name: '', dataType: 'varchar', sensitivityLevel: 0 })
const saveFields = async () => {
  if (!currentId.value || fields.value.some((field) => !field.name || !field.dataType))
    return message.warning('字段名称和类型不能为空')
  await CatalogApi.updateDatasetFields(currentId.value, fields.value)
  fieldVisible.value = false
  message.success('字段已保存')
}
const publish = async (row: DatasetVO) => {
  await message.confirm(`确认发布「${row.businessName}」吗？`)
  await CatalogApi.publishDataset(row.id!, {})
  message.success('已发布')
  getList()
}
const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteDataset(id)
  message.success('删除成功')
  getList()
}
onMounted(getList)
</script>
