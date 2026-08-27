<template>
  <main :class="prefixCls" class="login-page">
    <section class="login-shell" data-testid="login-shell">
      <header class="login-topbar">
        <div class="login-brand">
          <img alt="" src="@/assets/imgs/logo.png" />
          <strong>{{ underlineToHump(appStore.getTitle) }}</strong>
        </div>
        <div class="login-controls">
          <LocaleDropdown />
        </div>
      </header>

      <div class="login-content">
        <section class="login-form-stage" aria-label="账户登录">
          <div class="login-form-stack">
            <Transition name="login-form" appear>
              <div class="login-form-view">
                <LoginForm class="auth-form" />
                <MobileForm class="auth-form" />
                <QrCodeForm class="auth-form" />
                <RegisterForm class="auth-form" />
                <SSOLoginVue class="auth-form" />
                <ForgetPasswordForm class="auth-form" />
              </div>
            </Transition>
          </div>
        </section>

        <aside class="login-visual-panel" role="region" aria-label="数据能力连接">
          <div class="visual-heading">
            <h1>{{ t('login.visualTitle') }}</h1>
            <span aria-hidden="true"></span>
          </div>

          <div class="orbit-stage">
            <img alt="" src="@/assets/imgs/login-data-orbit.png" />
            <span class="orbit-label orbit-label--catalog">
              {{ t('login.capabilityCatalog') }}
            </span>
            <span class="orbit-label orbit-label--api">
              {{ t('login.capabilityApi') }}
            </span>
            <span class="orbit-label orbit-label--workflow">
              {{ t('login.capabilityWorkflow') }}
            </span>
            <span class="orbit-label orbit-label--security">
              {{ t('login.capabilitySecurity') }}
            </span>
          </div>

          <p class="visual-description">{{ t('login.visualDescription') }}</p>
        </aside>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { underlineToHump } from '@/utils'

import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'

import {
  LoginForm,
  MobileForm,
  QrCodeForm,
  RegisterForm,
  SSOLoginVue,
  ForgetPasswordForm
} from './components'

defineOptions({ name: 'Login' })

const { t } = useI18n()
const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  min-height: 100vh;
  padding: clamp(18px, 3.5vw, 52px);
  overflow: auto;
  background:
    radial-gradient(circle at 0 50%, rgb(216 235 255 / 92%) 0, transparent 42%),
    radial-gradient(circle at 100% 50%, rgb(255 234 232 / 80%) 0, transparent 42%), #f7fbff;
  box-sizing: border-box;
}

.login-shell {
  display: flex;
  flex-direction: column;
  width: min(100%, 1488px);
  min-height: calc(100vh - clamp(36px, 7vw, 104px));
  margin: 0 auto;
  overflow: hidden;
  background: rgb(255 255 255 / 96%);
  border: 8px solid #d5ebff;
  border-radius: 32px;
  box-shadow:
    0 28px 70px rgb(78 123 174 / 18%),
    0 4px 18px rgb(67 104 148 / 8%);
}

.login-topbar {
  display: flex;
  flex: 0 0 96px;
  align-items: center;
  justify-content: space-between;
  padding: 0 52px;
}

.login-brand {
  display: flex;
  align-items: center;
  min-width: 0;
  color: #172033;

  img {
    width: 42px;
    height: 42px;
    margin-right: 11px;
    object-fit: contain;
  }

  strong {
    overflow: hidden;
    font-size: 19px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.login-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  color: #5d6d82;
}

.login-content {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(450px, 1.1fr) minmax(450px, 1fr);
  gap: 20px;
  min-height: 0;
  padding: 0 50px 50px;
}

.login-form-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 760px;
  padding: 36px clamp(36px, 6vw, 92px);
  overflow: auto;
}

.login-form-stack,
.login-form-view,
.auth-form {
  width: 100%;
}

.login-form-stack {
  max-width: 430px;
}

.login-visual-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 760px;
  padding: 54px 16px 24px;
  overflow: hidden;
  background: #e8f2fd;
  border: 1px solid #e0eefc;
  border-radius: 28px;
}

.visual-heading {
  position: relative;
  z-index: 2;
  text-align: center;

  h1 {
    margin: 0;
    font-size: clamp(23px, 1.8vw, 28px);
    font-weight: 760;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: #172033;
  }

  span {
    display: block;
    width: 64px;
    height: 4px;
    margin: 14px auto 0;
    background: #1769f5;
    border-radius: 999px;
  }
}

.orbit-stage {
  position: relative;
  width: min(100%, 610px);
  margin: 0 0 16px;
  aspect-ratio: 1;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.orbit-label {
  position: absolute;
  z-index: 2;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  color: #315071;
  white-space: nowrap;
  background: rgb(255 255 255 / 90%);
  border: 1px solid rgb(176 209 244 / 70%);
  border-radius: 999px;
  box-shadow: 0 7px 18px rgb(62 118 177 / 12%);

  &--catalog {
    top: 16%;
    left: 50%;
    transform: translateX(-50%);
  }

  &--api {
    top: 48%;
    left: 2%;
  }

  &--workflow {
    top: 48%;
    right: 1%;
  }

  &--security {
    bottom: 6%;
    left: 50%;
    transform: translateX(-50%);
  }
}

.visual-description {
  width: min(100%, 560px);
  margin: 4px auto;
  font-size: 15px;
  line-height: 1.75;
  color: #5e7189;
  text-align: center;
}

.login-form-enter-active {
  transition:
    opacity 360ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.login-form-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

:global(.dark) {
  .login-page {
    background: #0b1220;
  }

  .login-shell {
    background: #101927;
    border-color: #1d3450;
    box-shadow: 0 28px 70px rgb(0 0 0 / 32%);
  }

  .login-brand {
    color: #f4f7fb;
  }

  .login-controls {
    color: #a7b6c9;
  }

  .login-visual-panel {
    background: #13263b;
    border-color: #203b57;
  }

  .visual-heading h1 {
    color: #f4f7fb;
  }

  .visual-description {
    color: #a8b8cb;
  }
}

@media (width <= 1080px) {
  .login-content {
    display: block;
  }

  .login-form-stage {
    min-height: calc(100vh - 150px);
  }

  .login-visual-panel {
    display: none;
  }
}

@media (width <= 640px) {
  .login-page {
    padding: 0;
    background: #fff;
  }

  .login-shell {
    min-height: 100vh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .login-topbar {
    flex-basis: 68px;
    padding: 0 20px;
  }

  .login-brand {
    img {
      width: 36px;
      height: 36px;
    }

    strong {
      max-width: 160px;
      font-size: 16px;
    }
  }

  .login-content {
    padding: 0 20px 24px;
  }

  .login-form-stage {
    align-items: flex-start;
    min-height: auto;
    padding: 38px 0 24px;
    overflow: visible;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-form-enter-active {
    transition: none;
  }
}
</style>

<style lang="scss">
.dark .login-form {
  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>
