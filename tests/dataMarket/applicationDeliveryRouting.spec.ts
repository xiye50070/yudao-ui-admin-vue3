import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  resolve(process.cwd(), 'src/views/dataMarket/application/index.vue'),
  'utf8'
)

describe('application delivery routing', () => {
  it('opens an application from its number and routes delivery creation to the hidden workbench', () => {
    expect(source).toContain('`application-no-${row.id}`')
    expect(source).toContain("name: 'DataMarketDeliveryWorkbench'")
    expect(source).toContain('query: { applicationId: String(detail.value.id) }')
    expect(source).not.toContain('deliveryVisible')
    expect(source).not.toContain('负责人 ID')
  })

  it('keeps legacy cleaning rules read-only and hides the empty section', () => {
    expect(source).toContain('v-if="detail.cleaningRules?.length"')
    expect(source).toContain('历史清洗规则（只读）')
  })
})
