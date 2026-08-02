<template>
  <ContentWrap>
    <el-button v-hasPermi="['data-market:domain:create']" type="primary" plain @click="openCreate"
      ><Icon icon="ep:plus" class="mr-5px" />新增主题域</el-button
    >
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" row-key="id" default-expand-all>
      <el-table-column prop="name" label="主题域名称" /><el-table-column
        prop="code"
        label="编码"
      /><el-table-column prop="description" label="说明" /><el-table-column
        prop="sort"
        label="排序"
        width="80"
      />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">{{ row.status === 0 ? '启用' : '停用' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:domain:update']"
            link
            type="primary"
            @click="edit(row)"
            >编辑</el-button
          ><el-button
            v-hasPermi="['data-market:domain:delete']"
            link
            type="danger"
            @click="remove(row.id)"
            >删除</el-button
          ></template
        ></el-table-column
      >
    </el-table>
  </ContentWrap>
  <Dialog v-model="visible" :title="form.id ? '编辑主题域' : '新增主题域'"
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="110px"
      ><el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item
      ><el-form-item label="编码" prop="code"><el-input v-model="form.code" /></el-form-item
      ><el-form-item label="上级主题域" prop="parentId"
        ><SubjectDomainSelect
          v-model="form.parentId"
          :domains="list"
          :exclude-branch-id="form.id"
          allow-top-level
          placeholder="请选择上级主题域" /></el-form-item
      ><el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item
      ><el-form-item label="状态"
        ><el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用" /></el-form-item
      ><el-form-item label="说明"
        ><el-input v-model="form.description" type="textarea" /></el-form-item></el-form
    ><template #footer><el-button type="primary" @click="save">保存</el-button></template></Dialog
  >
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { SubjectDomainVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
defineOptions({ name: 'DataMarketDomain' })
const message = useMessage()
const loading = ref(false)
const list = ref<SubjectDomainVO[]>([])
const visible = ref(false)
const formRef = ref<any>()
const form = reactive<SubjectDomainVO>({
  name: '',
  code: '',
  parentId: 0,
  description: '',
  sort: 0,
  status: 0
})
const rules = {
  name: [{ required: true, message: '请输入主题域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入主题域编码', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择上级主题域', trigger: 'change' }]
}
const getList = async () => {
  loading.value = true
  try {
    list.value = await CatalogApi.getSubjectDomainList()
  } finally {
    loading.value = false
  }
}
const reset = () =>
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    description: '',
    parentId: 0,
    sort: 0,
    status: 0
  })
const openCreate = () => {
  reset()
  visible.value = true
}
const edit = (row: SubjectDomainVO) => {
  Object.assign(form, row)
  visible.value = true
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  if (form.id) await CatalogApi.updateSubjectDomain(form.id, form)
  else await CatalogApi.createSubjectDomain(form)
  visible.value = false
  message.success('保存成功')
  getList()
}
const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteSubjectDomain(id)
  message.success('删除成功')
  getList()
}
onMounted(getList)
</script>
