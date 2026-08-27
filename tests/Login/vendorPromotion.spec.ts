import { cleanup, render, screen } from '@testing-library/vue'
import ElementPlus from 'element-plus'
import { computed, onMounted, reactive, ref, unref, watch, type Component } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const loginApi = vi.hoisted(() => ({
  getTenantByWebsite: vi.fn(),
  getTenantIdByName: vi.fn(),
  login: vi.fn(),
  socialAuthRedirect: vi.fn()
}))

const authApi = vi.hoisted(() => ({
  getLoginForm: vi.fn(),
  setLoginForm: vi.fn(),
  removeLoginForm: vi.fn(),
  setTenantId: vi.fn(),
  getTenantId: vi.fn(),
  setToken: vi.fn()
}))

vi.mock('@/api/login', () => loginApi)
vi.mock('@/utils/auth', () => authApi)
vi.mock('@/hooks/web/useIcon', () => ({ useIcon: () => undefined }))
vi.mock('@/store/modules/permission', () => ({
  usePermissionStore: () => ({ addRouters: [{ path: '/' }] })
}))

let LoginForm: Component
const previousGlobals = new Map<string, unknown>()

function stubGlobal(name: string, value: unknown) {
  previousGlobals.set(name, Reflect.get(globalThis, name))
  Reflect.set(globalThis, name, value)
}

describe('login supplier promotion removal', () => {
  beforeAll(async () => {
    stubGlobal('ref', ref)
    stubGlobal('computed', computed)
    stubGlobal('reactive', reactive)
    stubGlobal('unref', unref)
    stubGlobal('watch', watch)
    stubGlobal('onMounted', onMounted)
    stubGlobal('required', { required: true, message: '必填' })
    stubGlobal('useI18n', () => ({ t: (key: string) => key }))
    stubGlobal('useMessage', () => ({ error: vi.fn(), prompt: vi.fn() }))
    stubGlobal('useRouter', () => ({ currentRoute: ref({ query: {} }), push: vi.fn() }))

    LoginForm = (await import('@/views/Login/components/LoginForm.vue')).default
  })

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    authApi.getLoginForm.mockReturnValue(undefined)
    loginApi.getTenantByWebsite.mockResolvedValue(undefined)
  })

  afterAll(() => {
    cleanup()
    for (const [name, value] of previousGlobals) {
      if (value === undefined) Reflect.deleteProperty(globalThis, name)
      else Reflect.set(globalThis, name, value)
    }
  })

  it('does not show supplier onboarding links or a supplier tenant default', async () => {
    render(LoginForm, {
      global: {
        plugins: [ElementPlus],
        stubs: { Verify: true, Icon: true }
      }
    })

    expect(await screen.findByRole('button', { name: 'login.login' })).toBeInTheDocument()
    expect(screen.queryByText('萌新必读')).not.toBeInTheDocument()
    expect(screen.queryByText(/开发指南/)).not.toBeInTheDocument()
    expect(screen.queryByText(/视频教程/)).not.toBeInTheDocument()
    expect(screen.queryByText(/面试手册/)).not.toBeInTheDocument()
    expect(screen.queryByText(/外包咨询/)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('芋道源码')).not.toBeInTheDocument()
  })
})
