<script setup lang="ts">
import { computed } from 'vue'
import type { ApplicationDatasetDetailVO, ApplicationDetailVO } from '@/api/dataMarket/types'
import { buildApplicationResourcePresentation } from './presentation'

const props = defineProps<{
  detail: Pick<ApplicationDetailVO, 'datasets' | 'resourceGroups'>
}>()

const resources = computed(() => buildApplicationResourcePresentation(props.detail))

const datasetTitle = (dataset: ApplicationDatasetDetailVO) =>
  dataset.datasetSnapshot.businessName ||
  dataset.datasetSnapshot.datasetCode ||
  `数据集 ${dataset.datasetId}`

const datasetCode = (dataset: ApplicationDatasetDetailVO) =>
  dataset.datasetSnapshot.datasetCode || `ID ${dataset.datasetId}`
</script>

<template>
  <div class="application-resource-detail">
    <section v-if="resources.ordinaryDatasets.length" class="ordinary-resource-section">
      <header class="resource-section-header">
        <div class="resource-section-title">
          <el-tag effect="plain" type="info">普通数据集</el-tag>
          <strong>直接申请的数据集</strong>
        </div>
        <span>{{ resources.ordinaryDatasets.length }} 个</span>
      </header>
      <el-collapse class="resource-collapse">
        <el-collapse-item
          v-for="item in resources.ordinaryDatasets"
          :key="item.key"
          :name="item.key"
        >
          <template #title>
            <div class="dataset-collapse-title">
              <strong>{{ datasetTitle(item.dataset) }}</strong>
              <code>{{ datasetCode(item.dataset) }}</code>
            </div>
          </template>
          <el-table :data="item.dataset.fields" size="small">
            <el-table-column prop="fieldName" label="字段" />
            <el-table-column prop="dataType" label="类型" />
            <el-table-column prop="sensitivityLevel" label="敏感级" />
            <el-table-column label="返回">
              <template #default="{ row }">
                <el-tag :type="row.returnSelected ? 'success' : 'info'">
                  {{ row.returnSelected ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="查询条件">
              <template #default="{ row }">
                {{ row.querySelected ? (row.queryCapabilities || []).join('、') : '否' }}
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </section>

    <section
      v-for="master in resources.masterObjects"
      :key="master.key"
      class="master-resource-section"
    >
      <header class="master-resource-header">
        <div class="master-resource-identity">
          <el-tag effect="dark" type="primary">主数据对象</el-tag>
          <div class="master-resource-name">
            <strong>{{ master.name }}</strong>
            <code v-if="master.code">{{ master.code }}</code>
          </div>
        </div>
        <div class="master-resource-meta">
          <el-tag v-if="master.versionNo != null" effect="plain">V{{ master.versionNo }}</el-tag>
          <span>{{ master.components.length }} 个组件</span>
        </div>
      </header>
      <el-collapse class="master-component-collapse">
        <el-collapse-item
          v-for="component in master.components"
          :key="`${master.key}:${component.componentKey}`"
          :name="`${master.key}:${component.componentKey}`"
        >
          <template #title>
            <div class="component-collapse-title">
              <el-tag :type="component.levelCode === 'M1' ? 'primary' : 'success'" effect="plain">
                {{ component.levelLabel }}
              </el-tag>
              <div class="component-identity">
                <strong>{{ component.displayName }}</strong>
                <code>{{ datasetCode(component.dataset) }}</code>
              </div>
            </div>
          </template>
          <el-table :data="component.dataset.fields" size="small">
            <el-table-column prop="fieldName" label="字段" />
            <el-table-column prop="dataType" label="类型" />
            <el-table-column prop="sensitivityLevel" label="敏感级" />
            <el-table-column label="返回">
              <template #default="{ row }">
                <el-tag :type="row.returnSelected ? 'success' : 'info'">
                  {{ row.returnSelected ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="查询条件">
              <template #default="{ row }">
                {{ row.querySelected ? (row.queryCapabilities || []).join('、') : '否' }}
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <el-empty
        v-if="!master.components.length"
        description="该主数据对象未保存可展示的组件快照"
        :image-size="52"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.application-resource-detail {
  display: grid;
  gap: 16px;
}

.ordinary-resource-section,
.master-resource-section {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
}

.master-resource-section {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.resource-section-header,
.master-resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 0 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.resource-section-title,
.master-resource-identity,
.master-resource-meta,
.component-collapse-title,
.dataset-collapse-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.resource-section-header > span,
.master-resource-meta,
.dataset-collapse-title code,
.component-identity code,
.master-resource-name code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.master-resource-name,
.component-identity {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.master-resource-name strong,
.component-identity strong,
.dataset-collapse-title strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-collapse,
.master-component-collapse {
  border: 0;
}

.resource-collapse :deep(.el-collapse-item__header),
.master-component-collapse :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 56px;
  padding: 0 18px;
  background: transparent;
}

.resource-collapse :deep(.el-collapse-item__content),
.master-component-collapse :deep(.el-collapse-item__content) {
  padding: 0 18px 18px;
}

.component-collapse-title,
.dataset-collapse-title {
  flex: 1;
  padding-right: 12px;
}

.dataset-collapse-title code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 960px) {
  .resource-section-header,
  .master-resource-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px;
    gap: 8px;
  }
}
</style>
