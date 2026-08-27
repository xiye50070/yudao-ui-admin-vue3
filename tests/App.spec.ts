import { cleanup, render } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

vi.mock('@/components/RouterSearch/index.vue', () => ({
  default: { template: '<div />' }
}))

describe('application appearance bootstrap', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark', 'light')
    setActivePinia(createPinia())
    vi.stubGlobal('computed', computed)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('keeps the code-owned light theme when stale browser preferences request dark mode', async () => {
    const { wsCache } = useCache()
    wsCache.set(CACHE_KEY.IS_DARK, true)

    const { default: App } = await import('@/App.vue')
    render(App, {
      global: {
        stubs: {
          ConfigGlobal: { template: '<div><slot /></div>' },
          RouterView: true
        }
      }
    })

    expect(document.documentElement).toHaveClass('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
