import request from '@/config/axios'
import type {
  ApiCreateReq,
  ApiVersionCreateReq,
  ApplicationDetailVO,
  ApplicationSummaryVO,
  CredentialAuthorization,
  CredentialCreateReq,
  DeliveryCreateReq,
  LifecycleExecuteReq,
  PageParam,
  PageResult,
  RuntimeBindingReq,
  TimelineItem
} from './types'

const management = '/data-market/management'
export const getApplicationPage = (
  params: PageParam & { status?: string; applicantUserId?: number }
) => request.get<PageResult<ApplicationSummaryVO>>({ url: `${management}/applications`, params })
export const getApplication = (applicationId: number) =>
  request.get<ApplicationDetailVO>({ url: `${management}/applications/${applicationId}` })
export const getApplicationTimeline = (applicationId: number) =>
  request.get<TimelineItem[]>({ url: `/data-market/applications/${applicationId}/timeline` })
export const createDelivery = (applicationId: number, data: DeliveryCreateReq) =>
  request.post<number>({ url: `${management}/applications/${applicationId}/delivery`, data })
export const createDeliveredApi = (deliveryId: number, data: ApiCreateReq) =>
  request.post<number>({ url: `${management}/deliveries/${deliveryId}/apis`, data })
export const createApiVersion = (apiId: number, data: ApiVersionCreateReq) =>
  request.post<number>({ url: `${management}/apis/${apiId}/versions`, data })
export const updateRuntimeBinding = (
  apiVersionId: number,
  environment: 'DEVELOPMENT' | 'TEST' | 'PRODUCTION',
  data: RuntimeBindingReq
) =>
  request.put({
    url: `${management}/api-versions/${apiVersionId}/runtime-bindings/${environment}`,
    data
  })
export const completeDeliveryTask = (
  deliveryId: number,
  stage: 'DELIVERY_PLAN' | 'API_CONFIG' | 'CREDENTIAL_CONFIG' | 'DOCUMENTATION',
  data: { description: string; attachmentFileIds?: number[]; completedAt?: string }
) => request.post({ url: `${management}/deliveries/${deliveryId}/tasks/${stage}/complete`, data })
export const createCredential = (data: CredentialCreateReq) =>
  request.post<number>({ url: `${management}/credentials`, data })
export const updateCredentialAuthorizations = (
  credentialId: number,
  authorizations: CredentialAuthorization[],
  version?: number
) =>
  request.put({
    url: `${management}/credentials/${credentialId}/authorizations`,
    data: { authorizations },
    headers: version ? { 'If-Match': String(version) } : undefined
  })
export const submitDeliveryAcceptance = (deliveryId: number, summary?: string) =>
  request.post<number>({
    url: `${management}/deliveries/${deliveryId}/submit-acceptance`,
    data: { summary }
  })
export const resolveAcceptanceIssue = (issueId: number, resolution: string) =>
  request.post({ url: `${management}/acceptance-issues/${issueId}/resolve`, data: { resolution } })
export const executeLifecycleApplication = (applicationId: number, data: LifecycleExecuteReq) =>
  request.post({ url: `${management}/lifecycle-applications/${applicationId}/execute`, data })
