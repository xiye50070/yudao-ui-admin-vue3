<template>
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="筛选维度" name="dimension">
        <el-button
          v-hasPermi="['data-market:tag:create']"
          type="primary"
          plain
          @click="openDimension()"
        >
          新增维度
        </el-button>
        <el-table v-loading="loading" :data="dimensions" class="mt-16px">
          <el-table-column prop="name" label="维度名称" />
          <el-table-column prop="code" label="编码" />
          <el-table-column prop="description" label="说明" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">{{ row.status === 0 ? '启用' : '停用' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['data-market:tag:update']"
                link
                type="primary"
                @click="openDimension(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['data-market:tag:delete']"
                link
                type="danger"
                @click="removeDimension(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="标准标签" name="tag">
        <el-form :inline="true">
          <el-form-item>
            <el-input
              v-model="query.keyword"
              placeholder="标签名称或编码"
              clearable
              @keyup.enter="applyFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.dimensionId" placeholder="全部筛选维度" clearable>
              <el-option
                v-for="dimension in dimensions"
                :key="dimension.id"
                :label="dimension.name"
                :value="dimension.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="applyFilter">查询</el-button>
            <el-button
              v-hasPermi="['data-market:tag:create']"
              type="primary"
              plain
              :disabled="!dimensions.length"
              @click="openTag()"
            >
              新增标签
            </el-button>
          </el-form-item>
        </el-form>
        <el-alert
          v-if="!dimensions.length"
          title="请先创建并启用筛选维度，再维护标准标签"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-table v-loading="loading" :data="tags">
          <el-table-column prop="name" label="标签名称" />
          <el-table-column prop="code" label="编码" />
          <el-table-column label="筛选维度">
            <template #default="{ row }">{{ resolveDimensionName(row.dimensionId) }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">{{ row.status === 0 ? '启用' : '停用' }}</template>
          </el-table-column>
          <el-table-column label="颜色">
            <template #default="{ row }">
              <el-tag :color="row.color">{{ row.color || '默认' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['data-market:tag:update']"
                link
                type="primary"
                @click="openTag(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['data-market:tag:delete']"
                link
                type="danger"
                @click="removeTag(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>

  <Dialog v-model="dimensionVisible" title="筛选维度">
    <el-form
      ref="dimensionFormRef"
      :model="dimensionForm"
      :rules="dimensionRules"
      label-width="90px"
    >
      <el-form-item label="维度名称" prop="name">
        <el-input v-model="dimensionForm.name" placeholder="例如 数据源类型" />
      </el-form-item>
      <el-form-item label="编码" prop="code">
        <el-input v-model="dimensionForm.code" placeholder="例如 SOURCE_TYPE" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="dimensionForm.description" type="textarea" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="dimensionForm.sort" :min="0" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="dimensionForm.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="saveDimension">保存</el-button>
    </template>
  </Dialog>

  <Dialog v-model="tagVisible" title="标准标签">
    <el-form ref="tagFormRef" :model="tagForm" :rules="tagRules" label-width="90px">
      <el-form-item label="筛选维度" prop="dimensionId">
        <el-select v-model="tagForm.dimensionId" placeholder="请选择筛选维度">
          <el-option
            v-for="dimension in dimensions"
            :key="dimension.id"
            :label="dimension.name"
            :value="dimension.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name"><el-input v-model="tagForm.name" /></el-form-item>
      <el-form-item label="编码" prop="code"><el-input v-model="tagForm.code" /></el-form-item>
      <el-form-item label="说明">
        <el-input v-model="tagForm.description" type="textarea" />
      </el-form-item>
      <el-form-item label="排序"><el-input-number v-model="tagForm.sort" :min="0" /></el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="tagForm.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="颜色"><el-color-picker v-model="tagForm.color" /></el-form-item>
    </el-form>
    <template #footer><el-button type="primary" @click="saveTag">保存</el-button></template>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { FilterDimensionVO, TagVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketTag' })

const message = useMessage()
const activeTab = ref('dimension')
const loading = ref(false)
const dimensions = ref<FilterDimensionVO[]>([])
const tags = ref<TagVO[]>([])
const sourceTags = ref<TagVO[]>([])
const dimensionVisible = ref(false)
const tagVisible = ref(false)
const dimensionFormRef = ref<any>()
const tagFormRef = ref<any>()
const query = reactive<{ keyword: string; dimensionId?: number }>({ keyword: '' })
const dimensionForm = reactive<FilterDimensionVO>(emptyDimension())
const tagForm = reactive<TagVO>(emptyTag())
const dimensionRules = {
  name: [{ required: true, message: '请输入维度名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入维度编码', trigger: 'blur' }]
}
const tagRules = {
  dimensionId: [{ required: true, message: '请选择筛选维度', trigger: 'change' }],
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入标签编码', trigger: 'blur' }]
}

function emptyDimension(): FilterDimensionVO {
  return { name: '', code: '', description: '', sort: 0, status: 0 }
}

function emptyTag(): TagVO {
  return {
    dimensionId: undefined,
    name: '',
    code: '',
    description: '',
    color: '',
    sort: 0,
    status: 0
  }
}

const getList = async () => {
  loading.value = true
  try {
    const [dimensionList, tagList] = await Promise.all([
      CatalogApi.getFilterDimensions(),
      CatalogApi.getTags()
    ])
    dimensions.value = dimensionList
    sourceTags.value = tagList
    applyFilter()
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = query.keyword.trim().toLowerCase()
  tags.value = sourceTags.value.filter((tag) => {
    if (query.dimensionId && tag.dimensionId !== query.dimensionId) return false
    return (
      !keyword ||
      tag.name.toLowerCase().includes(keyword) ||
      tag.code.toLowerCase().includes(keyword)
    )
  })
}

const resolveDimensionName = (dimensionId?: number) =>
  dimensions.value.find((dimension) => dimension.id === dimensionId)?.name || '未配置'

const openDimension = (row?: FilterDimensionVO) => {
  Object.assign(dimensionForm, emptyDimension(), row || {})
  dimensionVisible.value = true
}

const saveDimension = async () => {
  if (!(await dimensionFormRef.value.validate())) return
  dimensionForm.id
    ? await CatalogApi.updateFilterDimension(dimensionForm.id, dimensionForm)
    : await CatalogApi.createFilterDimension(dimensionForm)
  dimensionVisible.value = false
  message.success('保存成功')
  await getList()
}

const removeDimension = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteFilterDimension(id)
  message.success('删除成功')
  await getList()
}

const openTag = (row?: TagVO) => {
  Object.assign(tagForm, emptyTag(), row || {})
  tagVisible.value = true
}

const saveTag = async () => {
  if (!(await tagFormRef.value.validate())) return
  tagForm.id ? await CatalogApi.updateTag(tagForm.id, tagForm) : await CatalogApi.createTag(tagForm)
  tagVisible.value = false
  message.success('保存成功')
  await getList()
}

const removeTag = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteTag(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
