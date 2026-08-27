<template>
  <el-form
    v-show="getShow"
    ref="formLogin"
    :model="loginData.loginForm"
    :rules="LoginRules"
    class="login-form login-account-form"
    label-position="top"
    size="large"
  >
    <div class="login-form-heading">
      <span class="login-form-badge" aria-hidden="true">
        <Icon icon="ep:right" :size="23" />
      </span>
      <h1>{{ t('login.accountWelcome') }}</h1>
      <p>{{ t('login.accountSubtitle') }}</p>
    </div>

    <el-form-item
      v-if="loginData.tenantEnable === 'true'"
      :label="t('login.tenantname')"
      prop="tenantName"
    >
      <el-select
        v-model="loginData.loginForm.tenantName"
        :loading="tenantLoading"
        :placeholder="t('login.tenantSelectPlaceholder')"
        allow-create
        autocomplete="organization"
        clearable
        default-first-option
        filterable
      >
        <template #prefix>
          <Icon icon="ep:house" />
        </template>
        <el-option
          v-for="tenant in tenantOptions"
          :key="tenant.id"
          :label="tenant.name"
          :value="tenant.name"
        />
      </el-select>
    </el-form-item>

    <el-form-item :label="t('login.username')" prop="username">
      <el-input
        v-model="loginData.loginForm.username"
        :placeholder="t('login.usernamePlaceholder')"
        :prefix-icon="iconAvatar"
        autocomplete="username"
      />
    </el-form-item>

    <el-form-item :label="t('login.password')" prop="password">
      <el-input
        v-model="loginData.loginForm.password"
        :placeholder="t('login.passwordPlaceholder')"
        :prefix-icon="iconLock"
        autocomplete="current-password"
        show-password
        type="password"
        @keyup.enter="getCode()"
      />
    </el-form-item>

    <div class="login-options">
      <el-checkbox v-model="loginData.loginForm.rememberMe">
        {{ t('login.remember') }}
      </el-checkbox>
      <el-link type="primary" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
        {{ t('login.forgetPassword') }}
      </el-link>
    </div>

    <el-button :loading="loginLoading" class="login-submit" type="primary" @click="getCode()">
      {{ t('login.login') }}
    </el-button>

    <Verify
      v-if="loginData.captchaEnable === 'true'"
      ref="verify"
      :captchaType="captchaType"
      :imgSize="{ width: '400px', height: '200px' }"
      mode="pop"
      @success="handleLogin"
    />

    <div class="login-secondary-actions">
      <el-button @click="setLoginState(LoginStateEnum.MOBILE)">
        {{ t('login.btnMobile') }}
      </el-button>
      <el-button @click="setLoginState(LoginStateEnum.QR_CODE)">
        {{ t('login.btnQRCode') }}
      </el-button>
      <el-button @click="setLoginState(LoginStateEnum.REGISTER)">
        {{ t('login.btnRegister') }}
      </el-button>
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useIcon } from '@/hooks/web/useIcon'

import * as authUtil from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import * as LoginApi from '@/api/login'
import * as TenantApi from '@/api/system/tenant'
import { LoginStateEnum, useFormValid, useLoginState } from './useLogin'

defineOptions({ name: 'LoginForm' })

const { t } = useI18n()
const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { setLoginState, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const permissionStore = usePermissionStore()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字 pictureWord 文字验证码

interface TenantOption {
  id: number
  name: string
}

const tenantOptions = ref<TenantOption[]>([])
const tenantLoading = ref(false)

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

const LoginRules = {
  tenantName: [required],
  username: [required],
  password: [required]
}
const loginData = reactive({
  isShowPassword: false,
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  loginForm: {
    tenantName: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
    username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
    password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
    captchaVerification: '',
    rememberMe: true // 默认记录我。如果不需要，可手动修改
  }
})

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接登录
  if (loginData.captchaEnable === 'false') {
    await handleLogin({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    verify.value.show()
  }
}
// 获取租户 ID
const getTenantId = async () => {
  if (loginData.tenantEnable === 'true') {
    const res = await LoginApi.getTenantIdByName(loginData.loginForm.tenantName)
    authUtil.setTenantId(res)
  }
}
// 记住我
const getLoginFormCache = () => {
  const loginForm = authUtil.getLoginForm()
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      username: loginForm.username ? loginForm.username : loginData.loginForm.username,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe,
      tenantName: loginForm.tenantName ? loginForm.tenantName : loginData.loginForm.tenantName
    }
  }
}
// 根据域名，获得租户信息
const getTenantByWebsite = async () => {
  if (loginData.tenantEnable === 'true') {
    const website = location.host
    const res = await LoginApi.getTenantByWebsite(website)
    if (res) {
      loginData.loginForm.tenantName = res.name
      authUtil.setTenantId(res.id)
    }
  }
}

// 获取可选租户；接口异常时仍可手动输入租户名称，避免阻断登录
const getTenantList = async () => {
  if (loginData.tenantEnable !== 'true') {
    return
  }
  tenantLoading.value = true
  try {
    tenantOptions.value = await TenantApi.getTenantList()
  } catch {
    tenantOptions.value = []
  } finally {
    tenantLoading.value = false
  }
}
const loading = ref() // ElLoading.service 返回的实例
// 登录
const handleLogin = async (params: any) => {
  loginLoading.value = true
  try {
    await getTenantId()
    const data = await validForm()
    if (!data) {
      return
    }
    const loginDataLoginForm = { ...loginData.loginForm }
    loginDataLoginForm.captchaVerification = params.captchaVerification
    const res = await LoginApi.login(loginDataLoginForm)
    if (!res) {
      return
    }
    loading.value = ElLoading.service({
      lock: true,
      text: '正在加载系统中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    if (loginDataLoginForm.rememberMe) {
      authUtil.setLoginForm(loginDataLoginForm)
    } else {
      authUtil.removeLoginForm()
    }
    authUtil.setToken(res)
    if (!redirect.value) {
      redirect.value = '/'
    }
    // 判断是否为SSO登录
    if (redirect.value.indexOf('sso') !== -1) {
      window.location.href = window.location.href.replace('/login?redirect=', '')
    } else {
      await push({ path: redirect.value || permissionStore.addRouters[0].path })
    }
  } finally {
    loginLoading.value = false
    loading.value?.close()
  }
}

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)
onMounted(() => {
  getLoginFormCache()
  getTenantByWebsite()
  getTenantList()
})
</script>

<style lang="scss" scoped>
.login-account-form {
  width: 100%;
  max-width: 430px;

  .login-form-heading {
    margin-bottom: 30px;
    text-align: center;

    .login-form-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-bottom: 18px;
      color: #fff;
      background: linear-gradient(145deg, #3485ff 0%, #0b5ff2 100%);
      border-radius: 14px;
      box-shadow: 0 12px 24px rgb(26 105 245 / 28%);
    }

    h1 {
      margin: 0;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.02em;
      color: #111827;
    }

    p {
      margin: 9px 0 0;
      font-size: 14px;
      line-height: 1.6;
      color: #7a899d;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 19px;
  }

  :deep(.el-form-item__label) {
    height: auto;
    padding: 0;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 650;
    line-height: 1.5;
    color: #586a82;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 50px;
    padding: 0 15px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 0 0 1px #dce6f2 inset;
    transition:
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-select__wrapper:hover) {
    box-shadow: 0 0 0 1px #a9c8f9 inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused) {
    box-shadow:
      0 0 0 1px #1769f5 inset,
      0 0 0 4px rgb(23 105 245 / 10%);
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #172033;
  }

  :deep(.el-input__prefix-inner),
  :deep(.el-select__prefix) {
    color: #8394aa;
  }

  .login-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -1px 0 21px;

    :deep(.el-checkbox__label),
    :deep(.el-link__inner) {
      font-size: 13px;
    }
  }

  .login-submit {
    width: 100%;
    min-height: 50px;
    margin: 0;
    font-weight: 650;
    color: #fff;
    background: #1769f5;
    border: 0;
    border-radius: 12px;
    box-shadow: 0 12px 22px rgb(23 105 245 / 20%);

    &:hover,
    &:focus-visible {
      background: #0d5ee8;
    }
  }

  .login-secondary-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;

    :deep(.el-button) {
      min-height: 46px;
      margin: 0;
      color: #53657c;
      background: #fff;
      border-color: #dce6f2;
      border-radius: 11px;
    }

    :deep(.el-button:hover),
    :deep(.el-button:focus-visible) {
      color: #1769f5;
      background: #f5f9ff;
      border-color: #8ab7fa;
    }
  }
}

:global(.dark) .login-account-form {
  .login-form-heading h1 {
    color: #f4f7fb;
  }

  .login-form-heading p,
  :deep(.el-form-item__label) {
    color: #9caec3;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  .login-secondary-actions :deep(.el-button) {
    background: #111a29;
    box-shadow: 0 0 0 1px #2a3a50 inset;
  }
}

@media (width <= 640px) {
  .login-account-form {
    .login-form-heading {
      margin-bottom: 25px;

      h1 {
        font-size: 27px;
      }
    }

    .login-secondary-actions {
      gap: 8px;

      :deep(.el-button) {
        padding: 8px 6px;
        font-size: 13px;
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-account-form :deep(.el-input__wrapper),
  .login-account-form :deep(.el-select__wrapper) {
    transition: none;
  }
}
</style>
