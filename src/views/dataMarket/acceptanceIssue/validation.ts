export const canResubmitAcceptance = (issues: Array<{ status: string }>) =>
  issues.length > 0 && issues.every((issue) => issue.status === 'RESOLVED' || issue.status === 'CLOSED')
