import request from '@/config/axios'
import { toEpochMillis } from './datetime'
import type {
  ApiCreateReq,
  ApiVersionCreateReq,
  AcceptanceRoundVO,
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
const commandHeaders = (idempotencyKey?: string): { 'Idempotency-Key': string } => ({
  'Idempotency-Key': idempotencyKey ?? crypto.randomUUID()
})
export const getApplicationPage = (
  params: PageParam & {
    status?: string
    applicationType?: string
    applicantUserId?: number
    name?: string
  }
) => request.get<PageResult<ApplicationSummaryVO>>({ url: `${management}/applications`, params })
export const getApplication = (applicationId: number) =>
  request.get<ApplicationDetailVO>({ url: `${management}/applications/${applicationId}` })
export const getApplicationTimeline = (applicationId: number) =>
  request.get<TimelineItem[]>({
    url: `${management}/applications/${applicationId}/timeline`
  })
export const getDeliveryAcceptanceRounds = (deliveryId: number) =>
  request.get<AcceptanceRoundVO[]>({
    url: `${management}/deliveries/${deliveryId}/acceptance-rounds`
  })
export const createDelivery = (
  applicationId: number,
  data: DeliveryCreateReq,
  idempotencyKey?: string
) =>
  request.post<number>({
    url: `${management}/applications/${applicationId}/delivery`,
    data,
    headers: commandHeaders(idempotencyKey)
  })
export const createDeliveredApi = (
  deliveryId: number,
  data: ApiCreateReq,
  idempotencyKey?: string
) =>
  request.post<number>({
    url: `${management}/deliveries/${deliveryId}/apis`,
    data: {
      ...data,
      effectiveAt: toEpochMillis(data.effectiveAt),
      expiresAt: toEpochMillis(data.expiresAt)
    },
    headers: commandHeaders(idempotencyKey)
  })
export const createApiVersion = (
  apiId: number,
  data: ApiVersionCreateReq,
  idempotencyKey?: string
) =>
  request.post<number>({
    url: `${management}/apis/${apiId}/versions`,
    data,
    headers: commandHeaders(idempotencyKey)
  })
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
  data: { description: string; attachmentFileIds?: number[]; completedAt?: number },
  idempotencyKey?: string
) =>
  request.post({
    url: `${management}/deliveries/${deliveryId}/tasks/${stage}/complete`,
    data: { ...data, completedAt: toEpochMillis(data.completedAt) },
    headers: commandHeaders(idempotencyKey)
  })
export const createCredential = (data: CredentialCreateReq, idempotencyKey?: string) =>
  request.post<number>({
    url: `${management}/credentials`,
    data: {
      ...data,
      effectiveAt: toEpochMillis(data.effectiveAt),
      expiresAt: toEpochMillis(data.expiresAt),
      authorizations: data.authorizations.map((authorization) => ({
        ...authorization,
        effectiveAt: toEpochMillis(authorization.effectiveAt),
        expiresAt: toEpochMillis(authorization.expiresAt)
      }))
    },
    headers: commandHeaders(idempotencyKey)
  })
export const updateCredentialAuthorizations = (
  credential: { id: number; lockVersion: number },
  authorizations: CredentialAuthorization[]
) =>
  request.put({
    url: `${management}/credentials/${credential.id}/authorizations`,
    data: { authorizations },
    headers: { 'If-Match-Version': String(credential.lockVersion) }
  })
export const submitDeliveryAcceptance = (
  deliveryId: number,
  summary?: string,
  idempotencyKey?: string
) =>
  request.post<number>({
    url: `${management}/deliveries/${deliveryId}/submit-acceptance`,
    data: { summary },
    headers: commandHeaders(idempotencyKey)
  })
export const resolveAcceptanceIssue = (
  issueId: number,
  resolution: string,
  idempotencyKey?: string
) =>
  request.post({
    url: `${management}/acceptance-issues/${issueId}/resolve`,
    data: { resolution },
    headers: commandHeaders(idempotencyKey)
  })
export const executeLifecycleApplication = (
  applicationId: number,
  data: LifecycleExecuteReq,
  idempotencyKey?: string
) =>
  request.post({
    url: `${management}/lifecycle-applications/${applicationId}/execute`,
    data: { ...data, actualEffectiveAt: toEpochMillis(data.actualEffectiveAt) },
    headers: commandHeaders(idempotencyKey)
  })
