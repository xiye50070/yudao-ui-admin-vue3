<template>
  <ContentWrap
    ><el-alert
      title="验收问题由验收轮次产生。本工作台只处理服务端已存在的问题，不在前端虚构问题、验收状态或处理结果。"
      type="info"
      :closable="false"
  /></ContentWrap>
  <ContentWrap
    ><el-empty v-if="!issueId" description="请输入验收问题 ID 后处理"
      ><el-input-number v-model="issueId" :min="1" placeholder="验收问题 ID" /><el-button
        class="ml-8px"
        type="primary"
        @click="ready = true"
        >进入处理</el-button
      ></el-empty
    ><el-form
      v-else-if="ready"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="max-w-680px"
      ><el-form-item label="问题 ID"
        ><el-input-number v-model="issueId" :min="1" disabled /></el-form-item
      ><el-form-item label="处理说明" prop="resolution"
        ><el-input
          v-model="form.resolution"
          type="textarea"
          :rows="5"
          placeholder="填写修复、回归验证和影响说明" /></el-form-item
      ><el-form-item
        ><el-button
          v-hasPermi="['data-market:acceptance-issue:resolve']"
          type="primary"
          :loading="submitting"
          @click="resolve"
          >提交处理结果</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketAcceptanceIssue' })
const message = useMessage()
const issueId = ref<number>()
const ready = ref(false)
const submitting = ref(false)
const formRef = ref<any>()
const form = reactive({ resolution: '' })
const rules = { resolution: [{ required: true, message: '请输入处理说明', trigger: 'blur' }] }
const resolve = async () => {
  if (!(await formRef.value.validate()) || !issueId.value) return
  await message.confirm('确认提交该验收问题的处理结果吗？')
  submitting.value = true
  try {
    await DeliveryApi.resolveAcceptanceIssue(issueId.value, form.resolution)
    message.success('处理结果已提交')
  } finally {
    submitting.value = false
  }
}
</script>
