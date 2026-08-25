import request from '@/config/axios'
import type {
  DatasetFieldVO,
  DatasetVO,
  DataStandardDetail,
  DataStandardSaveReq,
  DataStandardSummary,
  DataStandardType,
  FilterDimensionVO,
  PageParam,
  PageResult,
  SourceSystemVO,
  SubjectDomainVO,
  TagVO
} from './types'

const management = '/data-market/management'

export const getSubjectDomainList = () =>
  request.get<SubjectDomainVO[]>({ url: `${management}/subject-domains` })
export const createSubjectDomain = (data: SubjectDomainVO) =>
  request.post({ url: `${management}/subject-domains`, data })
export const updateSubjectDomain = (id: number, data: SubjectDomainVO) =>
  request.put({ url: `${management}/subject-domains/${id}`, data })
export const deleteSubjectDomain = (id: number) =>
  request.delete({ url: `${management}/subject-domains/${id}` })

export const getFilterDimensions = () =>
  request.get<FilterDimensionVO[]>({ url: `${management}/filter-dimensions` })
export const createFilterDimension = (data: FilterDimensionVO) =>
  request.post({ url: `${management}/filter-dimensions`, data })
export const updateFilterDimension = (id: number, data: FilterDimensionVO) =>
  request.put({ url: `${management}/filter-dimensions/${id}`, data })
export const deleteFilterDimension = (id: number) =>
  request.delete({ url: `${management}/filter-dimensions/${id}` })

export const getTags = () => request.get<TagVO[]>({ url: `${management}/tags` })
export const createTag = (data: TagVO) => request.post({ url: `${management}/tags`, data })
export const updateTag = (id: number, data: TagVO) =>
  request.put({ url: `${management}/tags/${id}`, data })
export const deleteTag = (id: number) => request.delete({ url: `${management}/tags/${id}` })

export const getSourceSystemPage = (params: PageParam & { keyword?: string }) =>
  request.get<PageResult<SourceSystemVO>>({ url: `${management}/source-systems`, params })
export const createSourceSystem = (data: SourceSystemVO) =>
  request.post({ url: `${management}/source-systems`, data })
export const updateSourceSystem = (id: number, data: SourceSystemVO) =>
  request.put({ url: `${management}/source-systems/${id}`, data })
export const deleteSourceSystem = (id: number) =>
  request.delete({ url: `${management}/source-systems/${id}` })

export const getDatasetPage = (
  params: PageParam & {
    keyword?: string
    sourceSystemId?: number
    subjectDomainId?: number
    publishStatus?: number
  }
) => request.get<PageResult<DatasetVO>>({ url: `${management}/datasets`, params })
export const getDataset = (id: number) =>
  request.get<DatasetVO>({ url: `${management}/datasets/${id}` })
export const createDataset = (data: DatasetVO) =>
  request.post({ url: `${management}/datasets`, data })
export const updateDataset = (id: number, data: DatasetVO) =>
  request.put({ url: `${management}/datasets/${id}`, data })
export const deleteDataset = (id: number) => request.delete({ url: `${management}/datasets/${id}` })
export const getDatasetFields = (id: number) =>
  request.get<DatasetFieldVO[]>({ url: `${management}/datasets/${id}/fields` })
export type DatasetFieldSaveReq = Omit<
  DatasetFieldVO,
  | 'datasetId'
  | 'standard'
  | 'logicalTypeCode'
  | 'logicalTypeName'
  | 'logicalTypeStatus'
  | 'logicalTypeMatchStatus'
  | 'logicalTypeCandidates'
>
export const updateDatasetFields = (id: number, fields: DatasetFieldSaveReq[]) =>
  request.put({ url: `${management}/datasets/${id}/fields`, data: { fields } })

export const getDataStandardPage = (
  params: PageParam & { keyword?: string; standardType?: DataStandardType }
) => request.get<PageResult<DataStandardSummary>>({ url: `${management}/data-standards`, params })
export const getDataStandard = (id: number) =>
  request.get<DataStandardDetail>({ url: `${management}/data-standards/${id}` })
export const createDataStandard = (data: DataStandardSaveReq) =>
  request.post<number>({ url: `${management}/data-standards`, data })
export const updateDataStandard = (id: number, lockVersion: number, data: DataStandardSaveReq) =>
  request.put<DataStandardDetail>({
    url: `${management}/data-standards/${id}`,
    headers: { 'If-Match-Version': String(lockVersion) },
    returnBusinessError: true,
    validateStatus: (status: number) => status >= 200 && status < 500,
    data
  })
export const bindDatasetFieldStandard = (datasetId: number, fieldId: number, standardId: number) =>
  request.put({
    url: `${management}/datasets/${datasetId}/fields/${fieldId}/standard`,
    data: { standardId }
  })
export const unbindDatasetFieldStandard = (datasetId: number, fieldId: number) =>
  request.delete({ url: `${management}/datasets/${datasetId}/fields/${fieldId}/standard` })
export interface DatasetPublishReq {
  subjectDomainId: number
  tagIds: number[]
  sensitivityLevel: number
  businessName?: string
  description?: string
  publishComment?: string
}

export const publishDataset = (
  id: number,
  data: DatasetPublishReq,
  idempotencyKey = crypto.randomUUID()
) =>
  request.post({
    url: `${management}/datasets/${id}/publish`,
    headers: { 'Idempotency-Key': idempotencyKey },
    data
  })
