import type { ApplicationType } from '@/api/dataMarket/types'

export const validateLifecycleExecution = (input: {
  applicationType: ApplicationType
  targetApiVersionId?: number
}) =>
  input.applicationType === 'CHANGE' && !input.targetApiVersionId
    ? { targetApiVersionId: '变更申请必须关联目标版本' }
    : {}
