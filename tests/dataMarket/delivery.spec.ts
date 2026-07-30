import { beforeEach, describe, expect, it, vi } from 'vitest'

const { request } = vi.hoisted(() => ({
  request: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}))
vi.mock('@/config/axios', () => ({ default: request }))

import * as DeliveryApi from '@/api/dataMarket/delivery'

describe('data-market management delivery contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads application timelines through the management namespace', () => {
    DeliveryApi.getApplicationTimeline(11)

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/management/applications/11/timeline'
    })
  })

  it('creates a delivery plan under its application', () => {
    DeliveryApi.createDelivery(11, { planDescription: '交付方案', ownerUserId: 7 })
    expect(request.post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/data-market/management/applications/11/delivery',
        headers: { 'Idempotency-Key': expect.stringMatching(/^.{16,100}$/) },
        data: { planDescription: '交付方案', ownerUserId: 7 }
      })
    )
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
      expect.objectContaining({
        url: '/data-market/management/apis/21/versions',
        headers: { 'Idempotency-Key': expect.stringMatching(/^.{16,100}$/) }
      })
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
    expect(request.post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/data-market/management/credentials',
        headers: { 'Idempotency-Key': expect.stringMatching(/^.{16,100}$/) },
        data: requestBody
      })
    )
  })

  it('resolves an acceptance issue and executes an approved lifecycle request', () => {
    DeliveryApi.resolveAcceptanceIssue(91, '已修复并完成回归')
    DeliveryApi.executeLifecycleApplication(11, {
      recentCallSummary: '近30日正常',
      confirmedImpactSummary: '已通知',
      actualEffectiveAt: '2026-08-01T00:00:00+08:00',
      actionDetail: '按计划执行'
    })
    expect(request.post).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: '/data-market/management/acceptance-issues/91/resolve',
        headers: { 'Idempotency-Key': expect.stringMatching(/^.{16,100}$/) },
        data: { resolution: '已修复并完成回归' }
      })
    )
    expect(request.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: '/data-market/management/lifecycle-applications/11/execute',
        headers: { 'Idempotency-Key': expect.stringMatching(/^.{16,100}$/) }
      })
    )
  })

  it('serializes every delivery datetime input as epoch milliseconds on the wire', () => {
    DeliveryApi.createDeliveredApi(1, {
      name: 'orders',
      ownerUserId: 2,
      effectiveAt: '2026-08-01T00:00:00+08:00',
      expiresAt: '2026-12-31T23:59:00+08:00'
    } as never)
    DeliveryApi.createCredential({
      deliveryId: 1,
      apiId: 2,
      name: 'orders-client',
      authType: 'APP_KEY_SECRET',
      appKey: 'key',
      appSecret: 'secret',
      effectiveAt: '2026-08-01T00:00:00+08:00',
      expiresAt: '2026-12-31T23:59:00+08:00',
      authorizations: [
        {
          apiVersionId: 3,
          status: 'ACTIVE',
          effectiveAt: '2026-08-01T00:00:00+08:00',
          expiresAt: '2026-12-31T23:59:00+08:00'
        }
      ]
    } as never)
    DeliveryApi.completeDeliveryTask(1, 'API_CONFIG', {
      description: 'ready',
      completedAt: '2026-09-01T08:30:00+08:00'
    } as never)
    DeliveryApi.executeLifecycleApplication(1, {
      recentCallSummary: '正常',
      confirmedImpactSummary: '已确认',
      actualEffectiveAt: '2026-09-01T08:30:00+08:00',
      actionDetail: '执行'
    } as never)

    expect(request.post).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          effectiveAt: 1785513600000,
          expiresAt: 1798732740000
        })
      })
    )
    expect(request.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          effectiveAt: 1785513600000,
          expiresAt: 1798732740000,
          authorizations: [
            expect.objectContaining({
              effectiveAt: 1785513600000,
              expiresAt: 1798732740000
            })
          ]
        })
      })
    )
    expect(request.post).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: { description: 'ready', completedAt: 1788222600000 }
      })
    )
    expect(request.post).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        data: expect.objectContaining({ actualEffectiveAt: 1788222600000 })
      })
    )
  })

  it('puts credential authorizations with required version zero', () => {
    DeliveryApi.updateCredentialAuthorizations({ id: 9, lockVersion: 0 }, [
      { apiVersionId: 31, status: 'ACTIVE' }
    ])

    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/credentials/9/authorizations',
      headers: { 'If-Match-Version': '0' },
      data: { authorizations: [{ apiVersionId: 31, status: 'ACTIVE' }] }
    })
  })

  it('uses an idempotency key for every OpenAPI-mandated delivery write', () => {
    DeliveryApi.createDeliveredApi(1, { name: 'a', ownerUserId: 2 })
    DeliveryApi.completeDeliveryTask(1, 'API_CONFIG', { description: 'ready' })
    DeliveryApi.createCredential({
      deliveryId: 1,
      apiId: 2,
      name: 'app',
      authType: 'APP_KEY_SECRET',
      appKey: 'key',
      appSecret: 'secret',
      authorizations: [{ apiVersionId: 3, status: 'ACTIVE' }]
    })
    DeliveryApi.submitDeliveryAcceptance(1, 'all ready')

    for (const call of request.post.mock.calls)
      expect(call[0].headers?.['Idempotency-Key']).toMatch(/^.{16,100}$/)
  })
})
