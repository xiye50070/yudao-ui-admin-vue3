import { render, screen } from '@testing-library/vue'
import { ElButton } from 'element-plus'
import { describe, expect, it } from 'vitest'
import DatasetActions from '@/views/dataMarket/dataset/DatasetActions.vue'
import { hasPermi } from '@/directives/permission/hasPermi'
import { useUserStoreWithOut } from '@/store/modules/user'

describe('dataset primary actions', () => {
  it('allows a create-only operator to save a new dataset but hides publish', () => {
    useUserStoreWithOut().permissions = new Set(['data-market:dataset:create'])
    render(DatasetActions, {
      props: { editing: false },
      global: {
        components: { ElButton },
        plugins: [
          {
            install(app) {
              hasPermi(app)
            }
          }
        ]
      }
    })

    expect(screen.getByRole('button', { name: '保存数据集' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '发布数据集' })).not.toBeInTheDocument()
  })
})
