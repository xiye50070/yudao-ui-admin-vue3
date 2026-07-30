<template>
  <ContentWrap
    ><el-button v-hasPermi="['data-market:metadata-import:query']" @click="downloadTemplate"
      ><Icon icon="ep:download" class="mr-5px" />下载 Excel 模板</el-button
    ><el-button
      v-hasPermi="['data-market:metadata-import:create']"
      type="primary"
      plain
      @click="visible = true"
      ><Icon icon="ep:upload" class="mr-5px" />导入元数据</el-button
    ></ContentWrap
  >
  <ContentWrap
    ><el-alert
      title="导入后请核对每一行校验结果；错误行不会自动发布到数据目录。"
      type="warning"
      :closable="false"
  /></ContentWrap>
  <Dialog v-model="visible" title="Excel 元数据导入" width="620px"
    ><el-form label-width="110px"
      ><el-form-item label="来源系统 ID"
        ><el-input-number v-model="sourceSystemId" :min="1" /></el-form-item
      ><el-form-item label="Excel 文件"
        ><el-upload :auto-upload="false" :limit="1" accept=".xls,.xlsx" :on-change="selectFile"
          ><el-button>选择文件</el-button
          ><template #tip
            ><div class="el-upload__tip">仅支持 .xls、.xlsx 文件</div></template
          ></el-upload
        ></el-form-item
      ></el-form
    ><template #footer
      ><el-button
        v-hasPermi="['data-market:metadata-import:create']"
        type="primary"
        :loading="importing"
        @click="submit"
        >开始导入</el-button
      ></template
    ></Dialog
  >
  <Dialog v-model="resultVisible" title="导入校验结果" width="760px"
    ><el-descriptions :column="3" border
      ><el-descriptions-item label="批次号">{{ result.batchNo }}</el-descriptions-item
      ><el-descriptions-item label="成功">{{ result.successCount || 0 }}</el-descriptions-item
      ><el-descriptions-item label="失败">{{
        result.failedCount || 0
      }}</el-descriptions-item></el-descriptions
    ><el-table class="mt-12px" :data="result.errors || []"
      ><el-table-column prop="rowNo" label="行号" width="90" /><el-table-column
        prop="field"
        label="字段"
        width="140" /><el-table-column prop="message" label="校验信息" /></el-table
  ></Dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import download from '@/utils/download'
import * as MetadataApi from '@/api/dataMarket/metadata'
import type { MetadataImportResult } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketMetadataImport' })
const message = useMessage()
const visible = ref(false)
const resultVisible = ref(false)
const importing = ref(false)
const sourceSystemId = ref<number>()
const file = ref<File>()
const result = ref<MetadataImportResult>({ batchNo: '' })
const selectFile = (uploadFile: { raw?: File }) => {
  file.value = uploadFile.raw
}
const downloadTemplate = async () => {
  const data = await MetadataApi.downloadMetadataTemplate()
  download.excel(data, '数据市场元数据导入模板.xlsx')
}
const submit = async () => {
  if (!file.value) return message.warning('请选择 Excel 文件')
  importing.value = true
  try {
    result.value = await MetadataApi.importMetadata(file.value, sourceSystemId.value)
    if (result.value.batchNo && !result.value.errors)
      result.value = await MetadataApi.getMetadataImport(result.value.batchNo)
    visible.value = false
    resultVisible.value = true
    message.success('导入任务已提交')
  } finally {
    importing.value = false
  }
}
</script>
