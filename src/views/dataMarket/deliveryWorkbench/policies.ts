export type RateLimitUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY'

export type RateLimitPolicyDraft = {
  quota: number
  unit: RateLimitUnit
}

export type NetworkAccessMode = 'ALL' | 'CIDR_ALLOWLIST'

export type NetworkPolicyDraft = {
  accessMode: NetworkAccessMode
  allowedCidrs: string[]
}

const RATE_LIMIT_KEYS: Record<RateLimitUnit, string> = {
  SECOND: 'requestsPerSecond',
  MINUTE: 'requestsPerMinute',
  HOUR: 'requestsPerHour',
  DAY: 'requestsPerDay'
}

const isValidIpv4Cidr = (value: string) => {
  const [address, prefix, ...rest] = value.split('/')
  if (rest.length || prefix === undefined) return false
  const octets = address.split('.')
  return (
    octets.length === 4 &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255) &&
    /^\d{1,2}$/.test(prefix) &&
    Number(prefix) <= 32
  )
}

const isValidIpv6Cidr = (value: string) => {
  const [address, prefix, ...rest] = value.split('/')
  return (
    !rest.length &&
    prefix !== undefined &&
    address.includes(':') &&
    /^[0-9a-f:]+$/i.test(address) &&
    /^\d{1,3}$/.test(prefix) &&
    Number(prefix) <= 128
  )
}

export const buildRateLimitPolicy = ({ quota, unit }: RateLimitPolicyDraft) => {
  if (!Number.isInteger(quota) || quota <= 0) throw new Error('限流额度必须是大于 0 的整数')
  return { [RATE_LIMIT_KEYS[unit]]: quota }
}

export const buildNetworkPolicy = ({ accessMode, allowedCidrs }: NetworkPolicyDraft) => {
  if (accessMode === 'ALL') return { allowCidrs: [] as string[] }
  const normalizedCidrs = [...new Set(allowedCidrs.map((item) => item.trim()).filter(Boolean))]
  if (
    !normalizedCidrs.length ||
    normalizedCidrs.some((item) => !isValidIpv4Cidr(item) && !isValidIpv6Cidr(item))
  ) {
    throw new Error('请填写合法的 CIDR 网段，例如 10.0.0.0/8')
  }
  return { allowCidrs: normalizedCidrs }
}
