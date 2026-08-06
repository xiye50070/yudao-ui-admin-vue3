import type { ApplicationStatus } from '@/api/dataMarket/types'

export interface ApplicantDepartmentReference {
  id: number
  name: string
  parentId: number
  sort?: number
  status?: number
}

export interface ApplicantUserReference {
  id: number
  nickname?: string
  username?: string
  deptId?: number
  status?: number
}

export interface ApplicantCascadeOption {
  value: `dept:${number}` | `user:${number}`
  label: string
  disabled?: boolean
  children?: ApplicantCascadeOption[]
}

export const APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
  value: ApplicationStatus
  label: string
}> = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'SUBMITTING', label: '提交中' },
  { value: 'SUBMIT_FAILED', label: '提交失败' },
  { value: 'IN_APPROVAL', label: '审批中' },
  { value: 'RETURNED_SUPPLEMENT', label: '待补充' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'CANCELLED', label: '已撤销' },
  { value: 'CONFIGURING', label: '待交付' },
  { value: 'PENDING_ACCEPTANCE', label: '待验收' },
  { value: 'RECTIFYING', label: '整改中' },
  { value: 'DELIVERED', label: '已交付' },
  { value: 'EFFECTUATING', label: '生效中' },
  { value: 'IMPACT_REVIEW', label: '影响评估' },
  { value: 'SCHEDULED', label: '已调度' },
  { value: 'COMPLETED', label: '已完成' }
]

const statusLabels = new Map<string, string>(
  APPLICATION_STATUS_OPTIONS.map((item) => [item.value, item.label])
)

export const getApplicationStatusLabel = (status: string): string =>
  statusLabels.get(status) || status

export const formatApplicantName = (user?: ApplicantUserReference, userId?: number): string => {
  if (!user) return userId === undefined ? '-' : `用户 #${userId}`
  const name = user.nickname || user.username
  if (!name) return `用户 #${user.id}`
  return user.username && user.username !== name ? `${name}（${user.username}）` : name
}

const toUserOption = (user: ApplicantUserReference): ApplicantCascadeOption => ({
  value: `user:${user.id}`,
  label: formatApplicantName(user, user.id),
  ...(user.status !== undefined && user.status !== 0 ? { disabled: true } : {})
})

export const buildApplicantCascadeOptions = (
  departments: ApplicantDepartmentReference[],
  users: ApplicantUserReference[],
  selectedUserId?: number
): ApplicantCascadeOption[] => {
  const sortedDepartments = [...departments].sort(
    (left, right) => (left.sort || 0) - (right.sort || 0) || left.name.localeCompare(right.name)
  )
  const departmentsByParent = new Map<number, ApplicantDepartmentReference[]>()
  sortedDepartments.forEach((department) => {
    const siblings = departmentsByParent.get(department.parentId) || []
    siblings.push(department)
    departmentsByParent.set(department.parentId, siblings)
  })

  const sortedUsers = [...users].sort((left, right) =>
    formatApplicantName(left, left.id).localeCompare(formatApplicantName(right, right.id))
  )
  const usersByDepartment = new Map<number, ApplicantUserReference[]>()
  const unassignedUsers: ApplicantUserReference[] = []
  const departmentIds = new Set(departments.map((department) => department.id))
  sortedUsers.forEach((user) => {
    if (user.deptId === undefined || !departmentIds.has(user.deptId)) {
      unassignedUsers.push(user)
      return
    }
    const members = usersByDepartment.get(user.deptId) || []
    members.push(user)
    usersByDepartment.set(user.deptId, members)
  })

  const buildDepartment = (
    department: ApplicantDepartmentReference
  ): ApplicantCascadeOption | undefined => {
    const childDepartments = (departmentsByParent.get(department.id) || [])
      .map(buildDepartment)
      .filter((item): item is ApplicantCascadeOption => Boolean(item))
    const children = [
      ...(usersByDepartment.get(department.id) || []).map(toUserOption),
      ...childDepartments
    ]
    if (!children.length) return undefined
    return {
      value: `dept:${department.id}`,
      label: department.name,
      children
    }
  }

  const options = [
    ...(departmentsByParent.get(0) || [])
      .map(buildDepartment)
      .filter((item): item is ApplicantCascadeOption => Boolean(item)),
    ...unassignedUsers.map(toUserOption)
  ]
  if (selectedUserId !== undefined && !users.some((user) => user.id === selectedUserId)) {
    options.unshift({
      value: `user:${selectedUserId}`,
      label: `用户 #${selectedUserId}（不可用）`,
      disabled: true
    })
  }
  return options
}

export const parseApplicantNodeValue = (value?: string): number | undefined => {
  const match = value?.match(/^user:(\d+)$/)
  if (!match) return undefined
  const userId = Number(match[1])
  return Number.isSafeInteger(userId) && userId > 0 ? userId : undefined
}
