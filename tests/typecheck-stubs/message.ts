export const useMessage = () => ({
  info: (_message: string) => undefined,
  error: (_message: string) => undefined,
  success: (_message: string) => undefined,
  warning: (_message: string) => undefined,
  confirm: (_message: string) => Promise.resolve(),
  delConfirm: () => Promise.resolve()
})
