import { describe, expect, it } from 'vitest'
import {
  buildApplicationResourcePresentation,
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

  it('separates ordinary datasets and groups M1/M2 components under one master-data object', () => {
    const ordinary = {
      applicationDatasetId: 1,
      datasetId: 101,
      datasetSnapshot: { businessName: '测试数据集', datasetCode: 'TEST' },
      fields: []
    }
    const employee = {
      applicationDatasetId: 2,
      datasetId: 201,
      datasetSnapshot: { businessName: '测试人员信息数据集', datasetCode: 'test_employee' },
      fields: []
    }
    const family = {
      applicationDatasetId: 3,
      datasetId: 202,
      datasetSnapshot: { businessName: '测试家庭信息数据集', datasetCode: 'test_family' },
      fields: []
    }

    const result = buildApplicationResourcePresentation({
      datasets: [ordinary, employee, family],
      resourceGroups: [
        {
          id: 11,
          resourceType: 'DATASET',
          resourceId: 101,
          resourceVersionNo: null,
          resourceSnapshot: { businessName: '测试数据集', datasetCode: 'TEST' },
          displayOrder: 1,
          components: []
        },
        {
          id: 12,
          resourceType: 'MASTER_OBJECT',
          resourceId: 7,
          resourceVersionNo: 3,
          resourceSnapshot: {
            objectName: '人员信息主数据',
            objectCode: 'EMPLOYEE',
            versionNo: 3
          },
          displayOrder: 2,
          components: [
            {
              masterComponentId: 71,
              componentKey: 'employee',
              applicationDatasetId: 2,
              componentSnapshot: {
                displayName: '测试人员信息数据集',
                levelCode: 'M1',
                componentCategory: 'CORE'
              },
              requestedFieldIds: [21],
              automaticFieldIds: [],
              displayOrder: 1
            },
            {
              masterComponentId: 72,
              componentKey: 'family',
              applicationDatasetId: 3,
              componentSnapshot: {
                displayName: '测试家庭信息数据集',
                levelCode: 'M2',
                componentCategory: 'RELATION'
              },
              requestedFieldIds: [31],
              automaticFieldIds: [32],
              displayOrder: 2
            }
          ]
        }
      ]
    })

    expect(result.ordinaryDatasets.map((item) => item.dataset.applicationDatasetId)).toEqual([1])
    expect(result.masterObjects).toHaveLength(1)
    expect(result.masterObjects[0]).toMatchObject({
      name: '人员信息主数据',
      code: 'EMPLOYEE',
      versionNo: 3,
      components: [
        { componentKey: 'employee', levelCode: 'M1', levelLabel: 'M1 核心' },
        { componentKey: 'family', levelCode: 'M2', levelLabel: 'M2 关系' }
      ]
    })
  })

  it('treats every dataset as ordinary when an old application has no resource groups', () => {
    const result = buildApplicationResourcePresentation({
      datasets: [
        {
          applicationDatasetId: 1,
          datasetId: 101,
          datasetSnapshot: { businessName: '历史数据集', datasetCode: 'LEGACY' },
          fields: []
        }
      ]
    })

    expect(result.ordinaryDatasets).toHaveLength(1)
    expect(result.masterObjects).toEqual([])
  })
})
