import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  acceptanceStatusLabel,
  formatApiEndpoint,
  formatTimestamp,
  prettyJson
} from '@/views/dataMarket/deliveryHistory/presentation'

describe('delivered API history presentation', () => {
  it('formats history statuses, endpoints and timestamps', () => {
    expect(acceptanceStatusLabel('PENDING_ACCEPTANCE')).toBe('待验收')
    expect(acceptanceStatusLabel('ACCEPTED')).toBe('已验收')
    expect(formatApiEndpoint('GET', '/api/v1/customer')).toBe('GET /api/v1/customer')
    expect(formatTimestamp(null)).toBe('—')
    expect(formatTimestamp(0)).toBe('—')
  })

  it('formats JSON safely for read-only display', () => {
    expect(prettyJson({ enabled: true })).toContain('"enabled": true')
    expect(prettyJson(null)).toBe('—')
  })

  it('keeps the history page read-only and excludes raw secret fields', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/views/dataMarket/deliveryHistory/index.vue'),
      'utf8'
    )
    expect(source).toContain('getDeliveredApiHistoryPage')
    expect(source).toContain('getDeliveredApiHistoryDetail')
    expect(source).toContain('secretMasked')
    expect(source).not.toContain('createDeliveredApi')
    expect(source).not.toContain('createApiVersion')
    expect(source).not.toContain('appSecret')
    expect(source).not.toContain('secretCiphertext')
  })
})
