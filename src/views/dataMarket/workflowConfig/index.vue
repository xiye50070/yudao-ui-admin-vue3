<template>
  <DataMarketManagementPage
    page-key="workflow-config"
    title="流程配置"
    description="为各类数据申请绑定审批流程"
    icon="ep:connection"
    tone="amber"
  >
    <template #actions>
      <el-button :loading="configLoading || definitionLoading" @click="refresh">
        <Icon icon="ep:refresh" />刷新
      </el-button>
      <el-button
        v-hasPermi="['data-market:workflow-config:update']"
        type="primary"
        :loading="saving"
        :disabled="configLoadError"
        @click="save"
        >保存 {{ currentLabel }} 流程</el-button
      >
    </template>

    <section class="dm-panel workflow-panel">
      <header class="dm-panel__header">
        <div><h2>申请类型与流程映射</h2><p>每类申请独立绑定一条 BPM 流程定义</p></div>
        <el-tag :type="form.status === 0 ? 'success' : 'info'" effect="light" round>
          {{ form.status === 0 ? '当前配置已启用' : '当前配置已停用' }}
        </el-tag>
      </header>

      <el-alert
        title="保存操作只更新流程映射，实际审批仍由 BPM 服务执行。"
        type="info"
        :closable="false"
        show-icon
        class="workflow-notice"
      />

      <el-tabs v-model="applicationType" class="workflow-tabs" @tab-change="getConfig">
        <el-tab-pane
          v-for="option in APPLICATION_TYPE_OPTIONS"
          :key="option.value"
          :label="option.label"
          :name="option.value"
        />
      </el-tabs>

      <el-result
        v-if="configLoadError"
        class="dm-load-result"
        icon="warning"
        title="流程配置加载失败"
        sub-title="暂时无法获取当前申请类型的流程配置"
      >
        <template #extra
          ><el-button type="primary" @click="getConfig">重新加载</el-button></template
        >
      </el-result>
      <div v-else v-loading="configLoading" class="workflow-config-grid">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="workflow-form"
        >
          <el-form-item label="流程定义" prop="processDefinitionKey">
            <el-select
              v-model="form.processDefinitionKey"
              :disabled="definitionLoading"
              :loading="definitionLoading"
              class="!w-1/1"
              filterable
              no-data-text="暂无可用流程定义"
              placeholder="请选择流程定义"
              @change="handleDefinitionChange"
            >
              <el-option
                v-if="missingSelectedDefinition"
                :label="missingSelectedDefinitionLabel"
                :value="form.processDefinitionKey"
                disabled
              />
              <el-option
                v-for="definition in processDefinitionOptions"
                :key="definition.key"
                :label="formatDefinitionLabel(definition)"
                :value="definition.key"
              />
            </el-select>
            <p class="workflow-form__tip">列表来自当前可用的 BPM 流程定义</p>
          </el-form-item>
          <el-form-item label="配置状态">
            <div class="workflow-status-control">
              <el-switch
                v-model="form.status"
                :active-value="0"
                :inactive-value="1"
                active-text="启用"
                inactive-text="停用"
              />
              <span>{{
                form.status === 0 ? '该申请类型将使用此流程' : '该申请类型暂不启用流程映射'
              }}</span>
            </div>
          </el-form-item>
        </el-form>

        <aside class="workflow-current">
          <span class="workflow-current__icon"><Icon icon="ep:connection" /></span>
          <small>当前申请类型</small>
          <strong>{{ currentLabel }}</strong>
          <dl>
            <div
              ><dt>流程名称</dt><dd>{{ form.processDefinitionName || '尚未选择' }}</dd></div
            >
            <div
              ><dt>流程标识</dt
              ><dd
                ><span class="dm-code">{{ form.processDefinitionKey || '—' }}</span></dd
              ></div
            >
            <div
              ><dt>可选定义</dt><dd>{{ processDefinitionOptions.length }}</dd></div
            >
          </dl>
        </aside>
      </div>
    </section>
  </DataMarketManagementPage>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DefinitionApi from '@/api/bpm/definition'
import * as WorkflowApi from '@/api/dataMarket/workflow'
import type { ApplicationType, WorkflowConfigVO } from '@/api/dataMarket/types'
import { APPLICATION_TYPE_OPTIONS } from '../shared'
import { useMessage } from '@/hooks/web/useMessage'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'
defineOptions({ name: 'DataMarketWorkflowConfig' })
const message = useMessage()
const applicationType = ref<ApplicationType>('CREATE')
const formRef = ref<any>()
const definitionLoading = ref(false)
const configLoading = ref(false)
const configLoadError = ref(false)
const saving = ref(false)
const processDefinitions = ref<DefinitionApi.SimpleProcessDefinitionVO[]>([])
const form = reactive<WorkflowConfigVO>({
  processDefinitionKey: '',
  processDefinitionName: '',
  status: 0
})
const rules = {
  processDefinitionKey: [{ required: true, message: '请选择流程定义', trigger: 'change' }]
}
const currentLabel = computed(
  () => APPLICATION_TYPE_OPTIONS.find((item) => item.value === applicationType.value)?.label
)
const processDefinitionOptions = computed(() => {
  const definitionsByKey = new Map<string, DefinitionApi.SimpleProcessDefinitionVO>()
  processDefinitions.value.forEach((definition) => {
    if (!definitionsByKey.has(definition.key)) definitionsByKey.set(definition.key, definition)
  })
  return Array.from(definitionsByKey.values())
})
const selectedDefinition = computed(() =>
  processDefinitionOptions.value.find((definition) => definition.key === form.processDefinitionKey)
)
const missingSelectedDefinition = computed(
  () => Boolean(form.processDefinitionKey) && !selectedDefinition.value
)
const missingSelectedDefinitionLabel = computed(() => {
  const name = form.processDefinitionName?.trim()
  const configuredDefinition = {
    key: form.processDefinitionKey,
    name: name || form.processDefinitionKey
  }
  return `${formatDefinitionLabel(configuredDefinition)} · 已停用或不可见`
})

const formatDefinitionLabel = (
  definition: Pick<DefinitionApi.SimpleProcessDefinitionVO, 'key' | 'name'>
) =>
  definition.name === definition.key ? definition.key : `${definition.name}（${definition.key}）`

const loadProcessDefinitions = async () => {
  definitionLoading.value = true
  try {
    processDefinitions.value = await DefinitionApi.getSimpleProcessDefinitionList()
  } catch {
    processDefinitions.value = []
    message.error('流程定义加载失败，请稍后重试')
  } finally {
    definitionLoading.value = false
  }
}
const getConfig = async () => {
  configLoading.value = true
  configLoadError.value = false
  try {
    Object.assign(
      form,
      { processDefinitionKey: '', processDefinitionName: '', status: 0 },
      await WorkflowApi.getWorkflowConfig(applicationType.value)
    )
  } catch {
    configLoadError.value = true
  } finally {
    configLoading.value = false
  }
}
const refresh = () => Promise.all([loadProcessDefinitions(), getConfig()])
const handleDefinitionChange = (key: string) => {
  form.processDefinitionName = processDefinitionOptions.value.find(
    (definition) => definition.key === key
  )?.name
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  saving.value = true
  try {
    await WorkflowApi.updateWorkflowConfig(applicationType.value, form)
    message.success('流程配置已保存')
  } finally {
    saving.value = false
  }
}
onMounted(refresh)
</script>

<style scoped lang="scss">
.workflow-panel {
  padding: 22px !important;
}

.workflow-notice {
  margin-bottom: 6px;
}

.workflow-tabs :deep(.el-tabs__header) {
  padding: 0 22px;
  margin: 0 -22px 22px;
}

.workflow-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #edf0f4;
}

.workflow-tabs :deep(.el-tabs__item) {
  height: 54px;
  padding-inline: 24px;
  font-weight: 600;
}

.workflow-config-grid {
  display: grid;
  min-height: 310px;
  padding: 16px 6px 4px;
  grid-template-columns: minmax(360px, 1fr) 330px;
  gap: 56px;
}

.workflow-form {
  max-width: 620px;
}

.workflow-form__tip {
  margin: 7px 0 0;
  font-size: 12px;
  color: #8a96a8;
}

.workflow-status-control {
  display: flex;
  min-height: 58px;
  padding: 0 16px;
  background: #f8fafc;
  border: 1px solid #e7ebf1;
  border-radius: 8px;
  align-items: center;
  gap: 18px;

  > span {
    font-size: 13px;
    color: #718096;
  }
}

.workflow-current {
  padding: 26px;
  background: linear-gradient(145deg, #fffaf0, #fff 68%);
  border: 1px solid #f0dfbf;
  border-radius: 12px;

  > small,
  > strong {
    display: block;
  }

  > small {
    margin-top: 18px;
    color: #8f8068;
  }

  > strong {
    margin-top: 5px;
    font-size: 22px;
    color: #4d3d23;
  }

  dl {
    display: grid;
    margin: 24px 0 0;
    gap: 14px;
  }

  dl div {
    display: flex;
    padding-top: 12px;
    border-top: 1px solid #eee3d0;
    justify-content: space-between;
    gap: 16px;
  }

  dt {
    font-size: 12px;
    color: #8f8068;
  }

  dd {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #4d3d23;
    text-align: right;
  }
}

.workflow-current__icon {
  display: grid;
  width: 46px;
  height: 46px;
  font-size: 22px;
  color: #d97706;
  background: #ffefd1;
  border-radius: 12px;
  place-items: center;
}

@media (width <= 900px) {
  .workflow-config-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
