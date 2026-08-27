<template>
  <DataMarketManagementPage
    page-key="metadata-import"
    title="元数据导入"
    description="通过标准模板批量校验并导入数据目录元数据"
    icon="ep:upload-filled"
    tone="teal"
  >
    <template #actions>
      <el-button
        v-hasPermi="['data-market:metadata-import:query']"
        :loading="downloading"
        @click="downloadTemplate"
      >
        <Icon icon="ep:download" />下载 Excel 模板
      </el-button>
      <el-button
        v-hasPermi="['data-market:metadata-import:create']"
        type="primary"
        @click="openImport"
      >
        <Icon icon="ep:upload" />导入元数据
      </el-button>
    </template>

    <section class="dm-panel import-guide">
      <header class="dm-panel__header">
        <div>
          <h2>批量导入流程</h2>
          <p>按模板准备数据，系统校验后返回逐行处理结果</p>
        </div>
        <el-tag type="info" effect="plain" round>Excel .xls / .xlsx</el-tag>
      </header>
      <div class="import-steps">
        <article class="import-step">
          <span class="import-step__number">01</span>
          <span class="import-step__icon"><Icon icon="ep:download" /></span>
          <div><h3>下载标准模板</h3><p>使用系统提供的模板填写数据集与字段元数据。</p></div>
        </article>
        <Icon class="import-step-arrow" icon="ep:right" />
        <article class="import-step">
          <span class="import-step__number">02</span>
          <span class="import-step__icon"><Icon icon="ep:upload-filled" /></span>
          <div><h3>选择文件导入</h3><p>可选择仅新增，或明确覆盖已经存在的数据。</p></div>
        </article>
        <Icon class="import-step-arrow" icon="ep:right" />
        <article class="import-step">
          <span class="import-step__number">03</span>
          <span class="import-step__icon"><Icon icon="ep:document-checked" /></span>
          <div><h3>核对校验结果</h3><p>查看批次、数据集、字段及错误行的处理结果。</p></div>
        </article>
      </div>
      <el-alert
        title="错误行不会自动发布到数据目录，请根据校验结果修正后重新导入。"
        type="warning"
        :closable="false"
        show-icon
        class="import-notice"
      />
    </section>

    <section class="dm-panel import-boundary">
      <header class="dm-panel__header">
        <div><h2>导入说明</h2><p>导入操作只处理模板中明确提供的目录元数据</p></div>
      </header>
      <div class="boundary-grid">
        <div
          ><Icon icon="ep:circle-check" /><span
            ><strong>模板约束</strong><small>仅接收系统标准模板字段</small></span
          ></div
        >
        <div
          ><Icon icon="ep:warning" /><span
            ><strong>逐行校验</strong><small>错误信息随批次结果返回</small></span
          ></div
        >
        <div
          ><Icon icon="ep:lock" /><span
            ><strong>发布隔离</strong><small>导入不等于自动发布目录</small></span
          ></div
        >
      </div>
    </section>
  </DataMarketManagementPage>

  <Dialog
    v-model="visible"
    title="Excel 元数据导入"
    width="min(640px, calc(100vw - 32px))"
    align-center
  >
    <div class="import-dialog-intro">
      <span><Icon icon="ep:document" /></span>
      <div><strong>上传标准元数据模板</strong><p>提交前请确认文件版本与覆盖策略。</p></div>
    </div>
    <el-form label-width="110px">
      <el-form-item label="覆盖已有数据">
        <el-switch v-model="updateExisting" active-text="覆盖" inactive-text="仅新增" />
      </el-form-item>
      <el-form-item label="Excel 文件" required>
        <el-upload
          class="metadata-uploader"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xls,.xlsx"
          :on-change="selectFile"
        >
          <Icon icon="ep:upload-filled" class="metadata-uploader__icon" />
          <div class="el-upload__text">拖入文件，或<em>点击选择</em></div>
          <template #tip><div class="el-upload__tip">仅支持 .xls、.xlsx 文件</div></template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-hasPermi="['data-market:metadata-import:create']"
        type="primary"
        :loading="importing"
        @click="submit"
        >开始导入</el-button
      >
    </template>
  </Dialog>

  <Dialog
    v-model="resultVisible"
    title="导入校验结果"
    width="min(860px, calc(100vw - 32px))"
    align-center
  >
    <el-descriptions :column="3" border>
      <el-descriptions-item label="批次号">{{ result.batchNo || '—' }}</el-descriptions-item>
      <el-descriptions-item label="状态"
        ><el-tag effect="light">{{ result.status }}</el-tag></el-descriptions-item
      >
      <el-descriptions-item label="错误"
        ><strong class="result-error-count">{{ result.errorCount }}</strong></el-descriptions-item
      >
      <el-descriptions-item label="数据集">{{ result.datasetCount }}</el-descriptions-item>
      <el-descriptions-item label="字段">{{ result.fieldCount }}</el-descriptions-item>
    </el-descriptions>
    <div class="result-table-heading"
      ><h3>逐行校验信息</h3><span>共 {{ result.errors?.length || 0 }} 条</span></div
    >
    <div class="dm-table-wrap">
      <el-table :data="result.errors || []" empty-text="本批次暂无错误">
        <el-table-column prop="rowNumber" label="行号" width="90" />
        <el-table-column prop="fieldName" label="字段" width="160" />
        <el-table-column prop="errorCode" label="错误码" width="150" />
        <el-table-column prop="errorMessage" label="校验信息" min-width="260" />
      </el-table>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import download from '@/utils/download'
import * as MetadataApi from '@/api/dataMarket/metadata'
import type { MetadataImportResult } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketMetadataImport' })
const message = useMessage()
const visible = ref(false)
const resultVisible = ref(false)
const importing = ref(false)
const downloading = ref(false)
const updateExisting = ref(false)
const file = ref<File>()
const result = ref<MetadataImportResult>({
  batchNo: '',
  status: 'VALIDATING',
  datasetCount: 0,
  fieldCount: 0,
  errorCount: 0,
  errors: []
})
const selectFile = (uploadFile: { raw?: File }) => {
  file.value = uploadFile.raw
}
const openImport = () => {
  file.value = undefined
  updateExisting.value = false
  visible.value = true
}
const downloadTemplate = async () => {
  downloading.value = true
  try {
    const data = await MetadataApi.downloadMetadataTemplate()
    download.excel(data, '数据市场元数据导入模板.xlsx')
  } finally {
    downloading.value = false
  }
}
const submit = async () => {
  if (!file.value) return message.warning('请选择 Excel 文件')
  importing.value = true
  try {
    result.value = await MetadataApi.importMetadata(file.value, updateExisting.value)
    if (result.value.batchNo && result.value.status === 'VALIDATING')
      result.value = await MetadataApi.getMetadataImport(result.value.batchNo)
    visible.value = false
    resultVisible.value = true
    message.success('导入任务已提交')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped lang="scss">
.import-guide {
  padding: 22px !important;
}

.import-steps {
  display: grid;
  align-items: stretch;
  grid-template-columns: 1fr 38px 1fr 38px 1fr;
}

.import-step {
  position: relative;
  display: flex;
  min-height: 128px;
  padding: 22px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e5eaf1;
  border-radius: 10px;
  align-items: flex-start;
  gap: 14px;

  h3 {
    margin: 2px 0 8px;
    font-size: 15px;
    color: #24344f;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: #718096;
  }
}

.import-step__number {
  position: absolute;
  right: 12px;
  bottom: -8px;
  font-size: 48px;
  font-weight: 760;
  color: rgb(13 148 136 / 6%);
}

.import-step__icon {
  display: grid;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: #0d9488;
  background: #e8faf7;
  border-radius: 10px;
  flex: 0 0 42px;
  place-items: center;
}

.import-step-arrow {
  color: #a6b0bf;
  place-self: center;
}

.import-notice {
  margin-top: 18px;
}

.boundary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  > div {
    display: flex;
    padding: 16px;
    color: #0d9488;
    background: #fbfcfd;
    border: 1px solid #e8ecf2;
    border-radius: 9px;
    align-items: center;
    gap: 12px;
  }

  span {
    display: grid;
    gap: 4px;
  }

  strong {
    font-size: 14px;
    color: #2b3a52;
  }

  small {
    color: #7d8899;
  }
}

.import-dialog-intro {
  display: flex;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: #effaf8;
  border: 1px solid #d7f0eb;
  border-radius: 9px;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    color: #0d9488;
    background: #dff6f2;
    border-radius: 9px;
    place-items: center;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #718096;
  }
}

.metadata-uploader {
  width: 100%;

  :deep(.el-upload),
  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.metadata-uploader__icon {
  margin-bottom: 10px;
  font-size: 34px;
  color: #0d9488;
}

.result-table-heading {
  display: flex;
  margin: 20px 0 10px;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #2b3a52;
  }

  span {
    font-size: 12px;
    color: #8a96a8;
  }
}

.result-error-count {
  color: var(--el-color-danger);
}

@media (width <= 900px) {
  .import-steps,
  .boundary-grid {
    grid-template-columns: 1fr;
  }

  .import-step-arrow {
    transform: rotate(90deg);
  }
}
</style>
