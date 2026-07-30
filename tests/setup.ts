import '@testing-library/jest-dom/vitest'
import { setActivePinia } from 'pinia'
import { store } from '@/store'
;(globalThis as typeof globalThis & { useI18n?: () => { t: (key: string) => string } }).useI18n =
  () => ({
    t: (key: string) => key
  })

setActivePinia(store)
