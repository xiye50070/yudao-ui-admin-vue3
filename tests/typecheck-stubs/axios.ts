const request = {
  get: <T>(_option: unknown) => Promise.resolve({} as T),
  post: <T>(_option: unknown) => Promise.resolve({} as T),
  postOriginal: <T>(_option: unknown) => Promise.resolve({} as T),
  put: <T>(_option: unknown) => Promise.resolve({} as T),
  delete: <T>(_option: unknown) => Promise.resolve({} as T),
  download: <T>(_option: unknown) => Promise.resolve({} as T)
}

export default request
