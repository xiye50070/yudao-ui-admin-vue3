import { beforeEach, describe, expect, it, vi } from 'vitest'

const { request } = vi.hoisted(() => ({
  request: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}))
vi.mock('@/config/axios', () => ({ default: request }))

import * as DeliveryApi from '@/api/dataMarket/delivery'

describe('data-market management delivery contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a delivery plan under its application', () => {
    DeliveryApi.createDelivery(11, { planDescription: '交付方案', ownerUserId: 7 })
    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/applications/11/delivery',
      data: { planDescription: '交付方案', ownerUserId: 7 }
    })
  })

  it('creates an immutable API version with public contract only', () => {
    DeliveryApi.createApiVersion(21, {
      versionNo: 'v1',
      method: 'GET',
      publicBaseUrl: 'https://api.example.com',
      requestPath: '/orders',
      authType: 'APP_KEY_SECRET',
      contentType: 'application/json',
      openapiDocument: {},
      rateLimitPolicy: {},
      networkPolicy: {},
      requestDescription: '查询',
      responseDescription: '结果',
      successDescription: '成功',
      failureDescription: '失败',
      lineage: [{ sourceType: 'DATASET', sourceId: 2, role: 'PRIMARY' }]
    })
    expect(request.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/data-market/management/apis/21/versions' })
    )
  })

  it('uses the path environment for runtime binding', () => {
    DeliveryApi.updateRuntimeBinding(31, 'PRODUCTION', {
      upstreamTargetRef: 'secret://prod/orders',
      timeoutMs: 5000,
      tlsVerify: true,
      debugEnabled: false,
      status: 'ENABLED'
    })
    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/api-versions/31/runtime-bindings/PRODUCTION',
      data: {
        upstreamTargetRef: 'secret://prod/orders',
        timeoutMs: 5000,
        tlsVerify: true,
        debugEnabled: false,
        status: 'ENABLED'
      }
    })
  })

  it('never returns a configured app secret from the credential request helper', () => {
    const requestBody = {
      deliveryId: 2,
      apiId: 3,
      name: '调用方',
      authType: 'APP_KEY_SECRET' as const,
      appKey: 'key',
      appSecret: 'secret',
      authorizations: [{ apiVersionId: 31, status: 'ACTIVE' as const }]
    }
    DeliveryApi.createCredential(requestBody)
    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/credentials',
      data: requestBody
    })
  })

  it('resolves an acceptance issue and executes an approved lifecycle request', () => {
    DeliveryApi.resolveAcceptanceIssue(91, '已修复并完成回归')
    DeliveryApi.executeLifecycleApplication(11, {
      recentCallSummary: '近30日正常',
      confirmedImpactSummary: '已通知',
      actualEffectiveAt: '2026-08-01T00:00:00+08:00',
      actionDetail: '按计划执行'
    })
    expect(request.post).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/acceptance-issues/91/resolve',
      data: { resolution: '已修复并完成回归' }
    })
    expect(request.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ url: '/data-market/management/lifecycle-applications/11/execute' })
    )
  })
})
