export type DeliveryWorkbenchPageState =
  | 'LOADING'
  | 'WAIT_APPROVAL'
  | 'CREATE_PLAN'
  | 'CONFIGURE'
  | 'ERROR'

export const resolveRouteApplicationId = (raw: unknown): number | undefined => {
  const value = Array.isArray(raw) ? raw[0] : raw
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

const readBusinessErrorCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined
  const direct = Number((error as { code?: unknown }).code)
  if (Number.isFinite(direct)) return direct
  const nested = Number(
    (error as { response?: { data?: { code?: unknown } } }).response?.data?.code
  )
  return Number.isFinite(nested) ? nested : undefined
}

export const isDeliveryNotFoundError = (error: unknown): boolean =>
  readBusinessErrorCode(error) === 1012000044

export const getBusinessErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const msg = (error as { msg?: unknown }).msg
    if (typeof msg === 'string' && msg.trim()) return msg
    if (error instanceof Error && error.message.trim()) return error.message
  }
  return '交付配置加载失败，请稍后重试'
}
