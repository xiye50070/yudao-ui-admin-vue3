import request from '@/config/axios'
import type {
  DatasetFieldVO,
  DatasetVO,
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
  params: PageParam & { keyword?: string; sourceSystemId?: number; subjectDomainId?: number }
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
export type DatasetFieldSaveReq = Omit<DatasetFieldVO, 'datasetId'>
export const updateDatasetFields = (id: number, fields: DatasetFieldSaveReq[]) =>
  request.put({ url: `${management}/datasets/${id}/fields`, data: { fields } })
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
