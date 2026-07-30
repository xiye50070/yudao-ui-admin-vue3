import { describe, expect, it } from 'vitest'
import {
  describeApplicationBaseInfo,
  describeProcessingAdvancedSettings
} from '@/views/dataMarket/application/presentation'

describe('application detail presentation', () => {
  it('renders every submitted base-info field with its contract value', () => {
    expect(
      describeApplicationBaseInfo({
        name: '订单核验',
        reason: '用于每日对账',
        businessScenario: '财务结算',
        callerSystem: '财务中台',
        callerOwner: '王工',
        environment: 'PRODUCTION',
        useStartDate: '2026-08-01',
        useEndDate: '2026-12-31',
        longTerm: false,
        frequencyType: 'PER_DAY',
        dailyVolume: 12000,
        peakVolume: 3000
      })
    ).toEqual([
      { label: '申请名称', value: '订单核验' },
      { label: '申请原因', value: '用于每日对账' },
      { label: '业务场景', value: '财务结算' },
      { label: '调用系统', value: '财务中台' },
      { label: '调用方负责人', value: '王工' },
      { label: '使用环境', value: 'PRODUCTION' },
      { label: '使用开始日期', value: '2026-08-01' },
      { label: '使用结束日期', value: '2026-12-31' },
      { label: '长期使用', value: '否' },
      { label: '预计调用频率', value: 'PER_DAY' },
      { label: '预计日调用量', value: '12000' },
      { label: '预计峰值调用量', value: '3000' }
    ])
  })

  it('renders each advanced processing setting rather than collapsing it into an opaque object', () => {
    expect(
      describeProcessingAdvancedSettings({
        joins: [
          {
            leftDatasetId: 1,
            leftFieldId: 11,
            rightDatasetId: 2,
            rightFieldId: 21,
            joinType: 'LEFT'
          }
        ],
        formulas: [{ name: 'total', expression: 'amount * tax', description: '含税金额' }],
        groupByFieldIds: [11, 21],
        aggregations: [
          { fieldId: 31, function: 'SUM', alias: 'amount_sum' },
          { function: 'COUNT', alias: 'record_count' }
        ]
      })
    ).toEqual([
      { label: '关联规则', value: '数据集 1.字段 11 LEFT JOIN 数据集 2.字段 21' },
      { label: '计算公式', value: 'total = amount * tax（含税金额）' },
      { label: '分组字段', value: '11、21' },
      { label: '聚合规则', value: 'SUM(31) AS amount_sum；COUNT(*) AS record_count' }
    ])
  })
})
