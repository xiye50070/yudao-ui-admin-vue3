import { cleanup, render, screen } from '@testing-library/vue'
import ElementPlus from 'element-plus'
import { computed, onMounted, reactive, ref, unref, watch, type Component } from 'vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const loginApi = vi.hoisted(() => ({
  getTenantByWebsite: vi.fn(),
  getTenantIdByName: vi.fn(),
  login: vi.fn(),
  socialAuthRedirect: vi.fn(),
  sendSmsCode: vi.fn(),
  smsLogin: vi.fn(),
  smsResetPassword: vi.fn(),
  register: vi.fn()
}))

const tenantApi = vi.hoisted(() => ({
  getTenantList: vi.fn()
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
vi.mock('@/api/system/tenant', () => tenantApi)
vi.mock('@/utils/auth', () => authApi)
vi.mock('@/hooks/web/useIcon', () => ({ useIcon: () => undefined }))
vi.mock('@/store/modules/permission', () => ({
  usePermissionStore: () => ({ addRouters: [{ path: '/' }] })
}))

const translations: Record<string, string> = {
  'login.tenantname': '租户名称',
  'login.tenantNamePlaceholder': '请输入租户名称',
  'login.tenantSelectPlaceholder': '请选择租户',
  'login.username': '用户名',
  'login.usernamePlaceholder': '请输入用户名',
  'login.password': '密码',
  'login.passwordPlaceholder': '请输入密码',
  'login.remember': '记住我',
  'login.forgetPassword': '忘记密码?',
  'login.login': '登录',
  'login.btnMobile': '手机登录',
  'login.btnQRCode': '二维码登录',
  'login.btnRegister': '注册',
  'login.otherLogin': '其他登录方式',
  'login.accountWelcome': '欢迎登录',
  'login.accountSubtitle': '使用企业账号访问业务中台',
  'login.visualTitle': '让数据在业务中台顺畅流动',
  'login.visualDescription': '统一连接数据、流程与服务，让协作始终清晰可控。',
  'login.capabilityCatalog': '数据目录',
  'login.capabilityApi': 'API 服务',
  'login.capabilityWorkflow': '流程审批',
  'login.capabilitySecurity': '安全治理',
  'sys.login.signInFormTitle': '登录'
}

let LoginForm: Component
let LoginPage: Component

const previousGlobals = new Map<string, unknown>()

function stubGlobal(name: string, value: unknown) {
  previousGlobals.set(name, Reflect.get(globalThis, name))
  Reflect.set(globalThis, name, value)
}

describe('login experience', () => {
  beforeAll(async () => {
    stubGlobal('ref', ref)
    stubGlobal('computed', computed)
    stubGlobal('reactive', reactive)
    stubGlobal('unref', unref)
    stubGlobal('watch', watch)
    stubGlobal('onMounted', onMounted)
    stubGlobal('required', { required: true, message: '必填' })
    stubGlobal('useI18n', () => ({ t: (key: string) => translations[key] ?? key }))
    stubGlobal('useMessage', () => ({
      error: vi.fn(),
      prompt: vi.fn(),
      success: vi.fn()
    }))
    stubGlobal('useRouter', () => ({
      currentRoute: ref({ query: {} }),
      push: vi.fn()
    }))
    stubGlobal('useRoute', () => ({ query: {} }))

    LoginForm = (await import('@/views/Login/components/LoginForm.vue')).default
    LoginPage = (await import('@/views/Login/Login.vue')).default
  })

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    authApi.getLoginForm.mockReturnValue(undefined)
    loginApi.getTenantByWebsite.mockResolvedValue(undefined)
    tenantApi.getTenantList.mockResolvedValue([
      { id: 1, name: '首都实业' },
      { id: 2, name: '测试租户' }
    ])
  })

  afterAll(() => {
    cleanup()
    for (const [name, value] of previousGlobals) {
      if (value === undefined) Reflect.deleteProperty(globalThis, name)
      else Reflect.set(globalThis, name, value)
    }
  })

  it('keeps the supported login actions without promotional or social-login sections', async () => {
    render(LoginForm, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          Icon: true,
          Verify: true
        }
      }
    })

    expect(await screen.findByRole('button', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '手机登录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '二维码登录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument()
    expect(screen.queryByText('其他登录方式')).not.toBeInTheDocument()
    expect(screen.queryByText('萌新必读')).not.toBeInTheDocument()
    expect(screen.queryByText('开发指南')).not.toBeInTheDocument()
  })

  it('uses a searchable tenant selector on the account login form', async () => {
    render(LoginForm, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          Icon: true,
          Verify: true
        }
      }
    })

    const tenantSelect = await screen.findByRole('combobox')
    expect(tenantSelect).toBeInTheDocument()
    expect(screen.getByText('请选择租户')).toBeInTheDocument()
    expect(tenantApi.getTenantList).toHaveBeenCalledOnce()
  })

  it('renders the selected light-frame data-connection experience', () => {
    const view = render(LoginPage, {
      global: {
        stubs: {
          LoginForm: { template: '<form data-testid="login-form" />' },
          MobileForm: true,
          QrCodeForm: true,
          RegisterForm: true,
          SSOLogin: true,
          SSOLoginVue: true,
          ForgetPasswordForm: true,
          ThemeSwitch: { template: '<button aria-label="theme-switch" />' },
          LocaleDropdown: { template: '<button aria-label="locale-switch" />' },
          Transition: false
        }
      }
    })

    expect(view.getByTestId('login-shell')).toBeInTheDocument()
    expect(view.getByRole('region', { name: '数据能力连接' })).toBeInTheDocument()
    expect(view.getByText('让数据在业务中台顺畅流动')).toBeInTheDocument()
    expect(view.getByText('数据目录')).toBeInTheDocument()
    expect(view.getByText('API 服务')).toBeInTheDocument()
    expect(view.getByText('流程审批')).toBeInTheDocument()
    expect(view.getByText('安全治理')).toBeInTheDocument()
    expect(view.queryByRole('button', { name: 'theme-switch' })).not.toBeInTheDocument()
    expect(view.getByRole('button', { name: 'locale-switch' })).toBeInTheDocument()
  })
})
