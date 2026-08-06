import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  resolve(process.cwd(), 'src/views/dataMarket/deliveryWorkbench/index.vue'),
  'utf8'
)

describe('route-driven delivery workbench', () => {
  it('does not ask the administrator to type an application or plan owner id', () => {
    expect(source).not.toContain('label="申请 ID"')
    expect(source).not.toContain('label="负责人 ID" prop="ownerUserId"')
    expect(source).toContain('data-testid="delivery-plan-form"')
    expect(source).toContain('<UserDepartmentSelect')
  })

  it('switches between create-plan and configuration states from the route', () => {
    expect(source).toContain("pageState === 'CREATE_PLAN'")
    expect(source).toContain("pageState === 'CONFIGURE'")
    expect(source).toContain('resolveRouteApplicationId')
    expect(source).toContain('isDeliveryNotFoundError')
  })
})
