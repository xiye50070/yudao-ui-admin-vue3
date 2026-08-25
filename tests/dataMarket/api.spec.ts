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
import * as PreprocessingApi from '@/api/dataMarket/preprocessing'

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

  it('uses one reusable standard resource for CRUD and dedicated field binding', () => {
    const data = {
      standardCode: 'EMPLOYEE_STATUS',
      standardName: '员工状态',
      standardType: 'ENUM' as const,
      description: '在离职状态',
      content: { items: [{ value: '1', description: '在职' }] }
    }

    CatalogApi.getDataStandardPage({ pageNo: 1, pageSize: 20, keyword: '员工' })
    CatalogApi.getDataStandard(31)
    CatalogApi.createDataStandard(data)
    CatalogApi.updateDataStandard(31, 4, data)
    CatalogApi.bindDatasetFieldStandard(11, 21, 31)
    CatalogApi.unbindDatasetFieldStandard(11, 21)

    expect(request.get).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/data-standards',
      params: { pageNo: 1, pageSize: 20, keyword: '员工' }
    })
    expect(request.get).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/data-standards/31'
    })
    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/data-standards',
      data
    })
    expect(request.put).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/data-standards/31',
      headers: { 'If-Match-Version': '4' },
      returnBusinessError: true,
      validateStatus: expect.any(Function),
      data
    })
    expect(request.put).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/datasets/11/fields/21/standard',
      data: { standardId: 31 }
    })
    expect(request.delete).toHaveBeenCalledWith({
      url: '/data-market/management/datasets/11/fields/21/standard'
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

  it('uses the independent preprocessing rule management endpoints', () => {
    const rule = {
      code: 'TRIM',
      name: '去除首尾空格',
      category: 'STANDARDIZE',
      description: '去除文本两侧空白',
      parameterSchema: '{}',
      sort: 10,
      status: 0
    }

    PreprocessingApi.getPreprocessingRulePage({ pageNo: 1, pageSize: 10, keyword: 'TRIM' })
    PreprocessingApi.getEnabledPreprocessingRules()
    PreprocessingApi.createPreprocessingRule(rule)
    PreprocessingApi.updatePreprocessingRule(101, rule)
    PreprocessingApi.deletePreprocessingRule(101)

    expect(request.get).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/preprocessing-rule-templates',
      params: { pageNo: 1, pageSize: 10, keyword: 'TRIM' }
    })
    expect(request.get).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/preprocessing-rule-templates/simple-list'
    })
    expect(request.post).toHaveBeenCalledWith({
      url: '/data-market/management/preprocessing-rule-templates',
      data: rule
    })
    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/preprocessing-rule-templates/101',
      data: rule
    })
    expect(request.delete).toHaveBeenCalledWith({
      url: '/data-market/management/preprocessing-rule-templates/101'
    })
  })

  it('uses aggregate logical-type endpoints and the actual-type preview contract', () => {
    const logicalType = {
      code: 'TEXT',
      name: '文本',
      description: '文本类字段',
      sort: 10,
      status: 0,
      matchers: [
        {
          matchMode: 'REGEX' as const,
          matchExpression: '^VARCHAR2\\(\\d+\\)$',
          priority: 100,
          sort: 10,
          status: 0,
          description: 'Oracle 可变长文本'
        }
      ],
      ruleTemplateIds: [101, 102]
    }

    PreprocessingApi.getLogicalFieldTypePage({ pageNo: 1, pageSize: 10, keyword: 'TEXT' })
    PreprocessingApi.getLogicalFieldType(201)
    PreprocessingApi.getEnabledLogicalFieldTypes()
    PreprocessingApi.createLogicalFieldType(logicalType)
    PreprocessingApi.updateLogicalFieldType(201, logicalType)
    PreprocessingApi.deleteLogicalFieldType(201)
    PreprocessingApi.previewFieldType('VARCHAR2(100)')

    expect(request.get).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/logical-field-types',
      params: { pageNo: 1, pageSize: 10, keyword: 'TEXT' }
    })
    expect(request.get).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/logical-field-types/201'
    })
    expect(request.get).toHaveBeenNthCalledWith(3, {
      url: '/data-market/management/logical-field-types/simple-list'
    })
    expect(request.post).toHaveBeenNthCalledWith(1, {
      url: '/data-market/management/logical-field-types',
      data: logicalType
    })
    expect(request.put).toHaveBeenCalledWith({
      url: '/data-market/management/logical-field-types/201',
      data: logicalType
    })
    expect(request.delete).toHaveBeenCalledWith({
      url: '/data-market/management/logical-field-types/201'
    })
    expect(request.post).toHaveBeenNthCalledWith(2, {
      url: '/data-market/management/logical-field-types/match-preview',
      data: { actualType: 'VARCHAR2(100)' }
    })
  })
})
