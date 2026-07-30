<template>
  <ContentWrap>
    <el-descriptions title="数据目录总览" :column="3" border>
      <el-descriptions-item label="主题域">{{ domains.length }}</el-descriptions-item>
      <el-descriptions-item label="标准标签">{{ tags.length }}</el-descriptions-item>
      <el-descriptions-item label="来源系统">{{ sourceSystems.length }}</el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <ContentWrap>
    <el-table :data="domains" size="small"
      ><el-table-column prop="name" label="主题域" /><el-table-column
        prop="code"
        label="编码" /><el-table-column prop="visibleDatasetCount" label="数据集数"
    /></el-table>
  </ContentWrap>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
defineOptions({ name: 'DataMarketCatalog' })
const domains = ref<any[]>([])
const tags = ref<any[]>([])
const sourceSystems = ref<any[]>([])
onMounted(async () => {
  const [domainData, tagData, sourceData] = await Promise.all([
    CatalogApi.getSubjectDomainList(),
    CatalogApi.getTags(),
    CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 1 })
  ])
  domains.value = domainData
  tags.value = tagData
  sourceSystems.value = sourceData.list || []
})
</script>
