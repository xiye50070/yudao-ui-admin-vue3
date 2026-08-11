import type { DeliveryAcceptanceReadinessVO } from '@/api/dataMarket/types'

export const acceptanceBlockingMessages = (
  readiness: DeliveryAcceptanceReadinessVO | undefined
): string[] => {
  if (!readiness) return ['验收就绪状态尚未加载，请刷新页面后重试']

  const messages: string[] = []
  if (readiness.unreadyApiCount > 0) {
    messages.push(
      `还有 ${readiness.unreadyApiCount} 个 API 未完成发布版本、生产运行绑定或有效凭证配置`
    )
  }
  return messages
}

export const isAcceptanceReady = (readiness: DeliveryAcceptanceReadinessVO | undefined) =>
  readiness?.ready === true && acceptanceBlockingMessages(readiness).length === 0
