import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('master-data management workbench', () => {
  it('uses the logical master-object lifecycle API instead of creating physical wide tables', () => {
    const api = read('src/api/dataMarket/masterData.ts')

    expect(api).toContain('/data-market/management/master-objects')
    expect(api).toContain('/assembly')
    expect(api).toContain('/validation')
    expect(api).toContain('/publish')
    expect(api).toContain('/disable')
  })

  it('selects only published datasets and supports source-system and subject-domain filters', () => {
    const editor = read('src/views/dataMarket/masterData/MasterObjectEditor.vue')

    expect(editor).toContain('SourceSystemSelect')
    expect(editor).toContain('SubjectDomainSelect')
    expect(editor).toContain('publishStatus: 1')
    expect(editor).toContain('从已发布数据集中选择')
  })

  it('shows M1 and M2 composition, join mappings and inherited data standards', () => {
    const editor = read('src/views/dataMarket/masterData/MasterObjectEditor.vue')

    expect(editor).toContain('模型组成')
    expect(editor).toContain('关联字段映射')
    expect(editor).toContain('数据标准')
    expect(editor).toContain('standardBoundFieldCount')
    expect(editor).toContain('已发布版本继续在线')
  })

  it('registers the management page under the backend menu component path', () => {
    const page = read('src/views/dataMarket/masterData/index.vue')

    expect(page).toContain("name: 'DataMarketMasterData'")
    expect(page).toContain('主数据对象')
    expect(page).toContain('MasterObjectEditor')
  })
})
