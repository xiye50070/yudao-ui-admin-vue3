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
