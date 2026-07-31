import type {
  ApiVersionCreateReq,
  CredentialCreateReq,
  DeliveryWorkbenchVO,
  RuntimeBindingReq
} from '@/api/dataMarket/types'

const methods: ApiVersionCreateReq['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const authTypes: ApiVersionCreateReq['authType'][] = ['APP_KEY_SECRET', 'API_KEY', 'BEARER']
const environments = ['DEVELOPMENT', 'TEST', 'PRODUCTION'] as const
const stages = ['DELIVERY_PLAN', 'API_CONFIG', 'CREDENTIAL_CONFIG', 'DOCUMENTATION'] as const
const lineageSourceTypes: ApiVersionCreateReq['lineage'][number]['sourceType'][] = [
  'DATASET',
  'PROCESSING_ITEM'
]
const lineageRoles: ApiVersionCreateReq['lineage'][number]['role'][] = [
  'PRIMARY',
  'INPUT',
  'LOOKUP',
  'DERIVED'
]

export const selectDeliveryWorkbenchState = (workbench: DeliveryWorkbenchVO) => {
  const api = workbench.apis[0]
  const version =
    api?.versions.find((item) => item.id === api.currentVersionId) ?? api?.versions.at(-1)
  const runtimeBinding = version?.runtimeBindings[0]
  const credential = api?.credentials[0]
  const authorization = credential?.authorizations[0]
  const task = workbench.tasks.find((item) => item.status !== 'COMPLETED') ?? workbench.tasks[0]
  const method = methods.includes(version?.method as ApiVersionCreateReq['method'])
    ? (version?.method as ApiVersionCreateReq['method'])
    : 'GET'
  const authType = authTypes.includes(version?.authType as ApiVersionCreateReq['authType'])
    ? (version?.authType as ApiVersionCreateReq['authType'])
    : 'APP_KEY_SECRET'
  const environment = environments.includes(
    runtimeBinding?.environment as (typeof environments)[number]
  )
    ? (runtimeBinding?.environment as (typeof environments)[number])
    : 'TEST'
  const stage = stages.includes(task?.stage as (typeof stages)[number])
    ? (task?.stage as (typeof stages)[number])
    : 'DELIVERY_PLAN'
  const credentialAuthType = authTypes.includes(
    credential?.authType as CredentialCreateReq['authType']
  )
    ? (credential?.authType as CredentialCreateReq['authType'])
    : 'APP_KEY_SECRET'

  return {
    applicationId: workbench.applicationId,
    deliveryId: workbench.id,
    apiId: api?.id,
    apiVersionId: version?.id,
    authorizationVersionId: authorization?.apiVersionId,
    environment,
    stage,
    taskDescription: task?.description ?? '',
    version: {
      versionNo: version?.versionNo ?? 'v1',
      method,
      publicBaseUrl: version?.publicBaseUrl ?? '',
      requestPath: version?.requestPath ?? '/',
      authType,
      contentType: version?.contentType ?? 'application/json',
      requestDescription: version?.requestDescription ?? '',
      responseDescription: version?.responseDescription ?? '',
      successDescription: version?.successDescription ?? '',
      failureDescription: version?.failureDescription ?? ''
    },
    versionDocument: version?.openapiDocument ?? {},
    rateLimitPolicy: version?.rateLimitPolicy ?? {},
    networkPolicy: version?.networkPolicy ?? {},
    lineage: (version?.lineage ?? [])
      .filter(
        (item) =>
          lineageSourceTypes.includes(
            item.sourceType as ApiVersionCreateReq['lineage'][number]['sourceType']
          ) && lineageRoles.includes(item.role as ApiVersionCreateReq['lineage'][number]['role'])
      )
      .map((item) => ({
        sourceType: item.sourceType as ApiVersionCreateReq['lineage'][number]['sourceType'],
        sourceId: item.sourceId,
        role: item.role as ApiVersionCreateReq['lineage'][number]['role']
      })),
    binding: {
      upstreamTargetRef: runtimeBinding?.upstreamTargetRef ?? '',
      timeoutMs: runtimeBinding?.timeoutMs ?? 10000,
      tlsVerify: runtimeBinding?.tlsVerify ?? true,
      debugEnabled: runtimeBinding?.debugEnabled ?? false,
      status: runtimeBinding?.status === 'DISABLED' ? 'DISABLED' : 'ENABLED'
    } satisfies RuntimeBindingReq,
    credential: {
      deliveryId: workbench.id,
      apiId: api?.id,
      name: credential?.name ?? '',
      authType: credentialAuthType,
      appKey: credential?.appKey ?? ''
    }
  }
}
