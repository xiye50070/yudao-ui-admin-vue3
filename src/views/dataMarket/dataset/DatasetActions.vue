<template>
  <el-button v-hasPermi="['data-market:dataset:update']" type="primary" @click="$emit('save')"
    >保存数据集</el-button
  >
  <el-button v-hasPermi="['data-market:dataset:publish']" type="success" @click="$emit('publish')"
    >发布数据集</el-button
  >
</template>
<script setup lang="ts">
defineEmits<{ save: []; publish: [] }>()
</script>
