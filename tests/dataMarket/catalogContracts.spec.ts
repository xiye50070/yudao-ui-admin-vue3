import { describe, expect, it } from 'vitest'
import { createEmptyDatasetField } from '@/views/dataMarket/dataset/contracts'

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
})
