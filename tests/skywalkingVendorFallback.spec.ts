import { cleanup, render, waitFor } from '@testing-library/vue'
import { onMounted, ref } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const configApi = vi.hoisted(() => ({
  getConfigKey: vi.fn()
}))

vi.mock('@/api/infra/config', () => configApi)

const previousGlobals = new Map<string, unknown>()

function stubGlobal(name: string, value: unknown) {
  previousGlobals.set(name, Reflect.get(globalThis, name))
  Reflect.set(globalThis, name, value)
}

describe('SkyWalking configuration fallback', () => {
  beforeAll(() => {
    stubGlobal('ref', ref)
    stubGlobal('onMounted', onMounted)
  })

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    configApi.getConfigKey.mockResolvedValue(undefined)
  })

  afterAll(() => {
    cleanup()
    for (const [name, value] of previousGlobals) {
      if (value === undefined) Reflect.deleteProperty(globalThis, name)
      else Reflect.set(globalThis, name, value)
    }
  })

  it('asks for an internal URL instead of embedding the supplier monitor', async () => {
    const { default: SkyWalkingPage } = await import('@/views/infra/skywalking/index.vue')
    const view = render(SkyWalkingPage, {
      global: {
        stubs: {
          ContentWrap: { template: '<section><slot /></section>' },
          DocAlert: true,
          ElEmpty: {
            props: ['description'],
            template: '<div>{{ description }}</div>'
          },
          IFrame: {
            inheritAttrs: false,
            template: '<iframe data-testid="skywalking-frame" :src="$attrs.src" />'
          }
        }
      }
    })

    await waitFor(() => {
      expect(view.getByText('请先配置 SkyWalking 地址')).toBeInTheDocument()
    })
    expect(view.queryByTestId('skywalking-frame')).not.toBeInTheDocument()
  })
})
