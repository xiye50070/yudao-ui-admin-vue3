import { describe, expect, it, vi } from 'vitest'
import {
  buildProvisioningRuntime,
  provisionConfiguredApi
} from '@/views/dataMarket/deliveryWorkbench/provisioning'

describe('delivery API provisioning', () => {
  it('forces the hidden-debug provisioning path to a non-debug production binding', () => {
    expect(
      buildProvisioningRuntime(false, 'TEST', {
        upstreamTargetRef: 'orders-test',
        timeoutMs: 5000,
        tlsVerify: true,
        debugEnabled: true,
        status: 'ENABLED'
      })
    ).toEqual({
      environment: 'PRODUCTION',
      binding: {
        upstreamTargetRef: '',
        timeoutMs: 5000,
        tlsVerify: true,
        debugEnabled: false,
        status: 'ENABLED'
      }
    })
  })

  it('creates the complete API only from the final in-memory wizard submission', async () => {
    const operations: string[] = []
    const client = {
      createDeliveredApi: vi.fn(async () => {
        operations.push('api')
        return 61
      }),
      createApiVersion: vi.fn(async () => {
        operations.push('version')
        return 72
      }),
      updateRuntimeBinding: vi.fn(async () => {
        operations.push('binding')
      }),
      createCredential: vi.fn(async () => {
        operations.push('credential')
        return 81
      })
    }

    const result = await provisionConfiguredApi(
      {
        deliveryId: 51,
        api: { name: '订单查询', description: '查询订单' },
        version: {
          versionNo: 'v1',
          method: 'GET',
          publicBaseUrl: 'https://api.example.com',
          requestPath: '/orders',
          authType: 'APP_KEY_SECRET',
          contentType: 'application/json',
          openapiDocument: {},
          rateLimitPolicy: {},
          networkPolicy: {},
          requestDescription: '请求',
          responseDescription: '响应',
          successDescription: '成功',
          failureDescription: '失败',
          lineage: []
        },
        environment: 'TEST',
        binding: {
          upstreamTargetRef: 'secret://orders-test',
          timeoutMs: 5000,
          tlsVerify: true,
          debugEnabled: false,
          status: 'ENABLED'
        },
        credential: {
          name: '订单调用方',
          authType: 'APP_KEY_SECRET',
          appKey: 'orders-app',
          appSecret: 'one-time-secret'
        },
        idempotencyKeys: {
          api: 'api-123456789012',
          version: 'version-12345678',
          credential: 'credential-123456'
        }
      },
      client
    )

    expect(operations).toEqual(['api', 'version', 'binding', 'credential'])
    expect(client.createDeliveredApi).toHaveBeenCalledWith(
      51,
      { name: '订单查询', description: '查询订单' },
      'api-123456789012'
    )
    expect(client.createApiVersion).toHaveBeenCalledWith(61, expect.any(Object), 'version-12345678')
    expect(client.updateRuntimeBinding).toHaveBeenCalledWith(
      72,
      'TEST',
      expect.objectContaining({ upstreamTargetRef: 'secret://orders-test' })
    )
    expect(client.createCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryId: 51,
        apiId: 61,
        appSecret: 'one-time-secret',
        authorizations: [{ apiVersionId: 72, status: 'ACTIVE' }]
      }),
      'credential-123456'
    )
    expect(result).toEqual({ apiId: 61, apiVersionId: 72, credentialId: 81 })
  })
})
