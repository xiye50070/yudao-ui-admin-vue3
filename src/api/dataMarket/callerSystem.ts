import request from '@/config/axios'
import type { PageParam, PageResult } from './types'

export interface CallerSystemVO {
  id?: number
  code: string
  name: string
  status: number
  sort: number
  description?: string
}

export type CallerSystemPageReq = PageParam & { keyword?: string }

const url = '/data-market/management/caller-systems'

export const getCallerSystemPage = (params: CallerSystemPageReq) =>
  request.get<PageResult<CallerSystemVO>>({ url, params })

export const createCallerSystem = (data: CallerSystemVO) => request.post({ url, data })

export const updateCallerSystem = (id: number, data: CallerSystemVO) =>
  request.put({ url: `${url}/${id}`, data })

export const deleteCallerSystem = (id: number) => request.delete({ url: `${url}/${id}` })
