import { describe, expect, it } from 'vitest'
import {
  APPLICATION_TYPE_OPTIONS,
  dataMarketPageNames,
  validateDatasetForm
} from '@/views/dataMarket/shared'

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

  it('publishes menu component names for every data market page', () => {
    expect(dataMarketPageNames).toEqual({
      catalog: 'DataMarketCatalog',
      domain: 'DataMarketDomain',
      tag: 'DataMarketTag',
      sourceSystem: 'DataMarketSourceSystem',
      dataset: 'DataMarketDataset',
      accessPolicy: 'DataMarketAccessPolicy',
      metadataImport: 'DataMarketMetadataImport',
      workflowConfig: 'DataMarketWorkflowConfig'
    })
  })
})
