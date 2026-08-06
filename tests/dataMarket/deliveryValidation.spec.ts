import { describe, expect, it } from 'vitest'
import { validateApiVersionDraft } from '@/views/dataMarket/deliveryWorkbench/validation'

describe('delivery API version validation', () => {
  it('requires a public https address, descriptions, and structured policies without lineage', () => {
    expect(
      validateApiVersionDraft({
        versionNo: '',
        publicBaseUrl: 'http://internal.service',
        requestPath: 'orders',
        rateLimitPolicy: {},
        networkPolicy: {},
        requestDescription: '',
        responseDescription: '',
        successDescription: '',
        failureDescription: ''
      })
    ).toEqual(
      expect.objectContaining({
        versionNo: '请填写版本号',
        publicBaseUrl: '请输入 HTTPS 公开地址',
        requestPath: '请求路径必须以 / 开头',
        rateLimitPolicy: '请配置限流策略',
        networkPolicy: '请配置网络策略'
      })
    )
  })
})
