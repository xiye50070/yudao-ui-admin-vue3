import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readView = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src/views/dataMarket/dataset', relativePath), 'utf8')

describe('dataset data-standard workbench', () => {
  it('adds the standard entry to the existing dataset operation column', () => {
    const source = readView('index.vue')

    expect(source).toContain('DatasetStandardDrawer')
    expect(source).toContain('data-market:data-standard:query')
    expect(source).toContain('@click="openStandards(row)"')
  })

  it('keeps creation, binding, shared editing and unbinding in one drawer', () => {
    const source = readView('DatasetStandardDrawer.vue')

    expect(source).toContain('选择已有标准')
    expect(source).toContain('新建并绑定')
    expect(source).toContain('编辑共享标准')
    expect(source).toContain('解除绑定')
    expect(source).toContain('标准已创建，但绑定失败，请重试绑定')
    expect(source).toContain('data-market:data-standard:bind')
    expect(source).toContain('data-market:data-standard:create')
    expect(source).toContain('data-market:data-standard:update')
    expect(source).toContain('v-if="canCreateAndBind"')
  })

  it('provides typed editors and warns before changing a shared standard', () => {
    const source = readView('DataStandardEditorDialog.vue')

    expect(source).toContain('枚举值与说明')
    expect(source).toContain('区间范围')
    expect(source).toContain('编码规则')
    expect(source).toContain('保存后所有引用字段将同步更新')
  })
})
