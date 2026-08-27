<template>
  <div class="flex items-center justify-between rounded-8px bg-white p-16px">
    <div class="flex items-center gap-10px">
      <Icon icon="ep:ticket" :size="22" />
      <span class="font-600">优惠券</span>
    </div>
    <span class="text-12px color-#909399">暂无可用</span>
  </div>
</template>
<script setup lang="ts">
import { UserCouponProperty } from './config'

/** 用户卡券 */
defineOptions({ name: 'UserCoupon' })
// 定义属性
defineProps<{ property: UserCouponProperty }>()
</script>

<style scoped lang="scss"></style>
