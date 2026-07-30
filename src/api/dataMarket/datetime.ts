export const toEpochMillis = (value: number | string | undefined): number | undefined => {
  if (value === undefined || typeof value === 'number') return value
  const epochMillis = Date.parse(value)
  if (Number.isNaN(epochMillis)) throw new Error('日期时间格式不合法')
  return epochMillis
}
