import { describe, expect, it } from 'vitest'
import { APPLICATION_TYPE_OPTIONS, validateDatasetForm } from '@/views/dataMarket/shared'
import CatalogPage from '@/views/dataMarket/catalog/index.vue'
import DomainPage from '@/views/dataMarket/domain/index.vue'
import TagPage from '@/views/dataMarket/tag/index.vue'
import SourceSystemPage from '@/views/dataMarket/sourceSystem/index.vue'
import DatasetPage from '@/views/dataMarket/dataset/index.vue'
import AccessPolicyPage from '@/views/dataMarket/accessPolicy/index.vue'
import MetadataImportPage from '@/views/dataMarket/metadataImport/index.vue'
import WorkflowConfigPage from '@/views/dataMarket/workflowConfig/index.vue'

describe('data market workbench behavior', () => {
  it('maps all lifecycle application types to selectable workflow options', () => {
    expect(APPLICATION_TYPE_OPTIONS).toEqual([
      { label: '新建申请', value: 'NEW' },
      { label: '变更申请', value: 'CHANGE' },
      { label: '续期申请', value: 'RENEW' },
      { label: '停用申请', value: 'DEACTIVATE' }
    ])
  })

  it('rejects a dataset form without business name and source system', () => {
    expect(validateDatasetForm({ businessName: '', sourceSystemId: undefined })).toEqual({
      businessName: '请输入数据集名称',
      sourceSystemId: '请选择来源系统'
    })
  })

  it('exposes the required component names on the dynamic menu targets', () => {
    expect([
      CatalogPage.name,
      DomainPage.name,
      TagPage.name,
      SourceSystemPage.name,
      DatasetPage.name,
      AccessPolicyPage.name,
      MetadataImportPage.name,
      WorkflowConfigPage.name
    ]).toEqual([
      'DataMarketCatalog',
      'DataMarketDomain',
      'DataMarketTag',
      'DataMarketSourceSystem',
      'DataMarketDataset',
      'DataMarketAccessPolicy',
      'DataMarketMetadataImport',
      'DataMarketWorkflowConfig'
    ])
  })
})
