import type {
  ApplicationStatus,
  ApplicationType,
  LifecycleRequestDetail
} from '@/api/dataMarket/types'

export const validateLifecycleExecution = (input: {
  applicationType: ApplicationType
  targetApiVersionId?: number
}) =>
  input.applicationType === 'CHANGE' && !input.targetApiVersionId
    ? { targetApiVersionId: '变更申请必须关联目标版本' }
    : {}

export const getLifecycleExecutionBlockReason = (input: {
  applicationStatus: ApplicationStatus
  executionStatus?: LifecycleRequestDetail['executionStatus']
}): string | undefined => {
  const approvedAndWaiting =
    (input.applicationStatus === 'EFFECTUATING' && input.executionStatus === 'PENDING') ||
    (input.applicationStatus === 'IMPACT_REVIEW' && input.executionStatus === 'PENDING') ||
    (input.applicationStatus === 'IMPACT_REVIEW' && input.executionStatus === 'IMPACT_REVIEW')
  if (approvedAndWaiting) return undefined
  if (['SCHEDULED', 'EXECUTING', 'SUCCEEDED'].includes(input.executionStatus || ''))
    return '生命周期申请已执行或正在执行，不能重复执行'
  return '申请尚未审批通过，不能执行'
}
