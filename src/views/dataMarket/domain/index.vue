<template>
  <main class="domain-management">
    <section class="domain-hero" aria-labelledby="domain-page-title">
      <div>
        <h1 id="domain-page-title">业务主题域</h1>
        <p>维护数据目录的主题分类、层级关系与业务编码</p>
      </div>
      <div class="domain-hero__actions">
        <el-tooltip content="刷新主题域" placement="bottom">
          <el-button
            class="domain-refresh"
            :loading="loading"
            aria-label="刷新主题域"
            @click="getList"
          >
            <Icon v-if="!loading" icon="ep:refresh" />
          </el-button>
        </el-tooltip>
        <el-button
          v-hasPermi="['data-market:domain:create']"
          class="domain-primary-action"
          type="primary"
          @click="openCreate"
        >
          <Icon icon="ep:plus" />新增主题域
        </el-button>
      </div>
    </section>

    <section class="domain-metrics" aria-label="主题域概览">
      <div data-testid="metric-total" class="domain-metric">
        <span class="domain-metric__icon is-total"><Icon icon="ep:collection-tag" /></span>
        <span>
          <small>主题域总数</small>
          <el-skeleton-item
            v-if="loading && !hasSuccessfulLoad"
            class="domain-metric__skeleton"
            variant="text"
          />
          <strong v-else-if="loadError || !hasSuccessfulLoad">—</strong>
          <strong v-else>{{ domainStats.total }}</strong>
        </span>
      </div>
      <div data-testid="metric-enabled" class="domain-metric">
        <span class="domain-metric__icon is-enabled"><Icon icon="ep:circle-check" /></span>
        <span>
          <small>已启用</small>
          <el-skeleton-item
            v-if="loading && !hasSuccessfulLoad"
            class="domain-metric__skeleton"
            variant="text"
          />
          <strong v-else-if="loadError || !hasSuccessfulLoad">—</strong>
          <strong v-else>{{ domainStats.enabled }}</strong>
        </span>
      </div>
      <div data-testid="metric-disabled" class="domain-metric">
        <span class="domain-metric__icon is-disabled"><Icon icon="ep:circle-close" /></span>
        <span>
          <small>已停用</small>
          <el-skeleton-item
            v-if="loading && !hasSuccessfulLoad"
            class="domain-metric__skeleton"
            variant="text"
          />
          <strong v-else-if="loadError || !hasSuccessfulLoad">—</strong>
          <strong v-else>{{ domainStats.disabled }}</strong>
        </span>
      </div>
    </section>

    <section class="domain-content">
      <el-result
        v-if="loadError"
        class="domain-load-error"
        icon="warning"
        title="主题域加载失败"
        sub-title="暂时无法获取主题域数据，请稍后重试"
      >
        <template #extra>
          <el-button type="primary" @click="getList">重新加载</el-button>
        </template>
      </el-result>
      <template v-else>
        <header class="domain-toolbar">
          <div>
            <h2>主题域列表</h2>
            <p data-testid="domain-result-count">
              显示 {{ filteredList.length }} / 共 {{ list.length }} 条
            </p>
          </div>
          <div class="domain-filter-fields">
            <el-input
              v-model="filters.keyword"
              class="domain-search"
              clearable
              aria-label="搜索主题域名称、编码或说明"
              placeholder="搜索主题域名称、编码或说明"
            >
              <template #prefix><Icon icon="ep:search" /></template>
            </el-input>
            <el-select
              v-model="filters.status"
              class="domain-status-filter"
              clearable
              aria-label="按状态筛选"
              placeholder="全部状态"
            >
              <el-option label="启用" :value="0" />
              <el-option label="停用" :value="1" />
            </el-select>
          </div>
        </header>

        <div class="domain-table-wrap">
          <el-table
            v-loading="loading"
            :data="filteredList"
            :empty-text="list.length ? '暂无匹配的主题域' : '暂无主题域'"
            row-key="id"
            table-layout="fixed"
          >
            <el-table-column label="主题域" min-width="260">
              <template #default="{ row }">
                <div class="domain-name-cell">
                  <span class="domain-name-cell__mark" aria-hidden="true">{{
                    row.code.slice(0, 2)
                  }}</span>
                  <span class="domain-name-cell__content">
                    <strong :title="row.name">{{ row.name }}</strong>
                    <small :title="row.description || '暂无说明'">{{
                      row.description || '暂无说明'
                    }}</small>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="主题域编码" min-width="150">
              <template #default="{ row }">
                <span class="domain-code" :title="row.code">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column label="上级主题域" min-width="150">
              <template #default="{ row }">
                <span class="domain-parent" :title="resolveParentName(row.parentId)">
                  <Icon icon="ep:connection" />{{ resolveParentName(row.parentId) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="88" align="center" />
            <el-table-column label="状态" width="108" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>
                  <span class="domain-status-tag">
                    <span aria-hidden="true"></span>{{ row.status === 0 ? '启用' : '停用' }}
                  </span>
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="148" align="right">
              <template #default="{ row }">
                <el-button
                  v-hasPermi="['data-market:domain:update']"
                  link
                  type="primary"
                  @click="edit(row)"
                >
                  <Icon icon="ep:edit-pen" />编辑
                </el-button>
                <el-button
                  v-hasPermi="['data-market:domain:delete']"
                  link
                  type="danger"
                  @click="remove(row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </section>
  </main>

  <Dialog
    v-model="visible"
    :title="form.id ? '编辑主题域' : '新增主题域'"
    width="min(600px, calc(100vw - 32px))"
    align-center
  >
    <div class="domain-dialog-intro">
      <span><Icon icon="ep:collection-tag" /></span>
      <div>
        <strong>{{ form.id ? '完善主题域信息' : '创建新的业务分类' }}</strong>
        <p>主题域用于组织数据目录，编码保存后应保持稳定。</p>
      </div>
    </div>
    <el-form
      ref="formRef"
      class="domain-dialog-form"
      :model="form"
      :rules="rules"
      label-width="110px"
    >
      <el-form-item label="主题域名称" prop="name">
        <el-input v-model="form.name" maxlength="64" placeholder="请输入主题域名称" />
      </el-form-item>
      <el-form-item label="主题域编码" prop="code">
        <el-input v-model="form.code" maxlength="64" placeholder="例如 HR 或 CUSTOMER_DATA" />
      </el-form-item>
      <el-form-item label="上级主题域" prop="parentId">
        <SubjectDomainSelect
          v-model="form.parentId"
          :domains="list"
          :exclude-branch-id="form.id"
          allow-top-level
          placeholder="请选择上级主题域"
        />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sort" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="主题域说明">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="说明该主题域覆盖的业务范围"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :loading="saving" type="primary" @click="save">保存</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { SubjectDomainVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
defineOptions({ name: 'DataMarketDomain' })
const message = useMessage()
const loading = ref(false)
const loadError = ref(false)
const hasSuccessfulLoad = ref(false)
const list = ref<SubjectDomainVO[]>([])
const filters = reactive<{ keyword: string; status?: number }>({ keyword: '', status: undefined })
const domainStats = computed(() => ({
  total: list.value.length,
  enabled: list.value.filter((item) => item.status === 0).length,
  disabled: list.value.filter((item) => item.status !== 0).length
}))
const domainNameMap = computed(
  () => new Map(list.value.map((item) => [item.id, item.name] as const))
)
const resolveParentName = (parentId: number) =>
  parentId === 0 ? '顶级主题域' : domainNameMap.value.get(parentId) || `未找到（ID：${parentId}）`
const filteredList = computed(() => {
  const keyword = filters.keyword.trim().toLocaleLowerCase()
  return list.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      [item.name, item.code, item.description].some((value) =>
        value?.toLocaleLowerCase().includes(keyword)
      )
    const matchesStatus = filters.status === undefined || item.status === filters.status
    return matchesKeyword && matchesStatus
  })
})
const visible = ref(false)
const saving = ref(false)
const formRef = ref<any>()
const form = reactive<SubjectDomainVO>({
  name: '',
  code: '',
  parentId: 0,
  description: '',
  sort: 0,
  status: 0
})
const rules = {
  name: [{ required: true, message: '请输入主题域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入主题域编码', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择上级主题域', trigger: 'change' }]
}
const getList = async () => {
  loading.value = true
  loadError.value = false
  try {
    list.value = (await CatalogApi.getSubjectDomainList()) || []
    hasSuccessfulLoad.value = true
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
const reset = () =>
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    description: '',
    parentId: 0,
    sort: 0,
    status: 0
  })
const openCreate = () => {
  reset()
  visible.value = true
}
const edit = (row: SubjectDomainVO) => {
  Object.assign(form, row)
  visible.value = true
}
const save = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (form.id) await CatalogApi.updateSubjectDomain(form.id, form)
    else await CatalogApi.createSubjectDomain(form)
    visible.value = false
    message.success('保存成功')
    await getList()
  } finally {
    saving.value = false
  }
}
const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteSubjectDomain(id)
  message.success('删除成功')
  getList()
}
onMounted(getList)
</script>

<style scoped lang="scss">
.domain-management {
  min-height: calc(100vh - 150px);
  padding: 16px;
  color: #17233d;
  background: #f5f7fa;
}

.domain-hero,
.domain-metrics,
.domain-content {
  background: #fff;
  border: 1px solid #e3e9f1;
  box-shadow: 0 4px 16px rgb(23 35 61 / 3%);
}

.domain-load-error {
  min-height: 360px;
  padding-top: 72px;
}

.domain-hero {
  display: flex;
  min-height: 104px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 12px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.5px;
    color: #0c2b57;
  }

  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: #637083;
  }
}

.domain-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.domain-refresh {
  width: 42px;
  height: 42px;
  padding: 0;
  font-size: 18px;
}

.domain-primary-action {
  height: 42px;
  padding: 0 20px;
  box-shadow: 0 7px 15px rgb(22 119 255 / 18%);

  :deep(.iconify) {
    margin-right: 6px;
  }
}

.domain-metrics {
  display: grid;
  padding: 14px 0;
  margin-top: 14px;
  border-radius: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.domain-metric {
  position: relative;
  display: flex;
  min-width: 0;
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

  > span:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  small {
    font-size: 14px;
    color: #536074;
  }

  strong {
    font-size: 25px;
    font-weight: 700;
    line-height: 1;
    color: #0c2b57;
  }
}

.domain-metric__icon {
  display: grid;
  width: 50px;
  height: 50px;
  font-size: 23px;
  border-radius: 50%;
  flex: 0 0 50px;
  place-items: center;

  &.is-total {
    color: #1677ff;
    background: #edf5ff;
  }

  &.is-enabled {
    color: #14a36f;
    background: #edf9f4;
  }

  &.is-disabled {
    color: #8491a5;
    background: #f2f4f7;
  }
}

.domain-metric__skeleton {
  width: 36px;
  height: 25px;
}

.domain-content {
  min-height: 420px;
  padding: 18px;
  margin-top: 14px;
  border-radius: 10px;
}

.domain-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 20px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 650;
    color: #20314d;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #8a96a8;
  }
}

.domain-filter-fields {
  display: flex;
  align-items: center;
  gap: 10px;
}

.domain-search {
  width: min(340px, 38vw);

  :deep(.el-input__wrapper) {
    min-height: 38px;
    box-shadow: 0 0 0 1px #dfe5ed inset;
  }
}

.domain-status-filter {
  width: 132px;

  :deep(.el-select__wrapper) {
    min-height: 38px;
    box-shadow: 0 0 0 1px #dfe5ed inset;
  }
}

.domain-table-wrap {
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 9px;

  :deep(.el-table__header th.el-table__cell) {
    height: 46px;
    font-weight: 600;
    color: #43516a;
    background: #f5f7fa;
  }

  :deep(.el-table__row td.el-table__cell) {
    height: 68px;
    color: #33415c;
  }

  :deep(.el-table__row:hover > td.el-table__cell) {
    background: #f8fbff;
  }

  :deep(.el-table::before) {
    display: none;
  }

  :deep(.el-table__empty-block) {
    min-height: 280px;
  }
}

.domain-name-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.domain-name-cell__mark {
  display: grid;
  width: 42px;
  height: 42px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #1677ff;
  text-transform: uppercase;
  background: #edf5ff;
  border: 1px solid #dbeaff;
  border-radius: 10px;
  flex: 0 0 42px;
  place-items: center;
}

.domain-name-cell__content {
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
    font-size: 14px;
    font-weight: 600;
    color: #24344f;
  }

  small {
    font-size: 12px;
    color: #8a96a8;
  }
}

.domain-code {
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

.domain-parent {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: #536074;

  :deep(.iconify) {
    color: #8491a5;
    flex: 0 0 auto;
  }
}

.domain-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  > span {
    width: 6px;
    height: 6px;
    background: currentcolor;
    border-radius: 50%;
  }
}

:deep(.domain-table-wrap .el-button .iconify) {
  margin-right: 4px;
}

.domain-dialog-intro {
  display: flex;
  padding: 14px 16px;
  margin: 0 0 22px;
  background: #f5f9ff;
  border: 1px solid #dceaff;
  border-radius: 9px;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    font-size: 20px;
    color: #1677ff;
    background: #e5f0ff;
    border-radius: 9px;
    flex: 0 0 38px;
    place-items: center;
  }

  strong {
    font-size: 14px;
    color: #24344f;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #718096;
  }
}

.domain-dialog-form {
  padding-right: 12px;

  :deep(.el-input-number),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 38px;
  }
}

@media (width <= 900px) {
  .domain-management {
    padding: 12px;
  }

  .domain-hero {
    min-height: auto;
    align-items: flex-start;
    padding: 18px;
    gap: 18px;

    h1 {
      font-size: 24px;
    }
  }

  .domain-metric {
    padding-inline: 18px;
  }

  .domain-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .domain-filter-fields {
    width: 100%;
  }

  .domain-search {
    width: auto;
    flex: 1;
  }
}

@media (width <= 640px) {
  .domain-hero {
    flex-direction: column;
  }

  .domain-hero__actions {
    width: 100%;
  }

  .domain-primary-action {
    flex: 1;
  }

  .domain-metrics {
    padding: 4px 0;
    grid-template-columns: 1fr;
  }

  .domain-metric {
    padding-block: 12px;

    &::after {
      inset: auto 18px 0;
      width: auto;
      height: 1px;
    }
  }

  .domain-filter-fields {
    align-items: stretch;
    flex-direction: column;
  }

  .domain-status-filter {
    width: 100%;
  }

  .domain-content {
    padding: 14px;
  }
}
</style>
