<template>
  <div class="grid grid-cols-3 gap-8px rounded-8px bg-white p-16px text-center">
    <div>
      <strong class="block">--</strong>
      <span class="text-12px color-#909399">账户余额</span>
    </div>
    <div>
      <strong class="block">--</strong>
      <span class="text-12px color-#909399">积分</span>
    </div>
    <div>
      <strong class="block">--</strong>
      <span class="text-12px color-#909399">成长值</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UserWalletProperty } from './config'

/** 用户资产 */
defineOptions({ name: 'UserWallet' })
// 定义属性
defineProps<{ property: UserWalletProperty }>()
</script>

<style scoped lang="scss"></style>
