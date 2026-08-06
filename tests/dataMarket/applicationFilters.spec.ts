import { describe, expect, it } from 'vitest'
import {
  buildApplicantCascadeOptions,
  formatApplicantName,
  getApplicationStatusLabel,
  parseApplicantNodeValue
} from '@/views/dataMarket/application/filters'

const departments = [
  { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
  { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 }
]

const users = [
  { id: 10, nickname: '王明', username: 'wangming', deptId: 11, status: 0 },
  { id: 12, nickname: '李工', username: 'ligong', deptId: 10, status: 1 }
]

describe('application management filter helpers', () => {
  it('namespaces equal department and user ids while keeping departments as navigation nodes', () => {
    const options = buildApplicantCascadeOptions(departments, users)

    expect(options[0]).toMatchObject({ value: 'dept:10', label: '业务中心' })
    expect(options[0].disabled).toBeUndefined()
    expect(options[0].children).toEqual([
      { value: 'user:12', label: '李工（ligong）', disabled: true },
      {
        value: 'dept:11',
        label: '客户部',
        children: [{ value: 'user:10', label: '王明（wangming）' }]
      }
    ])
  })

  it('only parses a concrete user leaf into the backend applicant id', () => {
    expect(parseApplicantNodeValue('dept:10')).toBeUndefined()
    expect(parseApplicantNodeValue('user:10')).toBe(10)
    expect(parseApplicantNodeValue('user:invalid')).toBeUndefined()
    expect(parseApplicantNodeValue(undefined)).toBeUndefined()
  })

  it('formats readable applicant names and unavailable user fallback', () => {
    expect(formatApplicantName(users[0], 10)).toBe('王明（wangming）')
    expect(formatApplicantName({ id: 13, nickname: '赵云' }, 13)).toBe('赵云')
    expect(formatApplicantName(undefined, 99)).toBe('用户 #99')
    expect(formatApplicantName(undefined, undefined)).toBe('-')
  })

  it('uses the approved business label for configuring applications', () => {
    expect(getApplicationStatusLabel('CONFIGURING')).toBe('Pending delivery（待交付）')
    expect(getApplicationStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('retains an unavailable selected applicant as a disabled fallback leaf', () => {
    expect(buildApplicantCascadeOptions([], [], 99)).toEqual([
      { value: 'user:99', label: '用户 #99（不可用）', disabled: true }
    ])
  })
})
