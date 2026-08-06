import type { DeliveredApiAcceptanceStatus } from '@/api/dataMarket/types'

const acceptanceLabels: Record<DeliveredApiAcceptanceStatus, string> = {
  NOT_SUBMITTED: '未提交验收',
  PENDING_ACCEPTANCE: '待验收',
  RECTIFYING: '问题整改中',
  ACCEPTED: '已验收'
}

export const acceptanceStatusLabel = (status: DeliveredApiAcceptanceStatus): string =>
  acceptanceLabels[status] || status

export const formatApiEndpoint = (method?: string | null, path?: string | null): string =>
  [method, path].filter(Boolean).join(' ') || '—'

export const formatTimestamp = (value?: number | string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}

export const prettyJson = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
