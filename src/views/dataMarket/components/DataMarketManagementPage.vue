<template>
  <main
    class="dm-management-page"
    :class="`dm-management-page--${tone}`"
    :aria-labelledby="headingId"
  >
    <section class="dm-page-hero">
      <div class="dm-page-hero__identity">
        <span class="dm-page-hero__icon" aria-hidden="true">
          <Icon :icon="icon" />
        </span>
        <div>
          <p v-if="eyebrow" class="dm-page-hero__eyebrow">{{ eyebrow }}</p>
          <h1 :id="headingId">{{ title }}</h1>
          <p class="dm-page-hero__description">{{ description }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="dm-page-hero__actions">
        <slot name="actions"></slot>
      </div>
    </section>

    <section v-if="$slots.summary" class="dm-page-summary" :aria-label="`${title}概览`">
      <slot name="summary"></slot>
    </section>

    <div class="dm-management-page__body">
      <slot></slot>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    pageKey: string
    title: string
    description: string
    icon: string
    eyebrow?: string
    tone?: 'blue' | 'teal' | 'amber'
  }>(),
  {
    eyebrow: '数据市场管理',
    tone: 'blue'
  }
)

const headingId = computed(() => `data-market-${props.pageKey}-title`)
</script>

<style scoped lang="scss">
.dm-management-page {
  --dm-accent: #1677ff;
  --dm-accent-rgb: 22 119 255;
  --dm-accent-soft: #edf5ff;

  min-height: calc(100vh - 150px);
  padding: 16px;
  color: #17233d;
  background:
    radial-gradient(circle at 92% 2%, rgb(var(--dm-accent-rgb) / 5%), transparent 280px), #f5f7fa;

  &--teal {
    --dm-accent: #0d9488;
    --dm-accent-rgb: 13 148 136;
    --dm-accent-soft: #ecfdf9;
  }

  &--amber {
    --dm-accent: #d97706;
    --dm-accent-rgb: 217 119 6;
    --dm-accent-soft: #fff8e8;
  }
}

.dm-page-hero,
.dm-page-summary,
.dm-management-page__body :deep(.dm-panel) {
  background: rgb(255 255 255 / 96%);
  border: 1px solid #e3e9f1;
  box-shadow: 0 4px 18px rgb(23 35 61 / 4%);
}

.dm-page-hero {
  position: relative;
  display: flex;
  min-height: 108px;
  padding: 20px 24px;
  overflow: hidden;
  border-radius: 12px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  &::after {
    position: absolute;
    top: -72px;
    right: -48px;
    width: 220px;
    height: 220px;
    pointer-events: none;
    background: radial-gradient(circle, rgb(var(--dm-accent-rgb) / 9%), transparent 68%);
    content: '';
  }
}

.dm-page-hero__identity {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;

  h1 {
    margin: 0;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 27px;
    font-weight: 720;
    line-height: 1.25;
    letter-spacing: -0.5px;
    color: #0c2b57;
  }
}

.dm-page-hero__icon {
  display: grid;
  width: 52px;
  height: 52px;
  font-size: 24px;
  color: var(--dm-accent);
  background: var(--dm-accent-soft);
  border: 1px solid rgb(var(--dm-accent-rgb) / 12%);
  border-radius: 14px;
  box-shadow: inset 0 0 0 6px rgb(255 255 255 / 40%);
  flex: 0 0 52px;
  place-items: center;
}

.dm-page-hero__eyebrow {
  margin: 0 0 3px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 1.4px;
  color: var(--dm-accent);
}

.dm-page-hero__description {
  margin: 6px 0 0;
  font-size: 14px;
  color: #637083;
}

.dm-page-hero__actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  :deep(.el-button) {
    min-height: 40px;
  }

  :deep(.el-button--primary) {
    padding-inline: 18px;
    box-shadow: 0 7px 15px rgb(var(--dm-accent-rgb) / 18%);
  }
}

.dm-page-summary {
  display: grid;
  padding: 14px 0;
  margin-top: 14px;
  border-radius: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.dm-page-summary :deep(.dm-summary-item) {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 58px;
  padding: 4px 24px;
  align-items: center;
  gap: 14px;

  &::after {
    position: absolute;
    top: 8px;
    right: 0;
    bottom: 8px;
    width: 1px;
    background: #e7ebf1;
    content: '';
  }

  &:last-child::after {
    display: none;
  }
}

.dm-page-summary :deep(.dm-summary-item__icon) {
  display: grid;
  width: 46px;
  height: 46px;
  font-size: 21px;
  color: var(--dm-accent);
  background: var(--dm-accent-soft);
  border-radius: 13px;
  flex: 0 0 46px;
  place-items: center;
}

.dm-page-summary :deep(.dm-summary-item__content) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  small {
    font-size: 13px;
    color: #637083;
  }

  strong {
    font-size: 24px;
    font-weight: 720;
    line-height: 1;
    color: #0c2b57;
  }
}

.dm-management-page__body {
  display: grid;
  margin-top: 14px;
  gap: 14px;
}

.dm-management-page__body :deep(.dm-panel) {
  min-width: 0;
  padding: 18px;
  border-radius: 10px;
}

.dm-management-page__body :deep(.dm-panel--flush) {
  padding: 0;
}

.dm-management-page__body :deep(.dm-panel__header) {
  display: flex;
  min-height: 42px;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 680;
    color: #20314d;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #8a96a8;
  }
}

.dm-management-page__body :deep(.dm-toolbar) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dm-management-page__body :deep(.dm-filter-grid) {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.dm-management-page__body :deep(.dm-table-wrap) {
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 9px;

  .el-table__header th.el-table__cell {
    height: 46px;
    font-weight: 650;
    color: #43516a;
    background: #f5f7fa;
  }

  .el-table__row td.el-table__cell {
    height: 64px;
    color: #33415c;
  }

  .el-table__row:hover > td.el-table__cell {
    background: #f8fbff;
  }

  .el-table::before {
    display: none;
  }

  .el-table__empty-block {
    min-height: 260px;
  }
}

.dm-management-page__body :deep(.dm-entity-cell) {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.dm-management-page__body :deep(.dm-entity-mark) {
  display: grid;
  width: 40px;
  height: 40px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 720;
  color: var(--dm-accent);
  text-transform: uppercase;
  background: var(--dm-accent-soft);
  border: 1px solid rgb(var(--dm-accent-rgb) / 12%);
  border-radius: 10px;
  flex: 0 0 40px;
  place-items: center;
}

.dm-management-page__body :deep(.dm-entity-copy) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-weight: 650;
    color: #24344f;
  }

  small {
    font-size: 12px;
    color: #8a96a8;
  }
}

.dm-management-page__body :deep(.dm-code) {
  display: inline-flex;
  max-width: 100%;
  padding: 5px 9px;
  overflow: hidden;
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  color: #34547f;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f2f6fb;
  border: 1px solid #e2e9f2;
  border-radius: 6px;
}

.dm-management-page__body :deep(.dm-secondary) {
  margin-top: 4px;
  font-size: 12px;
  color: #8a96a8;
}

.dm-management-page__body :deep(.dm-row-actions) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0;
}

.dm-management-page__body :deep(.dm-load-result) {
  min-height: 320px;
  padding-top: 54px;
}

@media (width <= 900px) {
  .dm-management-page {
    padding: 12px;
  }

  .dm-page-hero {
    padding: 18px;
  }

  .dm-page-hero__identity h1 {
    font-size: 24px;
  }

  .dm-management-page__body :deep(.dm-panel__header) {
    align-items: flex-start;
    flex-direction: column;
  }

  .dm-management-page__body :deep(.dm-toolbar) {
    width: 100%;
    align-items: stretch;
    flex-wrap: wrap;
  }
}

@media (width <= 640px) {
  .dm-page-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .dm-page-hero__actions {
    width: 100%;
    justify-content: stretch;

    :deep(.el-button--primary) {
      flex: 1;
    }
  }

  .dm-page-summary {
    padding: 4px 0;
    grid-template-columns: 1fr;
  }

  .dm-page-summary :deep(.dm-summary-item) {
    padding-block: 12px;

    &::after {
      inset: auto 18px 0;
      width: auto;
      height: 1px;
    }
  }

  .dm-management-page__body :deep(.dm-panel) {
    padding: 14px;
  }
}
</style>
