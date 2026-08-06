import { describe, expect, it } from 'vitest'
import {
  getBusinessErrorMessage,
  isDeliveryNotFoundError,
  resolveRouteApplicationId
} from '@/views/dataMarket/deliveryWorkbench/pageState'

describe('delivery workbench page state', () => {
  it('accepts only a positive integer application id from the route', () => {
    expect(resolveRouteApplicationId('42')).toBe(42)
    expect(resolveRouteApplicationId(['42'])).toBe(42)
    expect(resolveRouteApplicationId('0')).toBeUndefined()
    expect(resolveRouteApplicationId('abc')).toBeUndefined()
  })

  it('enters create-plan state only for the backend delivery-not-found code', () => {
    expect(isDeliveryNotFoundError({ code: 1012000044 })).toBe(true)
    expect(isDeliveryNotFoundError({ response: { data: { code: 1012000044 } } })).toBe(true)
    expect(isDeliveryNotFoundError({ code: 500 })).toBe(false)
    expect(isDeliveryNotFoundError('error')).toBe(false)
  })

  it('provides a readable fallback error message', () => {
    expect(getBusinessErrorMessage({ msg: '没有权限' })).toBe('没有权限')
    expect(getBusinessErrorMessage(new Error('网络不可用'))).toBe('网络不可用')
    expect(getBusinessErrorMessage('error')).toBe('交付配置加载失败，请稍后重试')
  })
})
