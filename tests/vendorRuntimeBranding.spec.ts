import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const routerAfterEach = vi.hoisted(() => vi.fn())

vi.mock('@/router', () => ({
  default: { afterEach: routerAfterEach }
}))

describe('runtime supplier branding removal', () => {
  beforeEach(() => {
    vi.resetModules()
    routerAfterEach.mockClear()
  })

  afterEach(() => {
    document.querySelectorAll('[data-test-script]').forEach((element) => element.remove())
    window._hmt = []
  })

  it('uses product-owned browser metadata', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const page = new DOMParser().parseFromString(html, 'text/html')
    const metadata = [
      page.querySelector('meta[name="keywords"]')?.getAttribute('content') ?? '',
      page.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
    ].join(' ')

    expect(metadata).toContain('业务中台')
    expect(metadata).not.toMatch(/芋道|若依|iocoder|ruoyi|yudao/i)
  })

  it('presents an accessible data-loading state before Vue mounts', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const page = new DOMParser().parseFromString(html, 'text/html')
    const loadingStatus = page.querySelector('[role="status"]')

    expect(loadingStatus?.getAttribute('aria-live')).toBe('polite')
    expect(loadingStatus?.textContent?.replace(/\s+/g, ' ').trim()).toBe('数据加载中')
    expect(loadingStatus?.querySelectorAll('.app-loading-dot')).toHaveLength(3)
    expect(loadingStatus?.querySelector('img')).toBeNull()
  })

  it('does not load a supplier-owned analytics tracker', async () => {
    const bootstrap = document.createElement('script')
    bootstrap.dataset.testScript = 'bootstrap'
    document.head.appendChild(bootstrap)

    await import('@/plugins/tongji')

    const analyticsScripts = Array.from(document.scripts).filter((script) =>
      script.src.includes('hm.baidu.com')
    )
    analyticsScripts.forEach((script) => {
      script.dataset.testScript = 'analytics'
    })
    expect(analyticsScripts).toEqual([])
  })
})
