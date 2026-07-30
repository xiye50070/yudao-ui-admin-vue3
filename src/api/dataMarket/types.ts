export interface PageParam {
  pageNo: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface SubjectDomainVO {
  id?: number
  code: string
  name: string
  parentId?: number
  description?: string
  visibleDatasetCount?: number
}

export interface TagVO {
  id?: number
  code: string
  name: string
  color?: string
}

export interface SourceSystemVO {
  id?: number
  code: string
  name: string
  ownerName?: string
  description?: string
  status?: number
}

export interface DatasetFieldVO {
  id?: number
  name: string
  displayName?: string
  dataType: string
  description?: string
  sensitivityLevel: number
  required?: boolean
}

export interface DatasetVO {
  id?: number
  datasetCode?: string
  businessName: string
  physicalName?: string
  sourceSystemId?: number
  sourceSystemName?: string
  subjectDomainId?: number
  subjectDomainName?: string
  description?: string
  sensitivityLevel?: number
  fieldCount?: number
  status?: string
  fields?: DatasetFieldVO[]
}

export type PrincipalType = 'DEPT' | 'ROLE'

export interface DatasetAclRule {
  principalType: PrincipalType
  principalId: number
  includeChildDept?: boolean
}

export interface AccessClearanceRule extends DatasetAclRule {
  maxSensitivityLevel: number
  enabled: boolean
}

export type ApplicationType = 'NEW' | 'CHANGE' | 'RENEW' | 'DEACTIVATE'

export interface WorkflowConfigVO {
  applicationType?: ApplicationType
  processDefinitionKey: string
  processDefinitionName?: string
  enabled?: boolean
}

export interface MetadataImportResult {
  batchNo: string
  status?: string
  totalCount?: number
  successCount?: number
  failedCount?: number
  errors?: Array<{ rowNo: number; field?: string; message: string }>
}
