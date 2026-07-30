<template>
  <el-button
    v-hasPermi="[editing ? 'data-market:dataset:update' : 'data-market:dataset:create']"
    type="primary"
    @click="$emit('save')"
    >保存数据集</el-button
  >
  <el-button v-hasPermi="['data-market:dataset:publish']" type="success" @click="$emit('publish')"
    >发布数据集</el-button
  >
</template>
<script setup lang="ts">
defineProps<{ editing: boolean }>()
defineEmits<{ save: []; publish: [] }>()
</script>
