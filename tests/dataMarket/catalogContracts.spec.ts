import { describe, expect, it } from 'vitest'
import {
  createEmptyDatasetField,
  toDatasetFieldSaveReq
} from '@/views/dataMarket/dataset/contracts'
import {
  createEmptyStandardDraft,
  validateStandardDraft
} from '@/views/dataMarket/dataset/standardContracts'

describe('data-market catalog editor contracts', () => {
  it('creates a field row with every backend-required property', () => {
    expect(createEmptyDatasetField(42)).toEqual({
      datasetId: 42,
      fieldCode: '',
      fieldName: '',
      dataType: 'varchar',
      businessDescription: '',
      nullable: true,
      primaryKey: false,
      joinKey: false,
      sensitivityLevel: 1,
      status: 0,
      metadataVersion: '',
      displayOrder: 1
    })
  })

  it('never sends a field standard back through ordinary bulk field editing', () => {
    const field = {
      ...createEmptyDatasetField(42),
      id: 8,
      standard: {
        id: 31,
        standardCode: 'EMPLOYEE_STATUS',
        standardName: '员工状态',
        standardType: 'ENUM' as const,
        summary: '1：在职',
        updateTime: '2026-08-19T12:00:00',
        associatedDatasetCount: 1,
        associatedFieldCount: 1
      }
    }

    expect(toDatasetFieldSaveReq(field)).not.toHaveProperty('datasetId')
    expect(toDatasetFieldSaveReq(field)).not.toHaveProperty('standard')
  })

  it('creates and validates all three typed standard drafts', () => {
    const enumDraft = createEmptyStandardDraft('ENUM')
    enumDraft.standardCode = 'EMPLOYEE_STATUS'
    enumDraft.standardName = '员工状态'
    enumDraft.content.items = [{ value: '1', description: '在职' }]
    expect(validateStandardDraft(enumDraft)).toBeUndefined()

    const rangeDraft = createEmptyStandardDraft('RANGE')
    rangeDraft.standardCode = 'EMPLOYEE_AGE'
    rangeDraft.standardName = '员工年龄'
    Object.assign(rangeDraft.content, { valueType: 'NUMBER', lowerBound: '18', upperBound: '65' })
    expect(validateStandardDraft(rangeDraft)).toBeUndefined()

    const codingDraft = createEmptyStandardDraft('CODING')
    codingDraft.standardCode = 'EMPLOYEE_NO'
    codingDraft.standardName = '员工编号'
    Object.assign(codingDraft.content, {
      formatExpression: '^EMP-[0-9]{6}$',
      ruleDescription: 'EMP 加六位数字'
    })
    expect(validateStandardDraft(codingDraft)).toBeUndefined()
    codingDraft.content.ruleDescription = ''
    expect(validateStandardDraft(codingDraft)).toContain('规则说明')
  })
})
