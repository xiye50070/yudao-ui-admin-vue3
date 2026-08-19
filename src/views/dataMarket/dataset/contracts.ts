import type { DatasetFieldSaveReq } from '@/api/dataMarket/catalog'
import type { DatasetFieldVO } from '@/api/dataMarket/types'

export const createEmptyDatasetField = (datasetId: number, displayOrder = 1): DatasetFieldVO => ({
  datasetId,
  fieldCode: '',
  fieldName: '',
  dataType: 'varchar',
  businessDescription: '',
  nullable: true,
  primaryKey: false,
  joinKey: false,
  sensitivityLevel: 1,
  status: 0,
  metadataVersion: '',
  displayOrder
})

export const toDatasetFieldSaveReq = ({
  datasetId: _datasetId,
  standard: _standard,
  ...field
}: DatasetFieldVO): DatasetFieldSaveReq => field
