<template>
  <DataMarketManagementPage
    page-key="tag"
    title="标准标签"
    description="统一维护目录筛选维度与标准标签"
    icon="ep:price-tag"
    tone="teal"
  >
    <template #actions>
      <el-tooltip content="刷新标签数据" placement="bottom">
        <el-button :loading="loading" aria-label="刷新标签数据" @click="getList">
          <Icon v-if="!loading" icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-button
        v-hasPermi="['data-market:tag:create']"
        type="primary"
        :disabled="!dimensions.length"
        @click="openTag()"
      >
        <Icon icon="ep:plus" />新增标签
      </el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:grid" /></span>
        <span class="dm-summary-item__content"
          ><small>筛选维度</small><strong>{{ dimensions.length }}</strong></span
        >
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:price-tag" /></span>
        <span class="dm-summary-item__content"
          ><small>标准标签</small><strong>{{ sourceTags.length }}</strong></span
        >
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span>
        <span class="dm-summary-item__content"
          ><small>启用标签</small><strong>{{ enabledTagCount }}</strong></span
        >
      </div>
    </template>

    <section class="dm-panel tag-workspace">
      <el-result
        v-if="loadError"
        class="dm-load-result"
        icon="warning"
        title="标签数据加载失败"
        sub-title="暂时无法获取筛选维度和标准标签"
      >
        <template #extra><el-button type="primary" @click="getList">重新加载</el-button></template>
      </el-result>
      <el-tabs v-else v-model="activeTab" class="tag-tabs">
        <el-tab-pane name="dimension">
          <template #label>
            <span class="tag-tab-label"><Icon icon="ep:grid" />筛选维度</span>
          </template>
          <div class="dm-panel__header tag-section-header">
            <div>
              <h2>筛选维度</h2>
              <p>标签按维度组织，便于目录检索与条件筛选</p>
            </div>
            <el-button
              v-hasPermi="['data-market:tag:create']"
              type="primary"
              plain
              @click="openDimension()"
            >
              <Icon icon="ep:plus" />新增维度
            </el-button>
          </div>
          <div class="dm-table-wrap">
            <el-table v-loading="loading" :data="dimensions" empty-text="暂无筛选维度">
              <el-table-column label="维度名称" min-width="220">
                <template #default="{ row }">
                  <div class="dm-entity-cell">
                    <span class="dm-entity-mark"><Icon icon="ep:grid" /></span>
                    <span class="dm-entity-copy">
                      <strong>{{ row.name }}</strong>
                      <small>{{ row.description || '暂无说明' }}</small>
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="编码" min-width="160">
                <template #default="{ row }"
                  ><span class="dm-code">{{ row.code }}</span></template
                >
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="100" align="center" />
              <el-table-column label="状态" width="108" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>
                    {{ row.status === 0 ? '启用' : '停用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="right">
                <template #default="{ row }">
                  <div class="dm-row-actions">
                    <el-button
                      v-hasPermi="['data-market:tag:update']"
                      link
                      type="primary"
                      @click="openDimension(row)"
                      >编辑</el-button
                    >
                    <el-button
                      v-hasPermi="['data-market:tag:delete']"
                      link
                      type="danger"
                      @click="removeDimension(row.id)"
                      >删除</el-button
                    >
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="tag">
          <template #label>
            <span class="tag-tab-label"><Icon icon="ep:price-tag" />标准标签</span>
          </template>
          <div class="dm-panel__header tag-section-header">
            <div>
              <h2>标准标签</h2>
              <p>当前条件下显示 {{ tags.length }} 个标签</p>
            </div>
            <div class="dm-toolbar tag-filter">
              <el-input
                v-model="query.keyword"
                clearable
                placeholder="搜索名称或编码"
                @keyup.enter="applyFilter"
              >
                <template #prefix><Icon icon="ep:search" /></template>
              </el-input>
              <el-select
                v-model="query.dimensionId"
                clearable
                placeholder="全部筛选维度"
                @change="applyFilter"
              >
                <el-option
                  v-for="dimension in dimensionOptions"
                  :key="dimension.id"
                  :label="dimension.name"
                  :value="dimension.id"
                />
              </el-select>
              <el-button type="primary" plain @click="applyFilter">查询</el-button>
            </div>
          </div>
          <el-alert
            v-if="!dimensions.length"
            title="请先创建并启用筛选维度，再维护标准标签"
            type="warning"
            :closable="false"
            show-icon
            class="mb-16px"
          />
          <div class="dm-table-wrap">
            <el-table v-loading="loading" :data="tags" empty-text="暂无标准标签">
              <el-table-column label="标签名称" min-width="220">
                <template #default="{ row }">
                  <div class="dm-entity-cell">
                    <span
                      class="tag-color"
                      :style="{ backgroundColor: row.color || '#1677ff' }"
                    ></span>
                    <span class="dm-entity-copy"
                      ><strong>{{ row.name }}</strong
                      ><small>{{ row.description || '暂无说明' }}</small></span
                    >
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="编码" min-width="150"
                ><template #default="{ row }"
                  ><span class="dm-code">{{ row.code }}</span></template
                ></el-table-column
              >
              <el-table-column label="筛选维度" min-width="150"
                ><template #default="{ row }">{{
                  resolveDimensionName(row.dimensionId)
                }}</template></el-table-column
              >
              <el-table-column prop="sort" label="排序" width="90" align="center" />
              <el-table-column label="状态" width="108" align="center"
                ><template #default="{ row }"
                  ><el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>{{
                    row.status === 0 ? '启用' : '停用'
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column label="操作" width="140" align="right"
                ><template #default="{ row }"
                  ><div class="dm-row-actions"
                    ><el-button
                      v-hasPermi="['data-market:tag:update']"
                      link
                      type="primary"
                      @click="openTag(row)"
                      >编辑</el-button
                    ><el-button
                      v-hasPermi="['data-market:tag:delete']"
                      link
                      type="danger"
                      @click="removeTag(row.id)"
                      >删除</el-button
                    ></div
                  ></template
                ></el-table-column
              >
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </DataMarketManagementPage>

  <Dialog
    v-model="dimensionVisible"
    :title="dimensionForm.id ? '编辑筛选维度' : '新增筛选维度'"
    width="min(560px, calc(100vw - 32px))"
    align-center
  >
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
      <el-button @click="dimensionVisible = false">取消</el-button>
      <el-button type="primary" @click="saveDimension">保存</el-button>
    </template>
  </Dialog>

  <Dialog
    v-model="tagVisible"
    :title="tagForm.id ? '编辑标准标签' : '新增标准标签'"
    width="min(560px, calc(100vw - 32px))"
    align-center
  >
    <el-form ref="tagFormRef" :model="tagForm" :rules="tagRules" label-width="90px">
      <el-form-item label="筛选维度" prop="dimensionId">
        <el-select v-model="tagForm.dimensionId" placeholder="请选择筛选维度">
          <el-option
            v-for="dimension in dimensionOptions"
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
    <template #footer
      ><el-button @click="tagVisible = false">取消</el-button
      ><el-button type="primary" @click="saveTag">保存</el-button></template
    >
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { FilterDimensionVO, TagVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketTag' })

const message = useMessage()
const activeTab = ref('dimension')
const loading = ref(false)
const loadError = ref(false)
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
const enabledTagCount = computed(() => sourceTags.value.filter((tag) => tag.status === 0).length)
const dimensionOptions = computed(() =>
  dimensions.value.filter(
    (dimension): dimension is FilterDimensionVO & { id: number } => dimension.id !== undefined
  )
)

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
  loadError.value = false
  try {
    const [dimensionList, tagList] = await Promise.all([
      CatalogApi.getFilterDimensions(),
      CatalogApi.getTags()
    ])
    dimensions.value = dimensionList
    sourceTags.value = tagList
    applyFilter()
  } catch {
    loadError.value = true
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

<style scoped lang="scss">
.tag-workspace {
  padding-top: 6px !important;
}

.tag-tabs :deep(.el-tabs__header) {
  padding: 0 20px;
  margin: 0 -18px 18px;
  border-bottom: 1px solid #edf0f4;
}

.tag-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tag-tab-label {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 7px;
}

.tag-section-header {
  margin-bottom: 14px !important;
}

.tag-filter :deep(.el-input) {
  width: 230px;
}

.tag-filter :deep(.el-select) {
  width: 180px;
}

.tag-color {
  width: 12px;
  height: 36px;
  border: 3px solid rgb(255 255 255 / 85%);
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgb(23 35 61 / 10%);
  flex: 0 0 12px;
}

@media (width <= 900px) {
  .tag-filter :deep(.el-input),
  .tag-filter :deep(.el-select) {
    width: min(100%, 240px);
  }
}
</style>
