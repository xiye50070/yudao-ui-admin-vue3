export type ApiVersionDraft = {
  versionNo: string
  publicBaseUrl: string
  requestPath: string
  rateLimitPolicy: Record<string, unknown>
  networkPolicy: Record<string, unknown>
  requestDescription: string
  responseDescription: string
  successDescription: string
  failureDescription: string
  lineage: Array<unknown>
}

export function validateApiVersionDraft(draft: ApiVersionDraft) {
  const errors: Record<string, string> = {}
  if (!draft.versionNo.trim()) errors.versionNo = '请填写版本号'
  try {
    if (new URL(draft.publicBaseUrl).protocol !== 'https:')
      errors.publicBaseUrl = '请输入 HTTPS 公开地址'
  } catch {
    errors.publicBaseUrl = '请输入 HTTPS 公开地址'
  }
  if (!draft.requestPath.startsWith('/')) errors.requestPath = '请求路径必须以 / 开头'
  if (!Object.keys(draft.rateLimitPolicy).length) errors.rateLimitPolicy = '请配置限流策略'
  if (!Object.keys(draft.networkPolicy).length) errors.networkPolicy = '请配置网络策略'
  if (!draft.requestDescription.trim()) errors.requestDescription = '请填写请求说明'
  if (!draft.responseDescription.trim()) errors.responseDescription = '请填写响应说明'
  if (!draft.successDescription.trim()) errors.successDescription = '请填写成功说明'
  if (!draft.failureDescription.trim()) errors.failureDescription = '请填写失败说明'
  if (!draft.lineage.length) errors.lineage = '请选择真实数据来源'
  return errors
}
