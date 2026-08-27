<template>
  <div class="flex items-center justify-between rounded-8px bg-white p-16px">
    <div class="flex items-center gap-10px">
      <Icon icon="ep:list" :size="22" />
      <span class="font-600">用户订单</span>
    </div>
    <span class="text-12px color-#909399">查看全部</span>
  </div>
</template>
<script setup lang="ts">
import { UserOrderProperty } from './config'

/** 用户订单 */
defineOptions({ name: 'UserOrder' })
// 定义属性
defineProps<{ property: UserOrderProperty }>()
</script>

<style scoped lang="scss"></style>
