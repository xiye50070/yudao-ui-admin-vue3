import request from '@/config/axios'
import type { FilterDimensionVO, PageParam, PageResult, PrincipalType, TagVO } from './types'

const management = '/data-market/management'

export interface IndicatorDomainVO {
  id?: number
  code: string
  name: string
  description?: string
  sort: number
  status: number
}

export const getIndicatorDomainList = () =>
  request.get<IndicatorDomainVO[]>({ url: `${management}/indicator-domains` })

export const createIndicatorDomain = (data: IndicatorDomainVO) =>
  request.post<number>({ url: `${management}/indicator-domains`, data })

export const updateIndicatorDomain = (id: number, data: IndicatorDomainVO) =>
  request.put({ url: `${management}/indicator-domains/${id}`, data })

export const deleteIndicatorDomain = (id: number) =>
  request.delete({ url: `${management}/indicator-domains/${id}` })

export interface IndicatorVO {
  id?: number
  indicatorCode: string
  indicatorName: string
  indicatorDomainId: number
  indicatorDomain?: IndicatorDomainVO
  calculationDescription?: string | null
  thresholdDescription?: string | null
  dataSourceDescription?: string | null
  businessPenetration?: string | null
  supplementaryDescription?: string | null
  tagIds: number[]
  tags?: TagVO[]
  status: number
  sort: number
  createTime?: string
  updateTime?: string
}

export interface IndicatorPageReq extends PageParam {
  keyword?: string
  indicatorDomainId?: number
  tagId?: number
  status?: number
}

export interface IndicatorAclRule {
  id?: number
  principalType: PrincipalType
  principalId: number
  includeChildDept: boolean
}

export interface IndicatorReferenceOptions {
  domains: IndicatorDomainVO[]
  filterDimensions: FilterDimensionVO[]
  tags: TagVO[]
}

export const getIndicatorReferenceOptions = () =>
  request.get<IndicatorReferenceOptions>({ url: `${management}/indicator-reference-options` })

export const getIndicatorPage = (params: IndicatorPageReq) =>
  request.get<PageResult<IndicatorVO>>({ url: `${management}/indicators`, params })

export const getIndicator = (id: number) =>
  request.get<IndicatorVO>({ url: `${management}/indicators/${id}` })

export const createIndicator = (data: IndicatorVO) =>
  request.post<number>({ url: `${management}/indicators`, data })

export const updateIndicator = (id: number, data: IndicatorVO) =>
  request.put({ url: `${management}/indicators/${id}`, data })

export const deleteIndicator = (id: number) =>
  request.delete({ url: `${management}/indicators/${id}` })

export const updateIndicatorStatus = (id: number, status: number) =>
  request.put({ url: `${management}/indicators/${id}/status`, data: { status } })

export const getIndicatorAcl = (id: number) =>
  request.get<IndicatorAclRule[]>({ url: `${management}/indicators/${id}/acl` })

export const updateIndicatorAcl = (id: number, rules: IndicatorAclRule[]) =>
  request.put({ url: `${management}/indicators/${id}/acl`, data: { rules } })
