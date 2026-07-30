import { describe, expect, it } from 'vitest'
import type { DeliveryWorkbenchVO } from '@/api/dataMarket/types'
import { selectDeliveryWorkbenchState } from '@/views/dataMarket/deliveryWorkbench/restore'

describe('delivery workbench restore', () => {
  it('restores editable selections from the complete management aggregate without using a secret', () => {
    const aggregate: DeliveryWorkbenchVO = {
      id: 51,
      applicationId: 11,
      deliveryNo: 'DL-2026-0051',
      status: 'CONFIGURING',
      planDescription: '订单 API 交付',
      ownerUserId: 7,
      lockVersion: 2,
      tasks: [
        {
          id: 52,
          stage: 'API_CONFIG',
          status: 'PROCESSING',
          assigneeUserId: 7,
          description: '继续配置 API',
          startedAt: 1785513600000,
          completedAt: null,
          displayOrder: 2
        }
      ],
      apis: [
        {
          id: 61,
          apiNo: 'API-0061',
          name: '订单查询',
          description: '查询订单',
          status: 'ACTIVE',
          deliveryId: 51,
          currentVersionId: 72,
          ownerUserId: 7,
          effectiveAt: 1785513600000,
          expiresAt: null,
          lockVersion: 1,
          relationType: 'DELIVERED',
          deliveryVersionId: 72,
          versions: [
            {
              id: 71,
              versionNo: 'v1',
              status: 'RETIRED',
              method: 'GET',
              publicBaseUrl: 'https://old.example.com',
              requestPath: '/orders',
              authType: 'API_KEY',
              contentType: 'application/json',
              openapiDocument: { openapi: '3.0.3' },
              rateLimitPolicy: { requestsPerMinute: 10 },
              networkPolicy: { allowCidrs: [] },
              requestDescription: '旧请求',
              responseDescription: '旧响应',
              successDescription: '旧成功',
              failureDescription: '旧失败',
              publishedAt: 1785513600000,
              runtimeBindings: [],
              lineage: []
            },
            {
              id: 72,
              versionNo: 'v2',
              status: 'PUBLISHED',
              method: 'POST',
              publicBaseUrl: 'https://api.example.com',
              requestPath: '/orders/search',
              authType: 'BEARER',
              contentType: 'application/xml',
              openapiDocument: { openapi: '3.1.0' },
              rateLimitPolicy: { requestsPerMinute: 60 },
              networkPolicy: { allowCidrs: ['10.0.0.0/8'] },
              requestDescription: '查询请求',
              responseDescription: '查询响应',
              successDescription: '200',
              failureDescription: '401',
              publishedAt: 1788222600000,
              runtimeBindings: [
                {
                  id: 81,
                  environment: 'PRODUCTION',
                  upstreamTargetRef: 'secret://orders-prod',
                  timeoutMs: 5000,
                  tlsVerify: true,
                  debugEnabled: false,
                  status: 'ENABLED',
                  lockVersion: 3
                }
              ],
              lineage: [
                {
                  id: 91,
                  sourceType: 'DATASET',
                  sourceId: 9,
                  role: 'PRIMARY',
                  description: '订单数据集'
                },
                {
                  id: 92,
                  sourceType: 'PROCESSING_ITEM',
                  sourceId: 12,
                  role: 'DERIVED',
                  description: null
                }
              ]
            }
          ],
          credentials: [
            {
              id: 101,
              deliveryId: 51,
              apiId: 61,
              credentialNo: 'CR-0101',
              name: '财务调用方',
              authType: 'BEARER',
              appKey: 'finance-app',
              secretMasked: '******',
              status: 'ACTIVE',
              effectiveAt: 1785513600000,
              expiresAt: null,
              configuredBy: 7,
              lockVersion: 4,
              authorizations: [
                {
                  id: 111,
                  apiId: 61,
                  apiVersionId: 72,
                  effectiveAt: 1785513600000,
                  expiresAt: null,
                  status: 'ACTIVE'
                }
              ]
            }
          ]
        }
      ]
    }

    expect(selectDeliveryWorkbenchState(aggregate)).toEqual({
      applicationId: 11,
      deliveryId: 51,
      apiId: 61,
      apiVersionId: 72,
      authorizationVersionId: 72,
      environment: 'PRODUCTION',
      stage: 'API_CONFIG',
      taskDescription: '继续配置 API',
      version: {
        versionNo: 'v2',
        method: 'POST',
        publicBaseUrl: 'https://api.example.com',
        requestPath: '/orders/search',
        authType: 'BEARER',
        contentType: 'application/xml',
        requestDescription: '查询请求',
        responseDescription: '查询响应',
        successDescription: '200',
        failureDescription: '401'
      },
      versionDocument: { openapi: '3.1.0' },
      rateLimitPolicy: { requestsPerMinute: 60 },
      networkPolicy: { allowCidrs: ['10.0.0.0/8'] },
      lineage: [
        { sourceType: 'DATASET', sourceId: 9, role: 'PRIMARY' },
        { sourceType: 'PROCESSING_ITEM', sourceId: 12, role: 'DERIVED' }
      ],
      binding: {
        upstreamTargetRef: 'secret://orders-prod',
        timeoutMs: 5000,
        tlsVerify: true,
        debugEnabled: false,
        status: 'ENABLED'
      },
      credential: {
        deliveryId: 51,
        apiId: 61,
        name: '财务调用方',
        authType: 'BEARER',
        appKey: 'finance-app'
      }
    })
  })
})
