import { describe, expect, it } from 'vitest'

import { exclude } from '../build/vite/optimize'

describe('Vite dependency optimization', () => {
  it('keeps vue3-signature out of Rolldown pre-bundling', () => {
    expect(exclude).toContain('vue3-signature')
  })
})
