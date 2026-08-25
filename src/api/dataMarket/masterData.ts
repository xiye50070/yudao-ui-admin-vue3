import request from '@/config/axios'
import type { PageParam, PageResult } from './types'

const base = '/data-market/management/master-objects'

export type MasterObjectStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED'
export type MasterComponentLevel = 'M1' | 'M2'
export type MasterComponentCategory = 'CORE' | 'RELATION' | 'HISTORY'
export type MasterCardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY'

export interface MasterObjectSaveReq {
  objectCode: string
  objectName: string
  subjectDomainId?: number
  description?: string
}

export interface MasterComponentSaveReq {
  componentKey: string
  datasetId: number
  levelCode: MasterComponentLevel
  componentCategory: MasterComponentCategory
  displayName: string
  businessGrain?: string
  displayOrder: number
}

export interface MasterFieldMappingSaveReq {
  parentFieldId: number
  childFieldId: number
  displayOrder: number
}

export interface MasterRelationSaveReq {
  parentComponentKey: string
  childComponentKey: string
  relationName: string
  cardinality: MasterCardinality
  displayOrder: number
  fieldMappings: MasterFieldMappingSaveReq[]
}

export interface MasterAssemblySaveReq {
  components: MasterComponentSaveReq[]
  relations: MasterRelationSaveReq[]
}

export interface MasterObjectSummary {
  id: number
  objectCode: string
  objectName: string
  subjectDomainId: number
  description?: string
  status: MasterObjectStatus
  activeVersionId: number
  versionNo: number
  versionStatus: 'DRAFT' | 'PUBLISHED' | 'RETIRED'
  hasDraft: boolean
  componentCount: number
  relationCount: number
  publishedAt?: string
  updateTime?: string
}

export interface MasterComponentDetail extends MasterComponentSaveReq {
  id: number
  datasetCode?: string
  datasetName?: string
  physicalName?: string
  sourceSystemId?: number
  subjectDomainId?: number
  datasetMetadataVersion?: string
  fieldCount: number
  standardBoundFieldCount: number
}

export interface MasterFieldMappingDetail extends MasterFieldMappingSaveReq {
  id: number
  parentFieldCode?: string
  parentFieldName?: string
  parentDataType?: string
  childFieldCode?: string
  childFieldName?: string
  childDataType?: string
}

export interface MasterRelationDetail extends MasterRelationSaveReq {
  id: number
  parentComponentId: number
  childComponentId: number
  fieldMappings: MasterFieldMappingDetail[]
}

export interface MasterObjectVersion {
  id: number
  versionNo: number
  versionStatus: 'DRAFT' | 'PUBLISHED' | 'RETIRED'
  objectName: string
  subjectDomainId: number
  publishedAt?: string
  publishedBy?: number
}

export interface MasterObjectDetail extends MasterObjectSaveReq {
  id: number
  status: MasterObjectStatus
  activeVersionId: number
  draftVersionId?: number
  publishedVersionId?: number
  versionNo: number
  versionStatus: 'DRAFT' | 'PUBLISHED' | 'RETIRED'
  hasDraft: boolean
  lockVersion: number
  components: MasterComponentDetail[]
  relations: MasterRelationDetail[]
  versions: MasterObjectVersion[]
}

export interface MasterValidationIssue {
  code: string
  message: string
}

export interface MasterValidationResult {
  valid?: boolean
  errors: MasterValidationIssue[]
  warnings: MasterValidationIssue[]
  errorCodes: string[]
  warningCodes: string[]
}

export const getMasterObjectPage = (
  params: PageParam & { keyword?: string; subjectDomainId?: number; status?: MasterObjectStatus }
) => request.get<PageResult<MasterObjectSummary>>({ url: base, params })

export const getMasterObject = (id: number) =>
  request.get<MasterObjectDetail>({ url: `${base}/${id}` })

export const createMasterObject = (data: MasterObjectSaveReq) =>
  request.post<number>({ url: base, data })

export const updateMasterObject = (id: number, data: MasterObjectSaveReq) =>
  request.put({ url: `${base}/${id}`, data })

export const createMasterObjectDraft = (id: number) => request.post({ url: `${base}/${id}/draft` })

export const saveMasterAssembly = (id: number, data: MasterAssemblySaveReq) =>
  request.put({ url: `${base}/${id}/assembly`, data })

export const validateMasterObject = (id: number) =>
  request.get<MasterValidationResult>({ url: `${base}/${id}/validation` })

export const publishMasterObject = (id: number) => request.post({ url: `${base}/${id}/publish` })

export const disableMasterObject = (id: number) => request.post({ url: `${base}/${id}/disable` })
