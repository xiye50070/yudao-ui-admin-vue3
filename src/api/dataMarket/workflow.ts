import request from '@/config/axios'
import type { ApplicationType, WorkflowConfigVO } from './types'

const management = '/data-market/management'

export const getWorkflowConfig = (applicationType: ApplicationType) =>
  request.get<WorkflowConfigVO>({ url: `${management}/workflow-configs/${applicationType}` })
export const updateWorkflowConfig = (applicationType: ApplicationType, data: WorkflowConfigVO) =>
  request.put({ url: `${management}/workflow-configs/${applicationType}`, data })
