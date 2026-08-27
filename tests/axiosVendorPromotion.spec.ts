import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'

const elementPlus = vi.hoisted(() => ({
  messageError: vi.fn(),
  notificationError: vi.fn()
}))

vi.mock('element-plus', async (importOriginal) => {
  const original = await importOriginal<typeof import('element-plus')>()
  return {
    ...original,
    ElMessage: { error: elementPlus.messageError },
    ElNotification: { error: elementPlus.notificationError }
  }
})

vi.mock('@/router', () => ({
  default: { currentRoute: { value: {} } },
  resetRouter: vi.fn()
}))

describe('API error presentation', () => {
  it('shows the environment error without supplier tutorial promotion', async () => {
    const { service } = await import('@/config/axios/service')
    const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) =>
      ({
        config,
        data: { code: 901, msg: '环境不可用' },
        headers: {},
        request: { responseType: 'json' },
        status: 200,
        statusText: 'OK'
      }) as AxiosResponse

    await expect(service.request({ url: '/health', adapter })).rejects.toThrow('环境不可用')

    expect(elementPlus.messageError).toHaveBeenCalledTimes(1)
    const presentation = JSON.stringify(elementPlus.messageError.mock.calls[0]?.[0])
    expect(presentation).not.toMatch(/iocoder|教程|5 分钟搭建/i)
  })
})
