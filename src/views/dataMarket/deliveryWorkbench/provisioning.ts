import * as DeliveryApi from '@/api/dataMarket/delivery'
import type {
  ApiCreateReq,
  ApiVersionCreateReq,
  CredentialCreateReq,
  RuntimeBindingReq
} from '@/api/dataMarket/types'
import { DEFAULT_DELIVERY_ENVIRONMENT } from './restore'

export interface DeliveryProvisioningClient {
  createDeliveredApi: typeof DeliveryApi.createDeliveredApi
  createApiVersion: typeof DeliveryApi.createApiVersion
  updateRuntimeBinding: typeof DeliveryApi.updateRuntimeBinding
  createCredential: typeof DeliveryApi.createCredential
}

export interface DeliveryProvisioningDraft {
  deliveryId: number
  api: ApiCreateReq
  version: ApiVersionCreateReq
  environment: 'DEVELOPMENT' | 'TEST' | 'PRODUCTION'
  binding: RuntimeBindingReq
  credential: Omit<CredentialCreateReq, 'deliveryId' | 'apiId' | 'authorizations'>
  idempotencyKeys: {
    api: string
    version: string
    credential: string
  }
}

export const buildProvisioningRuntime = (
  onlineDebugEnabled: boolean,
  selectedEnvironment: DeliveryProvisioningDraft['environment'],
  binding: RuntimeBindingReq
) => ({
  environment: onlineDebugEnabled ? selectedEnvironment : DEFAULT_DELIVERY_ENVIRONMENT,
  binding: {
    ...binding,
    upstreamTargetRef: onlineDebugEnabled ? binding.upstreamTargetRef.trim() : '',
    debugEnabled: onlineDebugEnabled && binding.debugEnabled
  }
})

export const provisionConfiguredApi = async (
  draft: DeliveryProvisioningDraft,
  client: DeliveryProvisioningClient = DeliveryApi
) => {
  const apiId = await client.createDeliveredApi(
    draft.deliveryId,
    draft.api,
    draft.idempotencyKeys.api
  )
  const apiVersionId = await client.createApiVersion(
    apiId,
    draft.version,
    draft.idempotencyKeys.version
  )
  await client.updateRuntimeBinding(apiVersionId, draft.environment, draft.binding)
  const credentialId = await client.createCredential(
    {
      ...draft.credential,
      deliveryId: draft.deliveryId,
      apiId,
      authorizations: [{ apiVersionId, status: 'ACTIVE' }]
    },
    draft.idempotencyKeys.credential
  )
  return { apiId, apiVersionId, credentialId }
}
