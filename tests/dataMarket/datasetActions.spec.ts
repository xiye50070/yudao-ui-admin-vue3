import { render, screen } from '@testing-library/vue'
import { ElButton } from 'element-plus'
import { describe, expect, it } from 'vitest'
import DatasetActions from '@/views/dataMarket/dataset/DatasetActions.vue'

describe('dataset primary actions', () => {
  it('hides publish when the operator lacks data-market:dataset:publish', () => {
    render(DatasetActions, {
      global: {
        components: { ElButton },
        directives: {
          hasPermi: {
            mounted(el, binding) {
              if (!binding.value.includes('data-market:dataset:update')) el.remove()
            }
          }
        }
      }
    })

    expect(screen.getByRole('button', { name: '保存数据集' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '发布数据集' })).not.toBeInTheDocument()
  })
})
