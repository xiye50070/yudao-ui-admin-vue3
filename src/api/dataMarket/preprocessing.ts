import request from '@/config/axios'
import type { PageParam, PageResult } from './types'

export interface PreprocessingRuleVO {
  id?: number
  code: string
  name: string
  category: string
  description: string
  parameterSchema?: string
  sort: number
  status: number
}

export type FieldTypeMatchMode = 'EXACT' | 'REGEX'
export type FieldTypeMatchStatus = 'MATCHED' | 'UNMATCHED' | 'CONFLICT'

export interface FieldTypeMatcherVO {
  id?: number
  matchMode: FieldTypeMatchMode
  matchExpression: string
  priority: number
  sort: number
  status: number
  description?: string
}

export interface LogicalFieldTypeSimpleVO {
  id: number
  code: string
  name: string
  sort: number
  status: number
}

export interface LogicalFieldTypeVO {
  id?: number
  code: string
  name: string
  description?: string
  sort: number
  status: number
  matchers: FieldTypeMatcherVO[]
  ruleTemplateIds: number[]
  ruleTemplates?: PreprocessingRuleVO[]
}

export type LogicalFieldTypePageReq = PageParam & {
  keyword?: string
  status?: number
}

export interface FieldTypeMatchPreviewVO {
  actualType: string
  normalizedActualType: string
  status: FieldTypeMatchStatus
  logicalType?: LogicalFieldTypeSimpleVO
  candidates: LogicalFieldTypeSimpleVO[]
}

export type PreprocessingRulePageReq = PageParam & {
  keyword?: string
  status?: number
}

const preprocessingRuleUrl = '/data-market/management/preprocessing-rule-templates'

export const getPreprocessingRulePage = (params: PreprocessingRulePageReq) =>
  request.get<PageResult<PreprocessingRuleVO>>({ url: preprocessingRuleUrl, params })

export const getEnabledPreprocessingRules = () =>
  request.get<PreprocessingRuleVO[]>({ url: `${preprocessingRuleUrl}/simple-list` })

export const createPreprocessingRule = (data: PreprocessingRuleVO) =>
  request.post({ url: preprocessingRuleUrl, data })

export const updatePreprocessingRule = (id: number, data: PreprocessingRuleVO) =>
  request.put({ url: `${preprocessingRuleUrl}/${id}`, data })

export const deletePreprocessingRule = (id: number) =>
  request.delete({ url: `${preprocessingRuleUrl}/${id}` })

const logicalFieldTypeUrl = '/data-market/management/logical-field-types'

export const getLogicalFieldTypePage = (params: LogicalFieldTypePageReq) =>
  request.get<PageResult<LogicalFieldTypeVO>>({ url: logicalFieldTypeUrl, params })

export const getLogicalFieldType = (id: number) =>
  request.get<LogicalFieldTypeVO>({ url: `${logicalFieldTypeUrl}/${id}` })

export const getEnabledLogicalFieldTypes = () =>
  request.get<LogicalFieldTypeSimpleVO[]>({ url: `${logicalFieldTypeUrl}/simple-list` })

export const createLogicalFieldType = (data: LogicalFieldTypeVO) =>
  request.post({ url: logicalFieldTypeUrl, data })

export const updateLogicalFieldType = (id: number, data: LogicalFieldTypeVO) =>
  request.put({ url: `${logicalFieldTypeUrl}/${id}`, data })

export const deleteLogicalFieldType = (id: number) =>
  request.delete({ url: `${logicalFieldTypeUrl}/${id}` })

export const previewFieldType = (actualType: string) =>
  request.post<FieldTypeMatchPreviewVO>({
    url: `${logicalFieldTypeUrl}/match-preview`,
    data: { actualType }
  })
