import { beforeEach, describe, expect, it, vi } from 'vitest'

const { request } = vi.hoisted(() => ({
  request: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}))
vi.mock('@/config/axios', () => ({ default: request }))

import * as DeliveryApi from '@/api/dataMarket/delivery'
import { canResubmitAcceptance } from '@/views/dataMarket/acceptanceIssue/validation'
import { validateLifecycleExecution } from '@/views/dataMarket/lifecycle/validation'

describe('admin acceptance and lifecycle workbench contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads existing acceptance rounds by delivery without inventing a management list endpoint', () => {
    DeliveryApi.getDeliveryAcceptanceRounds(51)

    expect(request.get).toHaveBeenCalledWith({
      url: '/data-market/deliveries/51/acceptance-rounds'
    })
  })

  it('allows resubmission only after every reported issue is resolved or closed', () => {
    expect(canResubmitAcceptance([{ status: 'RESOLVED' }, { status: 'CLOSED' }])).toBe(true)
    expect(canResubmitAcceptance([{ status: 'OPEN' }])).toBe(false)
    expect(canResubmitAcceptance([])).toBe(false)
  })

  it('requires a target version for a change execution but not for renewal', () => {
    expect(
      validateLifecycleExecution({ applicationType: 'CHANGE', targetApiVersionId: undefined })
    ).toEqual({ targetApiVersionId: '变更申请必须关联目标版本' })
    expect(
      validateLifecycleExecution({ applicationType: 'RENEW', targetApiVersionId: undefined })
    ).toEqual({})
  })
})
