import type {
  ApplicationBaseInfo,
  ApplicationDatasetDetailVO,
  ApplicationDetailVO,
  ApplicationResourceComponentVO,
  ProcessingAdvancedSettings
} from '@/api/dataMarket/types'

export interface DetailDescription {
  label: string
  value: string
}

export interface OrdinaryDatasetPresentation {
  key: string
  dataset: ApplicationDatasetDetailVO
}

export interface MasterComponentPresentation {
  componentKey: string
  displayName: string
  levelCode: 'M1' | 'M2'
  levelLabel: string
  componentCategory: 'CORE' | 'RELATION' | 'HISTORY'
  dataset: ApplicationDatasetDetailVO
}

export interface MasterObjectPresentation {
  key: string
  name: string
  code?: string
  versionNo?: number | null
  components: MasterComponentPresentation[]
}

export interface ApplicationResourcePresentation {
  ordinaryDatasets: OrdinaryDatasetPresentation[]
  masterObjects: MasterObjectPresentation[]
}

const snapshotText = (snapshot: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = snapshot[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

const snapshotNumber = (snapshot: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = snapshot[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

const datasetName = (dataset: ApplicationDatasetDetailVO) =>
  snapshotText(dataset.datasetSnapshot, ['businessName', 'name', 'datasetName']) ||
  snapshotText(dataset.datasetSnapshot, ['datasetCode', 'physicalName']) ||
  `数据集 ${dataset.datasetId}`

const normalizeComponentLevel = (
  component: ApplicationResourceComponentVO,
  index: number
): 'M1' | 'M2' => {
  const value = snapshotText(component.componentSnapshot, [
    'levelCode',
    'level',
    'componentLevel',
    'modelLevel'
  ])?.toUpperCase()
  return value === 'M1' || value === 'M2' ? value : index === 0 ? 'M1' : 'M2'
}

const normalizeComponentCategory = (
  component: ApplicationResourceComponentVO,
  levelCode: 'M1' | 'M2'
): 'CORE' | 'RELATION' | 'HISTORY' => {
  const value = snapshotText(component.componentSnapshot, [
    'componentCategory',
    'componentType',
    'type'
  ])?.toUpperCase()
  if (value === 'CORE' || value === 'RELATION' || value === 'HISTORY') return value
  return levelCode === 'M1' ? 'CORE' : 'RELATION'
}

const componentLevelLabel = (
  levelCode: 'M1' | 'M2',
  componentCategory: 'CORE' | 'RELATION' | 'HISTORY'
) => {
  if (levelCode === 'M1') return 'M1 核心'
  return componentCategory === 'HISTORY' ? 'M2 历史' : 'M2 关系'
}

export const buildApplicationResourcePresentation = (
  detail: Pick<ApplicationDetailVO, 'datasets' | 'resourceGroups'>
): ApplicationResourcePresentation => {
  const groups = [...(detail.resourceGroups || [])].sort(
    (left, right) => left.displayOrder - right.displayOrder
  )
  if (!groups.length) {
    return {
      ordinaryDatasets: detail.datasets.map((dataset) => ({
        key: `dataset:${dataset.applicationDatasetId}`,
        dataset
      })),
      masterObjects: []
    }
  }

  const datasetsByApplicationId = new Map(
    detail.datasets.map((dataset) => [dataset.applicationDatasetId, dataset] as const)
  )
  const datasetsById = new Map(
    detail.datasets.map((dataset) => [dataset.datasetId, dataset] as const)
  )
  const masterDatasetApplicationIds = new Set<number>()
  const masterObjects: MasterObjectPresentation[] = groups
    .filter((group) => group.resourceType === 'MASTER_OBJECT')
    .map((group) => {
      const components = [...group.components]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .flatMap<MasterComponentPresentation>((component, index) => {
          const dataset = datasetsByApplicationId.get(component.applicationDatasetId)
          if (!dataset) return []
          masterDatasetApplicationIds.add(dataset.applicationDatasetId)
          const levelCode = normalizeComponentLevel(component, index)
          const componentCategory = normalizeComponentCategory(component, levelCode)
          return [
            {
              componentKey: component.componentKey,
              displayName:
                snapshotText(component.componentSnapshot, [
                  'displayName',
                  'componentName',
                  'name'
                ]) || datasetName(dataset),
              levelCode,
              levelLabel: componentLevelLabel(levelCode, componentCategory),
              componentCategory,
              dataset
            }
          ]
        })
      return {
        key: `master:${group.id}`,
        name:
          snapshotText(group.resourceSnapshot, ['objectName', 'name']) ||
          `主数据对象 ${group.resourceId}`,
        code: snapshotText(group.resourceSnapshot, ['objectCode', 'code']),
        versionNo: group.resourceVersionNo ?? snapshotNumber(group.resourceSnapshot, ['versionNo']),
        components
      }
    })

  const ordinaryDatasetIds = new Set<number>()
  const ordinaryDatasets: OrdinaryDatasetPresentation[] = []
  const addOrdinaryDataset = (dataset: ApplicationDatasetDetailVO | undefined) => {
    if (!dataset || masterDatasetApplicationIds.has(dataset.applicationDatasetId)) return
    if (ordinaryDatasetIds.has(dataset.applicationDatasetId)) return
    ordinaryDatasetIds.add(dataset.applicationDatasetId)
    ordinaryDatasets.push({ key: `dataset:${dataset.applicationDatasetId}`, dataset })
  }
  groups
    .filter((group) => group.resourceType === 'DATASET')
    .forEach((group) => addOrdinaryDataset(datasetsById.get(group.resourceId)))
  detail.datasets.forEach(addOrdinaryDataset)

  return { ordinaryDatasets, masterObjects }
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
