import request from '@/config/axios'

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
