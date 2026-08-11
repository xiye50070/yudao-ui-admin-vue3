import { beforeEach, describe, expect, it, vi } from 'vitest'

const { request } = vi.hoisted(() => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/config/axios', () => ({ default: request }))

import * as CatalogApi from '@/api/dataMarket/catalog'
import * as SecurityApi from '@/api/dataMarket/security'
import * as MetadataApi from '@/api/dataMarket/metadata'
import * as WorkflowApi from '@/api/dataMarket/workflow'
import * as DeliveryApi from '@/api/dataMarket/delivery'

describe('data market API contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends a complete idempotent dataset publish request', () => {
    CatalogApi.publishDataset(
      42,
      { subjectDomainId: 4, tagIds: [7], sensitivityLevel: 2, publishComment: '完成字段核验' },
      'publish-42'
    )

    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/datasets/42/publish',
      headers: { 'Idempotency-Key': 'publish-42' },
      data: { subjectDomainId: 4, tagIds: [7], sensitivityLevel: 2, publishComment: '完成字段核验' }
    })
  })

  it('sends ACL rules as the complete update body', () => {
    const rules = [{ principalType: 'ROLE' as const, principalId: 8, includeChildDept: false }]
    SecurityApi.updateDatasetAcl(42, rules)

    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/datasets/42/acl',
      data: { rules }
    })
  })

  it('uses the required optimistic lock header when updating clearances', () => {
    SecurityApi.updateAccessClearances(
      [{ principalType: 'DEPT', principalId: 6, maxSensitivityLevel: 2, enabled: true }],
      0
    )

    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/access-clearances',
      headers: { 'If-Match-Version': '0' },
      data: {
        rules: [{ principalType: 'DEPT', principalId: 6, maxSensitivityLevel: 2, enabled: true }]
      }
    })
  })

  it('loads the versioned clearance policy aggregate', () => {
    SecurityApi.getAccessClearances()

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/management/access-clearances'
    })
  })

  it('loads standard tags as the backend list response', () => {
    CatalogApi.getTags()

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/management/tags'
    })
  })

  it('uses backend CRUD endpoints for configurable filter dimensions', () => {
    const dimension = { code: 'SOURCE_TYPE', name: '数据源类型', sort: 10, status: 0 }

    CatalogApi.getFilterDimensions()
    CatalogApi.createFilterDimension(dimension)
    CatalogApi.updateFilterDimension(21, dimension)
    CatalogApi.deleteFilterDimension(21)

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/management/filter-dimensions'
    })
    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/filter-dimensions',
      data: dimension
    })
    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/filter-dimensions/21',
      data: dimension
    })
    expect(request.delete).toHaveBeenCalledWith({
      url: '/data-market/management/filter-dimensions/21'
    })
  })

  it('uploads metadata imports with overwrite choice and an idempotency key', () => {
    const file = new File(['datasetCode'], 'datasets.xlsx')
    MetadataApi.importMetadata(file, true, 'metadata-import-20260731')

    const option = request.post.mock.calls[0][0]
    expect(option.url).toBe('/data-market/management/metadata-imports')
    expect(option.headersType).toBe('multipart/form-data')
    expect(option.headers).toEqual({ 'Idempotency-Key': 'metadata-import-20260731' })
    expect(option.data.get('updateExisting')).toBe('true')
    expect(option.data.get('file')).toBe(file)
  })

  it('maps application type and numeric status to its workflow configuration endpoint', () => {
    WorkflowApi.updateWorkflowConfig('RENEW', {
      processDefinitionKey: 'renew-data-market',
      processDefinitionName: '数据市场续期',
      status: 0
    })

    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/workflow-configs/RENEW',
      data: {
        processDefinitionKey: 'renew-data-market',
        processDefinitionName: '数据市场续期',
        status: 0
      }
    })
  })

  it('loads delivered API history through read-only management endpoints', () => {
    DeliveryApi.getDeliveredApiHistoryPage({
      pageNo: 2,
      pageSize: 20,
      keyword: 'DMA2026',
      acceptanceStatus: 'ACCEPTED'
    })
    DeliveryApi.getDeliveredApiHistoryDetail(42)

    expect(request.get).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/delivered-apis',
      params: {
        pageNo: 2,
        pageSize: 20,
        keyword: 'DMA2026',
        acceptanceStatus: 'ACCEPTED'
      }
    })
    expect(request.get).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/delivered-apis/42'
    })
  })

  it('preserves the business error code when probing an application delivery', () => {
    DeliveryApi.getApplicationDelivery(17)

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/management/applications/17/delivery',
      returnBusinessError: true
    })
  })
})
