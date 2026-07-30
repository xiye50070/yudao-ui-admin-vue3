import type { ApiVersionCreateReq } from '@/api/dataMarket/types'

export const buildApiVersionCreateRequest = (draft: ApiVersionCreateReq): ApiVersionCreateReq => ({
  ...draft,
  lineage: [...draft.lineage]
})
