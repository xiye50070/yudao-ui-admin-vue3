import type { SourceSystemVO } from '@/api/dataMarket/types'

export interface FlatReference {
  id?: number
  name: string
  parentId: number
  sort?: number
  status?: number
}

export interface ReferenceNode {
  id: number
  name: string
  disabled?: boolean
  children: ReferenceNode[]
}

export interface OwnerUserReference {
  id: number
  nickname?: string
  username?: string
  deptId?: number
  deptName?: string
}

export interface SourceSystemOption {
  id: number
  name: string
  code?: string
  status?: number
}

export const collectBranchIds = (items: FlatReference[], rootId?: number): Set<number> => {
  if (rootId === undefined) return new Set()
  const childrenByParent = new Map<number, number[]>()
  items.forEach((item) => {
    if (item.id === undefined) return
    const children = childrenByParent.get(item.parentId) || []
    children.push(item.id)
    childrenByParent.set(item.parentId, children)
  })

  const ids = new Set<number>()
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    if (ids.has(id)) continue
    ids.add(id)
    queue.push(...(childrenByParent.get(id) || []))
  }
  return ids
}

export const buildReferenceTree = (
  items: FlatReference[],
  excludedRootId?: number
): ReferenceNode[] => {
  const excluded = collectBranchIds(items, excludedRootId)
  const rows = items
    .filter(
      (item): item is FlatReference & { id: number } =>
        item.id !== undefined && !excluded.has(item.id)
    )
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
  const nodes = new Map<number, ReferenceNode>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        ...(row.status !== undefined && row.status !== 0 ? { disabled: true } : {}),
        children: []
      }
    ])
  )
  const roots: ReferenceNode[] = []
  rows.forEach((row) => {
    const node = nodes.get(row.id)!
    const parent = nodes.get(row.parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

export const buildSubjectDomainParentTree = (
  items: FlatReference[],
  excludedRootId?: number
): ReferenceNode[] => [
  {
    id: 0,
    name: '顶级主题域',
    children: buildReferenceTree(items, excludedRootId)
  }
]

const containsNode = (nodes: ReferenceNode[], id: number): boolean =>
  nodes.some((node) => node.id === id || containsNode(node.children, id))

export const ensureSelectedReferenceNode = (
  nodes: ReferenceNode[],
  selectedId?: number,
  fallbackName = '已停用或不可见'
): ReferenceNode[] => {
  if (selectedId === undefined || containsNode(nodes, selectedId)) return nodes
  return [{ id: selectedId, name: fallbackName, disabled: true, children: [] }, ...nodes]
}

export const filterOwnerUsers = <T extends OwnerUserReference>(
  users: T[],
  departments: FlatReference[],
  options: { deptId?: number; keyword?: string; selectedUserId?: number } = {}
): T[] => {
  const deptIds =
    options.deptId === undefined ? undefined : collectBranchIds(departments, options.deptId)
  const keyword = options.keyword?.trim().toLocaleLowerCase() || ''
  return users.filter((user) => {
    if (user.id === options.selectedUserId) return true
    if (deptIds && (user.deptId === undefined || !deptIds.has(user.deptId))) return false
    if (!keyword) return true
    return [user.nickname, user.username, user.deptName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(keyword))
  })
}

export const formatSourceSystemLabel = (item: SourceSystemOption): string =>
  item.code ? `${item.name}（${item.code}）` : item.name

export const mergeSourceSystemOptions = (
  current: SourceSystemOption[],
  incoming: Array<SourceSystemOption | SourceSystemVO>
): SourceSystemOption[] => {
  const map = new Map<number, SourceSystemOption>()
  ;[...current, ...incoming].forEach((item) => {
    if (!item.id) return
    map.set(item.id, {
      id: item.id,
      name: item.name,
      ...(item.code ? { code: item.code } : {}),
      ...(item.status !== undefined ? { status: item.status } : {})
    })
  })
  return [...map.values()]
}
