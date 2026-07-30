import request from '@/config/axios'
import type { MetadataImportResult } from './types'

const management = '/data-market/management'

export const downloadMetadataTemplate = () =>
  request.download<Blob>({ url: `${management}/metadata-import/template` })
export const importMetadata = (file: File, sourceSystemId?: number) => {
  const data = new FormData()
  data.append('file', file)
  if (sourceSystemId) data.append('sourceSystemId', String(sourceSystemId))
  return request.post<MetadataImportResult>({
    url: `${management}/metadata-imports`,
    headersType: 'multipart/form-data',
    data
  })
}
export const getMetadataImport = (batchNo: string) =>
  request.get<MetadataImportResult>({ url: `${management}/metadata-imports/${batchNo}` })
