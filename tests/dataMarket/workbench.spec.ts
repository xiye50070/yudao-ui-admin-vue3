import { describe, expect, it } from 'vitest'
import { APPLICATION_TYPE_OPTIONS, validateDatasetForm } from '@/views/dataMarket/shared'
import CatalogPage from '@/views/dataMarket/catalog/index.vue'
import DomainPage from '@/views/dataMarket/domain/index.vue'
import TagPage from '@/views/dataMarket/tag/index.vue'
import SourceSystemPage from '@/views/dataMarket/sourceSystem/index.vue'
import DatasetPage from '@/views/dataMarket/dataset/index.vue'
import AccessPolicyPage from '@/views/dataMarket/accessPolicy/index.vue'
import accessPolicyPageSource from '@/views/dataMarket/accessPolicy/index.vue?raw'
import MetadataImportPage from '@/views/dataMarket/metadataImport/index.vue'
import WorkflowConfigPage from '@/views/dataMarket/workflowConfig/index.vue'

describe('data market workbench behavior', () => {
  it('maps all lifecycle application types to selectable workflow options', () => {
    expect(APPLICATION_TYPE_OPTIONS).toEqual([
      { label: '新建申请', value: 'CREATE' },
      { label: '变更申请', value: 'CHANGE' },
      { label: '续期申请', value: 'RENEW' },
      { label: '停用申请', value: 'DEACTIVATE' }
    ])
  })

  it('rejects a dataset form without business name and source system', () => {
    expect(validateDatasetForm({ businessName: '', sourceSystemId: undefined })).toEqual({
      businessName: '请输入数据集名称',
      sourceSystemId: '请选择来源系统'
    })
  })

  it('exposes the required component names on the dynamic menu targets', () => {
    expect([
      CatalogPage.name,
      DomainPage.name,
      TagPage.name,
      SourceSystemPage.name,
      DatasetPage.name,
      AccessPolicyPage.name,
      MetadataImportPage.name,
      WorkflowConfigPage.name
    ]).toEqual([
      'DataMarketCatalog',
      'DataMarketDomain',
      'DataMarketTag',
      'DataMarketSourceSystem',
      'DataMarketDataset',
      'DataMarketAccessPolicy',
      'DataMarketMetadataImport',
      'DataMarketWorkflowConfig'
    ])
  })

  it('selects access-policy principals by name and keeps raw IDs out of the table', () => {
    expect(accessPolicyPageSource).toContain('<el-tree-select')
    expect(accessPolicyPageSource).toContain('DeptApi.getSimpleDeptList()')
    expect(accessPolicyPageSource).toContain('RoleApi.getSimpleRoleList()')
    expect(accessPolicyPageSource).toContain('label="主体名称"')
    expect(accessPolicyPageSource).toContain('resolvePrincipalName(row)')
    expect(accessPolicyPageSource).toContain('v-model="row.maxSensitivityLevel"')
    expect(accessPolicyPageSource).not.toContain('label="主体 ID"')
    expect(accessPolicyPageSource).not.toContain('prop="principalId"')
  })
})
