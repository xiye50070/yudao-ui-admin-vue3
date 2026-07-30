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

describe('data market API contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the dataset publish payload to the management endpoint', () => {
    CatalogApi.publishDataset(42, { version: 3, publishNote: '完成字段核验' })

    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/datasets/42/publish',
      data: { version: 3, publishNote: '完成字段核验' }
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

  it('uploads metadata imports as multipart form data', () => {
    const file = new File(['datasetCode'], 'datasets.xlsx')
    MetadataApi.importMetadata(file, 9)

    const option = request.post.mock.calls[0][0]
    expect(option.url).toBe('/data-market/management/metadata-imports')
    expect(option.headersType).toBe('multipart/form-data')
    expect(option.data.get('sourceSystemId')).toBe('9')
    expect(option.data.get('file')).toBe(file)
  })

  it('maps application type to its workflow configuration endpoint', () => {
    WorkflowApi.updateWorkflowConfig('RENEW', { processDefinitionKey: 'renew-data-market' })

    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/workflow-configs/RENEW',
      data: { processDefinitionKey: 'renew-data-market' }
    })
  })
})
