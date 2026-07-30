import type { ApplicationBaseInfo, ProcessingAdvancedSettings } from '@/api/dataMarket/types'

export interface DetailDescription {
  label: string
  value: string
}

export const describeApplicationBaseInfo = (baseInfo: ApplicationBaseInfo): DetailDescription[] => [
  { label: '申请名称', value: baseInfo.name },
  { label: '申请原因', value: baseInfo.reason },
  { label: '业务场景', value: baseInfo.businessScenario },
  { label: '调用系统', value: baseInfo.callerSystem },
  { label: '调用方负责人', value: baseInfo.callerOwner || '未填写' },
  { label: '使用环境', value: baseInfo.environment },
  { label: '使用开始日期', value: baseInfo.useStartDate },
  { label: '使用结束日期', value: baseInfo.useEndDate || '长期使用' },
  { label: '长期使用', value: baseInfo.longTerm ? '是' : '否' },
  { label: '预计调用频率', value: baseInfo.frequencyType },
  { label: '预计日调用量', value: String(baseInfo.dailyVolume) },
  { label: '预计峰值调用量', value: String(baseInfo.peakVolume) }
]

export const describeProcessingAdvancedSettings = (
  settings?: ProcessingAdvancedSettings
): DetailDescription[] => {
  if (!settings) return []
  const descriptions: DetailDescription[] = []
  if (settings.joins?.length) {
    descriptions.push({
      label: '关联规则',
      value: settings.joins
        .map(
          (join) =>
            `数据集 ${join.leftDatasetId}.字段 ${join.leftFieldId} ${join.joinType} JOIN 数据集 ${join.rightDatasetId}.字段 ${join.rightFieldId}`
        )
        .join('；')
    })
  }
  if (settings.formulas?.length) {
    descriptions.push({
      label: '计算公式',
      value: settings.formulas
        .map(
          (formula) =>
            `${formula.name} = ${formula.expression}${formula.description ? `（${formula.description}）` : ''}`
        )
        .join('；')
    })
  }
  if (settings.groupByFieldIds?.length) {
    descriptions.push({ label: '分组字段', value: settings.groupByFieldIds.join('、') })
  }
  if (settings.aggregations?.length) {
    descriptions.push({
      label: '聚合规则',
      value: settings.aggregations
        .map((aggregation) => {
          const field = aggregation.fieldId ?? '*'
          const expression = aggregation.customExpression || `${aggregation.function}(${field})`
          return `${expression} AS ${aggregation.alias}`
        })
        .join('；')
    })
  }
  return descriptions
}
