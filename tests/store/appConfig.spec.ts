import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'

describe('app project configuration', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('uses the code-owned project configuration instead of stale browser preferences', () => {
    const { wsCache } = useCache()
    wsCache.set(CACHE_KEY.LAYOUT, 'sidebar-nav')
    wsCache.set(CACHE_KEY.IS_DARK, true)
    wsCache.set('currentSize', 'large')
    wsCache.set('default', 'large')
    wsCache.set(CACHE_KEY.THEME, {
      elColorPrimary: '#e74c3c',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#001529',
      leftMenuBgLightColor: '#0f2438',
      leftMenuBgActiveColor: '#e74c3c',
      leftMenuCollapseBgActiveColor: '#e74c3c',
      leftMenuTextColor: '#bfcbd9',
      leftMenuTextActiveColor: '#fff',
      logoTitleTextColor: '#fff',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#151515',
      topHeaderTextColor: '#fff',
      topHeaderHoverColor: '#242424',
      topToolBorderColor: '#151515'
    })

    const appStore = useAppStore()

    expect(appStore.$state).toMatchObject({
      breadcrumb: true,
      breadcrumbIcon: true,
      hamburger: true,
      screenfull: true,
      size: true,
      locale: false,
      message: true,
      im: false,
      tagsView: true,
      tagsViewImmerse: true,
      tagsViewIcon: true,
      logo: true,
      uniqueOpened: true,
      fixedHeader: true,
      footer: true,
      greyMode: false,
      layout: 'mixed-nav',
      isDark: false,
      currentSize: 'default',
      theme: {
        elColorPrimary: '#409eff',
        leftMenuBorderColor: '#eee',
        leftMenuBgColor: '#fff',
        leftMenuBgLightColor: '#fff',
        leftMenuBgActiveColor: 'RGBA(64,158,255,0.1)',
        leftMenuCollapseBgActiveColor: 'RGBA(64,158,255,0.1)',
        leftMenuTextColor: '#333',
        leftMenuTextActiveColor: 'var(--el-color-primary)',
        logoTitleTextColor: 'inherit',
        logoBorderColor: '#eee',
        topHeaderBgColor: '#fff',
        topHeaderTextColor: 'inherit',
        topHeaderHoverColor: '#f6f6f6',
        topToolBorderColor: '#eee'
      }
    })
  })
})
