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

  it('collects the complete API configuration in steps before the final create action', () => {
    expect(source).toContain('<el-steps')
    expect(source).toContain('API 基本信息')
    expect(source).toContain('版本与接口契约')
    expect(source).toContain('运行策略与绑定')
    expect(source).toContain('凭证与授权')
    expect(source).toContain('确认创建')
    expect(source).not.toContain('label="交付 ID"')
    expect(source).not.toContain('label="负责人 ID"')
    expect(source).not.toContain('交付配置仅提交受保护引用与服务端凭证')
    expect(source).not.toContain('已恢复交付')
    expect(source).not.toContain('限流策略（JSON）')
    expect(source).not.toContain('网络策略（JSON）')
    expect(source).not.toContain('添加血缘')
    expect(source).not.toContain('血缘数量')
    expect(source).toContain('buildRateLimitPolicy')
    expect(source).toContain('buildNetworkPolicy')
  })
})
