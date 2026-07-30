<template>
  <ContentWrap
    ><el-button
      v-hasPermi="['data-market:source-system:create']"
      type="primary"
      plain
      @click="open()"
      >新增来源系统</el-button
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="list"
      ><el-table-column prop="name" label="系统名称" /><el-table-column
        prop="code"
        label="系统编码"
      /><el-table-column prop="ownerName" label="负责人" /><el-table-column
        prop="description"
        label="说明"
      /><el-table-column label="操作"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:source-system:update']"
            link
            type="primary"
            @click="open(row)"
            >编辑</el-button
          ><el-button
            v-hasPermi="['data-market:source-system:delete']"
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
  <Dialog v-model="visible" title="来源系统"
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="90px"
      ><el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item
      ><el-form-item label="编码" prop="code"><el-input v-model="form.code" /></el-form-item
      ><el-form-item label="负责人"><el-input v-model="form.ownerName" /></el-form-item
      ><el-form-item label="说明"
        ><el-input v-model="form.description" type="textarea" /></el-form-item></el-form
    ><template #footer><el-button type="primary" @click="save">保存</el-button></template></Dialog
  >
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { SourceSystemVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketSourceSystem' })
const message = useMessage()
const loading = ref(false)
const list = ref<SourceSystemVO[]>([])
const total = ref(0)
const visible = ref(false)
const formRef = ref<any>()
const query = reactive({ pageNo: 1, pageSize: 10 })
const form = reactive<SourceSystemVO>({ name: '', code: '', ownerName: '', description: '' })
const rules = {
  name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入系统编码', trigger: 'blur' }]
}
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
const open = (row?: SourceSystemVO) => {
  Object.assign(form, row || { id: undefined, name: '', code: '', ownerName: '', description: '' })
  visible.value = true
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
onMounted(getList)
</script>
