<template>
  <ContentWrap
    ><el-alert
      title="仅对已审批的变更、续期、停用申请执行。执行参数会提交服务端审计；请在确认影响后操作。"
      type="warning"
      :closable="false"
  /></ContentWrap>
  <ContentWrap
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="140px" class="max-w-720px"
      ><el-form-item label="生命周期申请 ID" prop="applicationId"
        ><el-input-number v-model="form.applicationId" :min="1" /></el-form-item
      ><el-form-item label="近期调用摘要" prop="recentCallSummary"
        ><el-input v-model="form.recentCallSummary" type="textarea" /></el-form-item
      ><el-form-item label="已确认影响" prop="confirmedImpactSummary"
        ><el-input v-model="form.confirmedImpactSummary" type="textarea" /></el-form-item
      ><el-form-item label="实际生效时间" prop="actualEffectiveAt"
        ><el-date-picker
          v-model="form.actualEffectiveAt"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ssZ" /></el-form-item
      ><el-form-item label="执行动作" prop="actionDetail"
        ><el-input v-model="form.actionDetail" type="textarea" /></el-form-item
      ><el-form-item label="目标版本 ID"
        ><el-input-number v-model="form.targetApiVersionId" :min="1" /><span
          class="ml-8px text-gray-500"
          >变更申请必填；续期/停用留空</span
        ></el-form-item
      ><el-form-item
        ><el-button
          v-hasPermi="['data-market:lifecycle:execute']"
          type="danger"
          :loading="submitting"
          @click="execute"
          >确认执行</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketLifecycle' })
const message = useMessage()
const formRef = ref<any>()
const submitting = ref(false)
const form = reactive({
  applicationId: undefined as number | undefined,
  recentCallSummary: '',
  confirmedImpactSummary: '',
  actualEffectiveAt: '',
  actionDetail: '',
  targetApiVersionId: undefined as number | undefined
})
const rules = {
  applicationId: [{ required: true, message: '请输入申请 ID', trigger: 'change' }],
  recentCallSummary: [{ required: true, message: '请输入近期调用摘要', trigger: 'blur' }],
  confirmedImpactSummary: [{ required: true, message: '请输入已确认影响', trigger: 'blur' }],
  actualEffectiveAt: [{ required: true, message: '请选择实际生效时间', trigger: 'change' }],
  actionDetail: [{ required: true, message: '请输入执行动作', trigger: 'blur' }]
}
const execute = async () => {
  if (!(await formRef.value.validate()) || !form.applicationId) return
  await message.confirm('该操作将执行已审批的生命周期申请，是否继续？')
  submitting.value = true
  try {
    await DeliveryApi.executeLifecycleApplication(form.applicationId, {
      recentCallSummary: form.recentCallSummary,
      confirmedImpactSummary: form.confirmedImpactSummary,
      actualEffectiveAt: form.actualEffectiveAt,
      actionDetail: form.actionDetail,
      targetApiVersionId: form.targetApiVersionId
    })
    message.success('生命周期执行请求已提交')
  } finally {
    submitting.value = false
  }
}
</script>
