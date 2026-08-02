import { describe, expect, it } from 'vitest'
import {
  buildReferenceTree,
  buildSubjectDomainParentTree,
  collectBranchIds,
  ensureSelectedReferenceNode,
  filterOwnerUsers,
  formatSourceSystemLabel,
  mergeSourceSystemOptions
} from '@/views/dataMarket/referenceSelectors'

const domains = [
  { id: 1, name: '经营', code: 'BIZ', parentId: 0, sort: 1, status: 0 },
  { id: 2, name: '客户', code: 'CUSTOMER', parentId: 1, sort: 1, status: 0 },
  { id: 3, name: '客户画像', code: 'PORTRAIT', parentId: 2, sort: 1, status: 0 },
  { id: 4, name: '财务', code: 'FIN', parentId: 0, sort: 2, status: 0 }
]

const departments = [
  { id: 10, name: '业务中心', parentId: 0, sort: 1, status: 0 },
  { id: 11, name: '客户部', parentId: 10, sort: 1, status: 0 },
  { id: 12, name: '客户运营组', parentId: 11, sort: 1, status: 0 },
  { id: 20, name: '技术中心', parentId: 0, sort: 2, status: 0 }
]

const users = [
  { id: 101, nickname: '王明', username: 'wangming', deptId: 11, deptName: '客户部' },
  { id: 102, nickname: '李工', username: 'ligong', deptId: 20, deptName: '技术中心' },
  { id: 103, nickname: '赵云', username: 'zhaoyun', deptId: 12, deptName: '客户运营组' }
]

describe('data-market reference selectors', () => {
  it('builds hierarchy and removes the edited domain branch', () => {
    expect(buildSubjectDomainParentTree(domains, 2)).toEqual([
      {
        id: 0,
        name: '顶级主题域',
        children: [
          { id: 1, name: '经营', children: [] },
          { id: 4, name: '财务', children: [] }
        ]
      }
    ])
  })

  it('collects a department and every descendant', () => {
    expect([...collectBranchIds(departments, 10)]).toEqual([10, 11, 12])
    expect(buildReferenceTree(departments)[0].children[0].children[0].id).toBe(12)
  })

  it('combines department range and user text search while retaining the selected user', () => {
    expect(
      filterOwnerUsers(users, departments, { deptId: 10, keyword: 'wang' }).map((user) => user.id)
    ).toEqual([101])
    expect(
      filterOwnerUsers(users, departments, {
        deptId: 10,
        keyword: '技术',
        selectedUserId: 102
      }).map((user) => user.id)
    ).toEqual([102])
  })

  it('adds a readable placeholder for an unavailable saved reference', () => {
    expect(ensureSelectedReferenceNode([], 99)).toEqual([
      { id: 99, name: '已停用或不可见', disabled: true, children: [] }
    ])
  })

  it('formats and de-duplicates source-system options by id', () => {
    expect(formatSourceSystemLabel({ id: 1, name: '客户系统', code: 'CRM' })).toBe(
      '客户系统（CRM）'
    )
    expect(
      mergeSourceSystemOptions(
        [{ id: 1, name: '客户系统' }],
        [
          { id: 1, name: '客户系统', code: 'CRM' },
          { id: 2, name: '财务系统', code: 'FIN' }
        ]
      )
    ).toEqual([
      { id: 1, name: '客户系统', code: 'CRM' },
      { id: 2, name: '财务系统', code: 'FIN' }
    ])
  })
})
