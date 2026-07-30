import request from '@/config/axios'
import type { MetadataImportResult } from './types'

const management = '/data-market/management'

export const downloadMetadataTemplate = () =>
  request.download<Blob>({ url: `${management}/metadata-import/template` })
export const importMetadata = (
  file: File,
  updateExisting = false,
  idempotencyKey = crypto.randomUUID()
) => {
  const data = new FormData()
  data.append('file', file)
  data.append('updateExisting', String(updateExisting))
  return request.post<MetadataImportResult>({
    url: `${management}/metadata-imports`,
    headersType: 'multipart/form-data',
    headers: { 'Idempotency-Key': idempotencyKey },
    data
  })
}
export const getMetadataImport = (batchNo: string) =>
  request.get<MetadataImportResult>({ url: `${management}/metadata-imports/${batchNo}` })
