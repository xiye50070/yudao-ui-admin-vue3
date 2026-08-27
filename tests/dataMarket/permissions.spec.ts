import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src/views/dataMarket', relativePath), 'utf8')

describe('data-market management permission contracts', () => {
  it('uses the management application query permission', () => {
    expect(source('application/index.vue')).toContain('data-market:application:management-query')
  })

  it('uses backend delivery and acceptance permissions without UI-only aliases', () => {
    const delivery = source('deliveryWorkbench/index.vue')
    const acceptance = source('acceptanceIssue/index.vue')

    expect(delivery).toContain('data-market:api:create')
    expect(delivery).toContain('data-market:api:version:create')
    expect(delivery).toContain('data-market:api:runtime:update')
    expect(delivery).toContain('data-market:credential:create')
    expect(delivery).not.toContain('data-market:delivery:task:complete')
    expect(delivery).toContain('data-market:acceptance:submit')
    expect(acceptance).toContain('data-market:acceptance:issue-handle')
    expect(delivery).not.toContain('data-market:delivery:api-create')
    expect(acceptance).not.toContain('data-market:acceptance-issue:resolve')
    expect(acceptance).toMatch(/submitApplicationAcceptance\(\s*applicationId\.value/)
    expect(acceptance).not.toContain('submitDeliveryAcceptance(')
    expect(acceptance).not.toContain('请输入交付 ID')
  })

  it('keeps caller-system configuration permissions independent from source-system permissions', () => {
    const callerSystem = source('callerSystem/index.vue')

    expect(callerSystem).toContain('data-market:caller-system:create')
    expect(callerSystem).toContain('data-market:caller-system:update')
    expect(callerSystem).toContain('data-market:caller-system:delete')
    expect(callerSystem).not.toContain('data-market:source-system:')
  })

  it('keeps indicator domains independent from dataset subject-domain permissions', () => {
    const indicatorDomain = source('indicatorDomain/index.vue')

    expect(indicatorDomain).toContain('data-market:indicator-domain:create')
    expect(indicatorDomain).toContain('data-market:indicator-domain:update')
    expect(indicatorDomain).toContain('data-market:indicator-domain:delete')
    expect(indicatorDomain).not.toContain('data-market:domain:')
  })
})
