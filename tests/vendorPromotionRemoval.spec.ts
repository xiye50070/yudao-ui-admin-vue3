import { cleanup, render } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DocAlert from '@/components/DocAlert/index.vue'
import { component as carousel } from '@/components/DiyEditor/components/mobile/Carousel/config'
import { component as noticeBar } from '@/components/DiyEditor/components/mobile/NoticeBar/config'
import { component as tabBar } from '@/components/DiyEditor/components/mobile/TabBar/config'
import UserCard from '@/components/DiyEditor/components/mobile/UserCard/index.vue'
import UserCoupon from '@/components/DiyEditor/components/mobile/UserCoupon/index.vue'
import UserOrder from '@/components/DiyEditor/components/mobile/UserOrder/index.vue'
import UserWallet from '@/components/DiyEditor/components/mobile/UserWallet/index.vue'
import UserInfo from '@/layout/components/UserInfo/src/UserInfo.vue'
import MessageListEmpty from '@/views/ai/chat/index/components/message/MessageListEmpty.vue'

const router = {
  push: vi.fn(),
  replace: vi.fn()
}

describe('supplier promotion removal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('useI18n', () => ({
      t: (key: string) =>
        ({
          'common.profile': '个人中心',
          'common.document': '项目文档',
          'lock.lockScreen': '锁定屏幕',
          'common.loginOut': '退出登录'
        })[key] ?? key
    }))
    vi.stubGlobal('useRouter', () => router)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not render supplier documentation callouts on management pages', () => {
    const view = render(DocAlert, {
      props: {
        title: 'SaaS 多租户',
        url: 'https://doc.iocoder.cn/saas-tenant/'
      }
    })

    expect(view.container).toBeEmptyDOMElement()
  })

  it('keeps account actions without exposing the supplier documentation entry', () => {
    const view = render(UserInfo, {
      global: {
        stubs: {
          ElAvatar: { template: '<div><slot /></div>' },
          ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' },
          ElDropdownItem: { template: '<div><slot /></div>' },
          ElDropdownMenu: { template: '<div><slot /></div>' },
          Icon: true,
          LockDialog: true,
          LockPage: true,
          Teleport: true,
          Transition: false
        }
      }
    })

    expect(view.getByText('个人中心')).toBeInTheDocument()
    expect(view.getByText('锁定屏幕')).toBeInTheDocument()
    expect(view.getByText('退出登录')).toBeInTheDocument()
    expect(view.queryByText('项目文档')).not.toBeInTheDocument()
  })

  it('uses product-neutral labels in reusable feature previews', () => {
    const aiView = render(MessageListEmpty)
    expect(aiView.getByText('AI 助手')).toBeInTheDocument()
    expect(aiView.queryByText('芋道 AI')).not.toBeInTheDocument()
    aiView.unmount()

    const userCardView = render(UserCard, {
      props: { property: {} },
      global: {
        stubs: {
          ElAvatar: { template: '<div><slot /></div>' },
          Icon: true
        }
      }
    })
    expect(userCardView.getByText('用户中心')).toBeInTheDocument()
    expect(userCardView.queryByText('芋道源码')).not.toBeInTheDocument()
  })

  it('does not make new DIY pages fetch supplier-hosted default assets', () => {
    const externalDefaults = [
      ...carousel.property.items.map((item) => item.imgUrl),
      noticeBar.property.iconUrl,
      ...tabBar.property.items.flatMap((item) => [item.iconUrl, item.activeIconUrl])
    ].filter(Boolean)

    expect(externalDefaults).toEqual([])
  })

  it('renders account widgets without supplier-hosted preview images', () => {
    const stubs = {
      ElImage: {
        inheritAttrs: false,
        template: '<img :src="$attrs.src" />'
      },
      Icon: true
    }
    const views = [
      render(UserOrder, { props: { property: {} }, global: { stubs } }),
      render(UserCoupon, { props: { property: {} }, global: { stubs } }),
      render(UserWallet, { props: { property: {} }, global: { stubs } })
    ]

    expect(views[0].getByText('用户订单')).toBeInTheDocument()
    expect(views[1].getByText('优惠券')).toBeInTheDocument()
    expect(views[2].getByText('账户余额')).toBeInTheDocument()
    expect(document.querySelectorAll('img[src^="http"]')).toHaveLength(0)
  })
})
