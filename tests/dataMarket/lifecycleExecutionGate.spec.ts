import { describe, expect, it } from 'vitest'
import { getLifecycleExecutionBlockReason } from '@/views/dataMarket/lifecycle/validation'

describe('lifecycle execution gate', () => {
  it('allows only an approved application whose lifecycle request is waiting for execution', () => {
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'EFFECTUATING',
        executionStatus: 'PENDING'
      })
    ).toBeUndefined()
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'IMPACT_REVIEW',
        executionStatus: 'IMPACT_REVIEW'
      })
    ).toBeUndefined()
  })

  it('allows the approved deactivation state returned by the backend', () => {
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'IMPACT_REVIEW',
        executionStatus: 'PENDING'
      })
    ).toBeUndefined()
  })

  it('blocks unapproved applications and lifecycle requests that are already scheduled or executed', () => {
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'IN_APPROVAL',
        executionStatus: 'PENDING'
      })
    ).toBe('申请尚未审批通过，不能执行')
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'EFFECTUATING',
        executionStatus: 'SUCCEEDED'
      })
    ).toBe('生命周期申请已执行或正在执行，不能重复执行')
    expect(
      getLifecycleExecutionBlockReason({
        applicationStatus: 'EFFECTUATING',
        executionStatus: 'SCHEDULED'
      })
    ).toBe('生命周期申请已执行或正在执行，不能重复执行')
  })
})
