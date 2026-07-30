import { describe, expect, it } from 'vitest'
import { buildApiVersionCreateRequest } from '@/views/dataMarket/deliveryWorkbench/versionDraft'

describe('delivery API-version submission', () => {
  it('preserves editable request settings and every selected lineage entry in the submitted request', () => {
    expect(
      buildApiVersionCreateRequest({
        versionNo: 'v2',
        method: 'POST',
        publicBaseUrl: 'https://api.example.com',
        requestPath: '/orders/search',
        authType: 'BEARER',
        contentType: 'application/xml',
        openapiDocument: { openapi: '3.0.3' },
        rateLimitPolicy: { requestsPerMinute: 60 },
        networkPolicy: { allowCidrs: ['10.0.0.0/8'] },
        requestDescription: '查询订单',
        responseDescription: '订单列表',
        successDescription: '200',
        failureDescription: '401',
        lineage: [
          { sourceType: 'DATASET', sourceId: 7, role: 'PRIMARY' },
          { sourceType: 'PROCESSING_ITEM', sourceId: 12, role: 'DERIVED' }
        ]
      })
    ).toMatchObject({
      method: 'POST',
      authType: 'BEARER',
      contentType: 'application/xml',
      lineage: [
        { sourceType: 'DATASET', sourceId: 7, role: 'PRIMARY' },
        { sourceType: 'PROCESSING_ITEM', sourceId: 12, role: 'DERIVED' }
      ]
    })
  })
})
