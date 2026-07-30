import request from '@/config/axios'
import type { AccessClearanceRule, DatasetAclRule, PrincipalType } from './types'

const management = '/data-market/management'

export const getAccessClearances = (params?: {
  principalType?: PrincipalType
  principalId?: number
}) => request.get<AccessClearanceRule[]>({ url: `${management}/access-clearances`, params })
export const updateAccessClearances = (rules: AccessClearanceRule[], version: number) =>
  request.put({
    url: `${management}/access-clearances`,
    data: { rules },
    headers: { 'If-Match-Version': String(version) }
  })
export const getDatasetAcl = (datasetId: number) =>
  request.get<DatasetAclRule[]>({ url: `${management}/datasets/${datasetId}/acl` })
export const updateDatasetAcl = (datasetId: number, rules: DatasetAclRule[]) =>
  request.put({ url: `${management}/datasets/${datasetId}/acl`, data: { rules } })
