import { describe, expect, it } from 'vitest'
import tagSource from '@/views/dataMarket/tag/index.vue?raw'
import sourceSystemSource from '@/views/dataMarket/sourceSystem/index.vue?raw'
import datasetSource from '@/views/dataMarket/dataset/index.vue?raw'
import metadataImportSource from '@/views/dataMarket/metadataImport/index.vue?raw'
import accessPolicySource from '@/views/dataMarket/accessPolicy/index.vue?raw'
import workflowConfigSource from '@/views/dataMarket/workflowConfig/index.vue?raw'
import applicationSource from '@/views/dataMarket/application/index.vue?raw'
import deliveryHistorySource from '@/views/dataMarket/deliveryHistory/index.vue?raw'
import acceptanceIssueSource from '@/views/dataMarket/acceptanceIssue/index.vue?raw'
import lifecycleSource from '@/views/dataMarket/lifecycle/index.vue?raw'
import callerSystemSource from '@/views/dataMarket/callerSystem/index.vue?raw'
import indicatorDomainSource from '@/views/dataMarket/indicatorDomain/index.vue?raw'
import indicatorSource from '@/views/dataMarket/indicator/index.vue?raw'

const pages = [
  ['标准标签', '统一维护目录筛选维度与标准标签', tagSource],
  ['来源系统', '维护数据来源、责任归属与目录接入状态', sourceSystemSource],
  ['数据集管理', '维护数据资产、字段结构、标准与访问范围', datasetSource],
  ['元数据导入', '通过标准模板批量校验并导入数据目录元数据', metadataImportSource],
  ['访问策略', '按部门或角色配置数据敏感级访问上限', accessPolicySource],
  ['流程配置', '为各类数据申请绑定审批流程', workflowConfigSource],
  ['申请管理', '跟踪数据申请、审批与交付衔接状态', applicationSource],
  ['交付配置', '查询已交付 API 的配置、版本与验收记录', deliveryHistorySource],
  ['验收问题', '跟踪交付验收轮次、问题处理与重新提交', acceptanceIssueSource],
  ['生命周期执行', '执行已审批的数据变更、续期与停用申请', lifecycleSource],
  ['调用系统配置', '维护数据接口调用方及其责任归属', callerSystemSource],
  ['指标领域', '独立维护指标目录的业务领域，不与数据集市主题域混用', indicatorDomainSource],
  ['指标配置', '维护指标定义、说明、领域、标签、状态与访问范围', indicatorSource]
] as const

describe('data-market management page visual coverage', () => {
  it.each(pages)(
    '%s uses the shared business workspace and clear page description',
    (_, description, source) => {
      expect(source).toContain('<DataMarketManagementPage')
      expect(source).toContain(`description="${description}"`)
      expect(source).not.toContain('<ContentWrap')
    }
  )

  it('keeps delivery configuration explicitly read-only on the history page', () => {
    expect(deliveryHistorySource).toContain('只读查询')
    expect(deliveryHistorySource).not.toContain('新建交付')
  })
})
