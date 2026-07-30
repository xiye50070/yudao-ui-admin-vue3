import request from '@/config/axios'
import type { AccessClearancePolicy, AccessClearanceRule, DatasetAclRule } from './types'

const management = '/data-market/management'

export const getAccessClearances = () =>
  request.get<AccessClearancePolicy>({ url: `${management}/access-clearances` })
export const updateAccessClearances = (rules: AccessClearanceRule[], version: number) =>
  request.put<AccessClearancePolicy>({
    url: `${management}/access-clearances`,
    data: { rules },
    headers: { 'If-Match-Version': String(version) }
  })
export const getDatasetAcl = (datasetId: number) =>
  request.get<DatasetAclRule[]>({ url: `${management}/datasets/${datasetId}/acl` })
export const updateDatasetAcl = (datasetId: number, rules: DatasetAclRule[]) =>
  request.put({ url: `${management}/datasets/${datasetId}/acl`, data: { rules } })
