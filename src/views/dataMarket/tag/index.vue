<template>
  <ContentWrap
    ><el-form :inline="true"
      ><el-form-item
        ><el-input
          v-model="query.keyword"
          placeholder="标签名称或编码"
          clearable
          @keyup.enter="applyFilter" /></el-form-item
      ><el-form-item
        ><el-button @click="applyFilter">查询</el-button
        ><el-button v-hasPermi="['data-market:tag:create']" type="primary" plain @click="open()"
          >新增标签</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="list"
      ><el-table-column prop="name" label="标签名称" /><el-table-column
        prop="code"
        label="编码"
      /><el-table-column prop="sort" label="排序" width="90" /><el-table-column
        label="状态"
        width="90"
        ><template #default="{ row }">{{
          row.status === 0 ? '启用' : '停用'
        }}</template></el-table-column
      ><el-table-column label="颜色"
        ><template #default="{ row }"
          ><el-tag :color="row.color">{{ row.color || '默认' }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作"
        ><template #default="{ row }"
          ><el-button v-hasPermi="['data-market:tag:update']" link type="primary" @click="open(row)"
            >编辑</el-button
          ><el-button
            v-hasPermi="['data-market:tag:delete']"
            link
            type="danger"
            @click="remove(row.id)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    ></ContentWrap
  >
  <Dialog v-model="visible" title="标准标签"
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="80px"
      ><el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item
      ><el-form-item label="编码" prop="code"><el-input v-model="form.code" /></el-form-item
      ><el-form-item label="说明"
        ><el-input v-model="form.description" type="textarea" /></el-form-item
      ><el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item
      ><el-form-item label="状态"
        ><el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用" /></el-form-item
      ><el-form-item label="颜色"><el-color-picker v-model="form.color" /></el-form-item></el-form
    ><template #footer><el-button type="primary" @click="save">保存</el-button></template></Dialog
  >
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { TagVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketTag' })
const message = useMessage()
const loading = ref(false)
const list = ref<TagVO[]>([])
const sourceList = ref<TagVO[]>([])
const visible = ref(false)
const formRef = ref<any>()
const query = reactive({ keyword: '' })
const form = reactive<TagVO>({ name: '', code: '', description: '', color: '', sort: 0, status: 0 })
const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入标签编码', trigger: 'blur' }]
}
const getList = async () => {
  loading.value = true
  try {
    sourceList.value = await CatalogApi.getTags()
    applyFilter()
  } finally {
    loading.value = false
  }
}
const applyFilter = () => {
  const keyword = query.keyword.trim().toLowerCase()
  list.value = keyword
    ? sourceList.value.filter(
        (tag) =>
          tag.name.toLowerCase().includes(keyword) || tag.code.toLowerCase().includes(keyword)
      )
    : sourceList.value
}
const open = (row?: TagVO) => {
  Object.assign(
    form,
    row || {
      id: undefined,
      name: '',
      code: '',
      description: '',
      color: '',
      sort: 0,
      status: 0
    }
  )
  visible.value = true
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  form.id ? await CatalogApi.updateTag(form.id, form) : await CatalogApi.createTag(form)
  visible.value = false
  message.success('保存成功')
  getList()
}
const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteTag(id)
  message.success('删除成功')
  getList()
}
onMounted(getList)
</script>
