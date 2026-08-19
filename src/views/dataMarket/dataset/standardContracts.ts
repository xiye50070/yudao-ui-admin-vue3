import type { DataStandardSaveReq, DataStandardType } from '@/api/dataMarket/types'

export const createEmptyStandardDraft = (type: DataStandardType = 'ENUM'): DataStandardSaveReq => ({
  standardCode: '',
  standardName: '',
  standardType: type,
  description: '',
  content:
    type === 'ENUM'
      ? { items: [{ value: '', description: '' }] }
      : type === 'RANGE'
        ? {
            valueType: 'NUMBER',
            lowerBound: '',
            upperBound: '',
            lowerInclusive: true,
            upperInclusive: true,
            unit: '',
            rangeDescription: ''
          }
        : { formatExpression: '', example: '', ruleDescription: '' }
})

export const resetStandardContent = (draft: DataStandardSaveReq, type: DataStandardType) => {
  Object.assign(draft, createEmptyStandardDraft(type), {
    standardCode: draft.standardCode,
    standardName: draft.standardName,
    description: draft.description
  })
}

export const validateStandardDraft = (draft: DataStandardSaveReq): string | undefined => {
  if (!draft.standardCode.trim()) return '请输入标准编码'
  if (!draft.standardName.trim()) return '请输入标准名称'
  if (draft.standardType === 'ENUM') {
    const items = draft.content.items || []
    if (!items.length || items.some((item) => !item.value.trim() || !item.description.trim()))
      return '枚举值和枚举值说明不能为空'
    if (new Set(items.map((item) => item.value.trim())).size !== items.length)
      return '枚举值不能重复'
  }
  if (draft.standardType === 'RANGE') {
    const { valueType, lowerBound, upperBound } = draft.content
    if (!valueType || !lowerBound?.trim() || !upperBound?.trim()) return '请填写完整的区间上下界'
    const lower = valueType === 'NUMBER' ? Number(lowerBound) : Date.parse(lowerBound)
    const upper = valueType === 'NUMBER' ? Number(upperBound) : Date.parse(upperBound)
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower >= upper)
      return '区间下界必须小于上界'
  }
  if (draft.standardType === 'CODING') {
    if (!draft.content.formatExpression?.trim()) return '请输入格式表达式'
    if (!draft.content.ruleDescription?.trim()) return '请输入规则说明'
  }
  return undefined
}
