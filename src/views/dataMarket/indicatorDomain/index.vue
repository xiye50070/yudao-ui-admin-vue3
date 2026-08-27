<template>
  <DataMarketManagementPage
    page-key="indicator-domain"
    title="指标领域"
    description="独立维护指标目录的业务领域，不与数据集市主题域混用"
    icon="ep:collection-tag"
    tone="teal"
  >
    <template #actions>
      <el-tooltip content="刷新指标领域" placement="bottom">
        <el-button :loading="loading" aria-label="刷新指标领域" @click="loadDomains">
          <Icon v-if="!loading" icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-button
        v-hasPermi="['data-market:indicator-domain:create']"
        type="primary"
        @click="openCreate"
      >
        <Icon icon="ep:plus" />新增指标领域
      </el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:collection-tag" /></span>
        <span class="dm-summary-item__content">
          <small>领域总数</small>
          <strong>{{ summary.total }}</strong>
        </span>
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span>
        <span class="dm-summary-item__content">
          <small>已启用</small>
          <strong>{{ summary.enabled }}</strong>
        </span>
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-close" /></span>
        <span class="dm-summary-item__content">
          <small>已停用</small>
          <strong>{{ summary.disabled }}</strong>
        </span>
      </div>
    </template>

    <section class="dm-panel indicator-domain-panel">
      <el-result
        v-if="loadError"
        icon="warning"
        title="指标领域加载失败"
        sub-title="暂时无法获取指标领域，请稍后重试"
      >
        <template #extra>
          <el-button type="primary" @click="loadDomains">重新加载</el-button>
        </template>
      </el-result>

      <template v-else>
        <header class="dm-panel__header indicator-domain-toolbar">
          <div>
            <h2>领域列表</h2>
            <p>指标领域为独立、扁平的业务分类，共 {{ domains.length }} 条</p>
          </div>
          <div class="indicator-domain-filters">
            <el-input
              v-model="filters.keyword"
              clearable
              aria-label="搜索指标领域"
              placeholder="搜索名称、编码或说明"
            >
              <template #prefix><Icon icon="ep:search" /></template>
            </el-input>
            <el-select
              v-model="filters.status"
              clearable
              aria-label="按状态筛选"
              placeholder="全部状态"
            >
              <el-option label="启用" :value="0" />
              <el-option label="停用" :value="1" />
            </el-select>
          </div>
        </header>

        <el-skeleton v-if="loading && !loaded" :rows="6" animated />
        <el-table
          v-else
          v-loading="loading"
          :data="filteredDomains"
          :empty-text="domains.length ? '暂无匹配的指标领域' : '暂无指标领域'"
          row-key="id"
          table-layout="fixed"
        >
          <el-table-column label="指标领域" min-width="260">
            <template #default="{ row }">
              <div class="domain-identity">
                <span class="domain-identity__mark">{{ row.name.slice(0, 1) }}</span>
                <span class="domain-identity__text">
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.description || '暂无说明' }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="领域编码" min-width="180">
            <template #default="{ row }">
              <code class="domain-code">{{ row.code }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="90" align="center" />
          <el-table-column label="状态" width="108" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>
                {{ row.status === 0 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['data-market:indicator-domain:update']"
                link
                type="primary"
                aria-label="编辑"
                @click="openEdit(row)"
              >
                <Icon icon="ep:edit-pen" />编辑
              </el-button>
              <el-button
                v-hasPermi="['data-market:indicator-domain:delete']"
                link
                type="danger"
                @click="removeDomain(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </section>
  </DataMarketManagementPage>

  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    :aria-label="drawerTitle"
    size="min(560px, 92vw)"
    destroy-on-close
  >
    <div class="drawer-intro">
      <span><Icon icon="ep:collection-tag" /></span>
      <div>
        <strong>{{ form.id ? '维护指标业务分类' : '创建指标业务分类' }}</strong>
        <p>领域仅用于组织指标目录，不建立上下级，也不与数据集市主题域复用。</p>
      </div>
    </div>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="领域名称" prop="name">
        <el-input v-model="form.name" maxlength="128" placeholder="请输入指标领域名称" />
      </el-form-item>
      <el-form-item label="领域编码" prop="code">
        <el-input v-model="form.code" maxlength="64" placeholder="例如 IND_FINANCE" />
      </el-form-item>
      <div class="drawer-form-grid">
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="0"
            :inactive-value="1"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </div>
      <el-form-item label="领域说明">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          placeholder="说明该领域覆盖的指标范围"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button :loading="saving" type="primary" @click="saveDomain">保存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as IndicatorApi from '@/api/dataMarket/indicator'
import type { IndicatorDomainVO } from '@/api/dataMarket/indicator'
import { useMessage } from '@/hooks/web/useMessage'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketIndicatorDomain' })

const message = useMessage()
const domains = ref<IndicatorDomainVO[]>([])
const loading = ref(false)
const loaded = ref(false)
const loadError = ref(false)
const filters = reactive<{ keyword: string; status?: number }>({
  keyword: '',
  status: undefined
})

const summary = computed(() => ({
  total: domains.value.length,
  enabled: domains.value.filter((item) => item.status === 0).length,
  disabled: domains.value.filter((item) => item.status !== 0).length
}))

const filteredDomains = computed(() => {
  const keyword = filters.keyword.trim().toLocaleLowerCase()
  return domains.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      [item.name, item.code, item.description].some((value) =>
        value?.toLocaleLowerCase().includes(keyword)
      )
    return matchesKeyword && (filters.status === undefined || item.status === filters.status)
  })
})

const loadDomains = async () => {
  loading.value = true
  loadError.value = false
  try {
    domains.value = (await IndicatorApi.getIndicatorDomainList()) || []
    loaded.value = true
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const emptyDomain = (): IndicatorDomainVO => ({
  code: '',
  name: '',
  description: '',
  sort: 0,
  status: 0
})

const drawerVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<IndicatorDomainVO>(emptyDomain())
const drawerTitle = computed(() => (form.id ? '编辑指标领域' : '新增指标领域'))
const rules: FormRules<IndicatorDomainVO> = {
  name: [{ required: true, message: '请输入领域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入领域编码', trigger: 'blur' }]
}

const openCreate = () => {
  Object.assign(form, emptyDomain(), { id: undefined })
  drawerVisible.value = true
}

const openEdit = (row: IndicatorDomainVO) => {
  Object.assign(form, emptyDomain(), row)
  drawerVisible.value = true
}

const resolveErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const saveDomain = async () => {
  if (saving.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (form.id) await IndicatorApi.updateIndicatorDomain(form.id, { ...form })
    else await IndicatorApi.createIndicatorDomain({ ...form })
    drawerVisible.value = false
    message.success('保存成功')
    await loadDomains()
  } catch (error) {
    message.error(resolveErrorMessage(error, '指标领域保存失败，请重试'))
  } finally {
    saving.value = false
  }
}

const removeDomain = async (row: IndicatorDomainVO) => {
  if (!row.id) return
  try {
    await message.delConfirm()
    await IndicatorApi.deleteIndicatorDomain(row.id)
    message.success('删除成功')
    await loadDomains()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      message.error(resolveErrorMessage(error, '指标领域删除失败，请重试'))
    }
  }
}

onMounted(loadDomains)
</script>

<style scoped lang="scss">
.indicator-domain-panel {
  overflow: hidden;
}

.indicator-domain-toolbar,
.indicator-domain-filters,
.domain-identity,
.drawer-intro,
.drawer-form-grid {
  display: flex;
  align-items: center;
}

.indicator-domain-toolbar h2 {
  margin: 0;
  color: #17233d;
  font-size: 17px;
}

.indicator-domain-toolbar p {
  margin: 5px 0 0;
  color: #7a8799;
  font-size: 12px;
}

.indicator-domain-filters {
  width: min(520px, 58vw);
  gap: 10px;
}

.indicator-domain-filters .el-input {
  flex: 1;
}

.indicator-domain-filters .el-select {
  width: 138px;
}

.domain-identity {
  min-width: 0;
  gap: 12px;
}

.domain-identity__mark {
  display: grid;
  width: 36px;
  height: 36px;
  color: #0d9488;
  background: #ecfdf9;
  border-radius: 10px;
  flex: 0 0 36px;
  font-weight: 700;
  place-items: center;
}

.domain-identity__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.domain-identity__text strong,
.domain-identity__text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-identity__text small {
  color: #7a8799;
}

.domain-code {
  color: #0b6d66;
  font-size: 12px;
  font-weight: 650;
}

.drawer-intro {
  padding: 14px;
  margin-bottom: 20px;
  color: #526071;
  background: #f3fbfa;
  border: 1px solid #d8f1ed;
  border-radius: 10px;
  align-items: flex-start;
  gap: 12px;
}

.drawer-intro > span {
  display: grid;
  width: 34px;
  height: 34px;
  color: #0d9488;
  background: #fff;
  border-radius: 9px;
  flex: 0 0 34px;
  place-items: center;
}

.drawer-intro strong {
  color: #17233d;
}

.drawer-intro p {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.6;
}

.drawer-form-grid {
  align-items: flex-start;
  gap: 18px;
}

.drawer-form-grid .el-form-item {
  flex: 1;
}

@media (max-width: 960px) {
  .indicator-domain-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .indicator-domain-filters {
    width: 100%;
  }
}
</style>
