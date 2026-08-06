import { describe, expect, it } from 'vitest'
import {
  buildNetworkPolicy,
  buildRateLimitPolicy,
  type NetworkPolicyDraft,
  type RateLimitPolicyDraft
} from '@/views/dataMarket/deliveryWorkbench/policies'

describe('delivery runtime policy builders', () => {
  it.each([
    ['SECOND', 'requestsPerSecond'],
    ['MINUTE', 'requestsPerMinute'],
    ['HOUR', 'requestsPerHour'],
    ['DAY', 'requestsPerDay']
  ] as const)('maps the %s quota selection to the backend policy key', (unit, key) => {
    const draft: RateLimitPolicyDraft = { quota: 120, unit }

    expect(buildRateLimitPolicy(draft)).toEqual({ [key]: 120 })
  })

  it('builds an unrestricted network policy without asking for JSON', () => {
    const draft: NetworkPolicyDraft = { accessMode: 'ALL', allowedCidrs: [] }

    expect(buildNetworkPolicy(draft)).toEqual({ allowCidrs: [] })
  })

  it('normalizes and de-duplicates CIDR allowlist entries', () => {
    const draft: NetworkPolicyDraft = {
      accessMode: 'CIDR_ALLOWLIST',
      allowedCidrs: [' 10.0.0.0/8 ', '10.0.0.0/8', '2001:db8::/32']
    }

    expect(buildNetworkPolicy(draft)).toEqual({
      allowCidrs: ['10.0.0.0/8', '2001:db8::/32']
    })
  })

  it('rejects an allowlist without a valid CIDR entry', () => {
    expect(() =>
      buildNetworkPolicy({ accessMode: 'CIDR_ALLOWLIST', allowedCidrs: ['10.0.0.1'] })
    ).toThrow('请填写合法的 CIDR 网段')
  })
})
