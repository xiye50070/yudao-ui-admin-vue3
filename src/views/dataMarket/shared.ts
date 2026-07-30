import type { ApplicationType, DatasetVO } from '@/api/dataMarket/types'

export const APPLICATION_TYPE_OPTIONS: Array<{ label: string; value: ApplicationType }> = [
  { label: '新建申请', value: 'NEW' },
  { label: '变更申请', value: 'CHANGE' },
  { label: '续期申请', value: 'RENEW' },
  { label: '停用申请', value: 'DEACTIVATE' }
]

export const dataMarketPageNames = {
  catalog: 'DataMarketCatalog',
  domain: 'DataMarketDomain',
  tag: 'DataMarketTag',
  sourceSystem: 'DataMarketSourceSystem',
  dataset: 'DataMarketDataset',
  accessPolicy: 'DataMarketAccessPolicy',
  metadataImport: 'DataMarketMetadataImport',
  workflowConfig: 'DataMarketWorkflowConfig'
} as const

export const validateDatasetForm = (form: Pick<DatasetVO, 'businessName' | 'sourceSystemId'>) => {
  const errors: Record<string, string> = {}
  if (!form.businessName?.trim()) errors.businessName = '请输入数据集名称'
  if (!form.sourceSystemId) errors.sourceSystemId = '请选择来源系统'
  return errors
}
