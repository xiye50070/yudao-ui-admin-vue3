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
  parentId: number
  description?: string
  sort: number
  status: number
  visibleDatasetCount?: number
}

export interface TagVO {
  id?: number
  code: string
  name: string
  description?: string
  color?: string
  sort: number
  status: number
}

export interface SourceSystemVO {
  id?: number
  code: string
  name: string
  ownerUserId?: number
  ownerDeptId?: number
  description?: string
  status: number
}

export interface DatasetFieldVO {
  id?: number
  datasetId?: number
  externalId?: string
  fieldCode: string
  fieldName: string
  dataType: string
  length?: number
  precisionValue?: number
  scaleValue?: number
  businessDescription?: string
  nullable: boolean
  primaryKey: boolean
  joinKey: boolean
  sensitivityLevel: number
  status: number
  metadataVersion?: string
  displayOrder?: number
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
  tagIds?: number[]
  fieldCount?: number
  publishStatus?: number
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

export interface AccessClearancePolicy {
  version: number
  rules: AccessClearanceRule[]
}

export type ApplicationType = 'CREATE' | 'CHANGE' | 'RENEW' | 'DEACTIVATE'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTING'
  | 'SUBMIT_FAILED'
  | 'IN_APPROVAL'
  | 'RETURNED_SUPPLEMENT'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONFIGURING'
  | 'PENDING_ACCEPTANCE'
  | 'RECTIFYING'
  | 'DELIVERED'
  | 'EFFECTUATING'
  | 'IMPACT_REVIEW'
  | 'SCHEDULED'
  | 'COMPLETED'

export interface WorkflowConfigVO {
  applicationType?: ApplicationType
  processDefinitionKey: string
  processDefinitionName?: string
  status: number
  lockVersion?: number
}

export interface MetadataImportResult {
  batchNo: string
  status: 'VALIDATING' | 'FAILED' | 'SUCCEEDED'
  datasetCount: number
  fieldCount: number
  errorCount: number
  errors: Array<{
    rowNumber: number
    fieldName?: string
    errorCode?: string
    errorMessage: string
  }>
}

export interface ApplicationSummaryVO {
  id: number
  applicationNo: string
  applicationType: ApplicationType
  name: string
  status: ApplicationStatus
  currentVersionNo: number
  datasetCount?: number
  deliveredApiCount?: number
  updateTime: string
}

export interface ApplicationDetailVO extends ApplicationSummaryVO {
  lockVersion: number
  baseInfo: ApplicationBaseInfo
  datasets: Array<{
    applicationDatasetId: number
    datasetId: number
    datasetSnapshot: { businessName?: string; datasetCode?: string }
    fields: Array<{
      fieldId: number
      fieldCode: string
      fieldName: string
      dataType?: string
      sensitivityLevel: number
      returnSelected: boolean
      querySelected: boolean
      queryCapabilities?: string[]
    }>
  }>
  cleaningRules: Array<{
    datasetId: number
    fieldId: number
    ruleTemplateId: number
    executeOrder: number
    customDescription?: string
  }>
  processingItems: Array<{
    itemNo: number
    datasetIds: number[]
    fieldIds?: number[]
    businessGoal: string
    expectedResult: string
    advancedSettings?: ProcessingAdvancedSettings
  }>
  lifecycleRequest?: LifecycleRequestDetail
}

export interface ApplicationBaseInfo {
  name: string
  reason: string
  businessScenario: string
  callerSystem: string
  callerOwner?: string
  environment: 'DEVELOPMENT' | 'TEST' | 'PRODUCTION' | 'MULTIPLE'
  useStartDate: string
  useEndDate: string | null
  longTerm: boolean
  frequencyType: 'PER_SECOND' | 'PER_MINUTE' | 'PER_HOUR' | 'PER_DAY' | 'IRREGULAR'
  dailyVolume: number
  peakVolume: number
}

export interface ProcessingAdvancedSettings {
  joins?: Array<{
    leftDatasetId: number
    leftFieldId: number
    rightDatasetId: number
    rightFieldId: number
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  }>
  formulas?: Array<{ name: string; expression: string; description?: string }>
  groupByFieldIds?: number[]
  aggregations?: Array<{
    fieldId?: number | null
    function: 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'CUSTOM'
    alias: string
    customExpression?: string | null
  }>
}

export interface TimelineItem {
  eventType: string
  title: string
  description?: string
  operatorName?: string
  occurredAt: string
}
export interface AcceptanceIssueVO {
  id: number
  acceptanceRoundId: number
  apiId: number
  apiName?: string
  issueType: string
  description: string
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED'
  assigneeUserId?: number
  resolution?: string
  createdAt: string
  resolvedAt?: string
}
export interface AcceptanceRoundVO {
  id: number
  roundNo: number
  status: 'PENDING' | 'ISSUE_REPORTED' | 'RECTIFYING' | 'RESUBMITTED' | 'ACCEPTED'
  submittedAt: string
  acceptedAt?: string
  issues: AcceptanceIssueVO[]
}
export interface DeliveryCreateReq {
  planDescription: string
  ownerUserId: number
  taskAssignees?: Record<string, number>
}
export interface DeliveryTaskVO {
  id: number
  stage: string
  status: string
  assigneeUserId: number
  description: string | null
  startedAt: number | null
  completedAt: number | null
  displayOrder: number
}
export interface DeliveryRuntimeBindingVO {
  id: number
  environment: string
  upstreamTargetRef: string
  timeoutMs: number | null
  tlsVerify: boolean
  debugEnabled: boolean
  status: string
  lockVersion: number
}
export interface DeliveryLineageVO {
  id: number
  sourceType: string
  sourceId: number
  role: string
  description: string | null
}
export interface DeliveryApiVersionVO {
  id: number
  versionNo: string
  status: string
  method: string
  publicBaseUrl: string
  requestPath: string
  authType: string
  contentType: string
  openapiDocument: Record<string, unknown>
  rateLimitPolicy: Record<string, unknown>
  networkPolicy: Record<string, unknown>
  requestDescription: string | null
  responseDescription: string | null
  successDescription: string | null
  failureDescription: string | null
  publishedAt: number | null
  runtimeBindings: DeliveryRuntimeBindingVO[]
  lineage: DeliveryLineageVO[]
}
export interface DeliveryCredentialAuthorizationVO {
  id: number
  apiId: number
  apiVersionId: number
  effectiveAt: number | null
  expiresAt: number | null
  status: string
}
export interface DeliveryCredentialVO {
  id: number
  deliveryId: number
  apiId: number
  credentialNo: string
  name: string
  authType: string
  appKey: string | null
  secretMasked: string
  status: string
  effectiveAt: number | null
  expiresAt: number | null
  configuredBy: number | null
  lockVersion: number
  authorizations: DeliveryCredentialAuthorizationVO[]
}
export interface DeliveredApiVO {
  id: number
  apiNo: string
  name: string
  description: string | null
  status: string
  deliveryId: number
  currentVersionId: number | null
  ownerUserId: number
  effectiveAt: number | null
  expiresAt: number | null
  lockVersion: number
  relationType: string | null
  deliveryVersionId: number | null
  versions: DeliveryApiVersionVO[]
  credentials: DeliveryCredentialVO[]
}
export interface DeliveryWorkbenchVO {
  id: number
  applicationId: number
  deliveryNo: string
  status: string
  planDescription: string | null
  ownerUserId: number
  lockVersion: number
  tasks: DeliveryTaskVO[]
  apis: DeliveredApiVO[]
}
export interface ApiCreateReq {
  name: string
  ownerUserId: number
  description?: string
  effectiveAt?: number
  expiresAt?: number
}
export interface ApiVersionCreateReq {
  versionNo: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  publicBaseUrl: string
  requestPath: string
  authType: 'APP_KEY_SECRET' | 'API_KEY' | 'BEARER'
  contentType: string
  openapiDocument: Record<string, unknown>
  rateLimitPolicy: Record<string, unknown>
  networkPolicy: Record<string, unknown>
  requestDescription: string
  responseDescription: string
  successDescription: string
  failureDescription: string
  lineage: Array<{
    sourceType: 'DATASET' | 'PROCESSING_ITEM'
    sourceId: number
    role: 'PRIMARY' | 'INPUT' | 'LOOKUP' | 'DERIVED'
  }>
}
export interface RuntimeBindingReq {
  upstreamTargetRef: string
  timeoutMs: number
  tlsVerify: boolean
  debugEnabled: boolean
  status: 'ENABLED' | 'DISABLED'
}
export interface CredentialAuthorization {
  apiVersionId: number
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED'
  effectiveAt?: number
  expiresAt?: number
}
export interface CredentialCreateReq {
  deliveryId: number
  apiId: number
  name: string
  authType: 'APP_KEY_SECRET' | 'API_KEY' | 'BEARER'
  appKey: string
  appSecret: string
  authorizations: CredentialAuthorization[]
  effectiveAt?: number
  expiresAt?: number
}
export interface LifecycleExecuteReq {
  recentCallSummary: string
  confirmedImpactSummary: string
  actualEffectiveAt: number
  actionDetail: string
  targetApiVersionId?: number
  affectedCredentialIds?: number[]
  executionResult?: string
}
export interface LifecycleRequestDetail {
  originalApiId: number
  originalApiVersionId: number
  targetApiVersionId?: number
  desiredEffectiveAt?: string
  requestedUseEndDate?: string
  recentCallSummary?: string
  impactSummary?: string
  affectedCredentialIds?: number[]
  confirmedEffectiveAt?: string
  executionStatus: 'PENDING' | 'IMPACT_REVIEW' | 'SCHEDULED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED'
  executedBy?: number
  executedAt?: string
  executionResult?: string
}
