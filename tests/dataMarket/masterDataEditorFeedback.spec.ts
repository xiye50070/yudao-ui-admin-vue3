import { defineComponent } from 'vue'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MasterObjectEditor from '@/views/dataMarket/masterData/MasterObjectEditor.vue'

const catalogApi = vi.hoisted(() => ({
  getSubjectDomainList: vi.fn(),
  getSourceSystemPage: vi.fn(),
  getDatasetFields: vi.fn(),
  getDatasetPage: vi.fn()
}))
const masterApi = vi.hoisted(() => ({
  getMasterObject: vi.fn(),
  createMasterObject: vi.fn(),
  updateMasterObject: vi.fn(),
  saveMasterAssembly: vi.fn(),
  validateMasterObject: vi.fn(),
  publishMasterObject: vi.fn()
}))

vi.mock('@/api/dataMarket/catalog', () => catalogApi)
vi.mock('@/api/dataMarket/masterData', () => masterApi)
vi.mock('@/hooks/web/useMessage', () => ({
  useMessage: () => ({ success: vi.fn(), warning: vi.fn() })
}))

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: { modelValue: Boolean },
  template: '<section><slot name="header"/><slot/><slot name="footer"/></section>'
})
const DialogStub = defineComponent({
  name: 'Dialog',
  props: { modelValue: Boolean },
  template: '<section v-if="modelValue" role="dialog"><slot/><slot name="footer"/></section>'
})
const ButtonStub = defineComponent({
  name: 'ElButton',
  props: { disabled: Boolean },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot/></button>'
})
const CardStub = defineComponent({
  name: 'ElCard',
  template: '<section><header><slot name="header"/></header><slot/></section>'
})
const AlertStub = defineComponent({
  name: 'ElAlert',
  props: { title: String, type: String },
  template: '<div role="alert" :data-type="type">{{ title }}</div>'
})
const PaginationStub = defineComponent({
  name: 'Pagination',
  template: '<nav data-testid="candidate-pagination-control" />'
})

const passiveStubs = {
  ElTabs: { template: '<div><slot/></div>' },
  ElTabPane: { template: '<section><slot/></section>' },
  ElForm: { template: '<form><slot/></form>' },
  ElFormItem: { template: '<div><slot/></div>' },
  ElDescriptions: { template: '<div><slot/></div>' },
  ElDescriptionsItem: { template: '<div><slot/></div>' },
  ElTable: { template: '<div><slot/></div>' },
  ElTableColumn: true,
  ElIcon: { template: '<i><slot/></i>' },
  ElInput: true,
  ElSelect: true,
  ElOption: true,
  ElRadioGroup: true,
  ElRadioButton: true,
  ElTag: { template: '<span><slot/></span>' },
  ElEmpty: true,
  ElTimeline: true,
  ElTimelineItem: true,
  SourceSystemSelect: true,
  SubjectDomainSelect: true
}

const detail = {
  id: 1,
  objectCode: 'EMPLOYEE',
  objectName: '人员信息主数据',
  subjectDomainId: 1,
  description: '',
  status: 'DRAFT',
  activeVersionId: 11,
  draftVersionId: 11,
  versionNo: 1,
  versionStatus: 'DRAFT',
  hasDraft: true,
  lockVersion: 0,
  components: [
    {
      id: 101,
      componentKey: 'employee',
      datasetId: 201,
      levelCode: 'M1',
      componentCategory: 'CORE',
      displayName: '人员信息',
      businessGrain: '一条记录代表一个人',
      displayOrder: 1,
      datasetName: '测试人员信息数据集',
      fieldCount: 2,
      standardBoundFieldCount: 0
    },
    {
      id: 102,
      componentKey: 'family',
      datasetId: 202,
      levelCode: 'M2',
      componentCategory: 'RELATION',
      displayName: '家庭信息',
      businessGrain: '一条记录代表一位亲属',
      displayOrder: 2,
      datasetName: '测试家庭信息数据集',
      fieldCount: 2,
      standardBoundFieldCount: 0
    }
  ],
  relations: [
    {
      id: 301,
      parentComponentId: 101,
      childComponentId: 102,
      parentComponentKey: 'employee',
      childComponentKey: 'family',
      relationName: '人员-家庭',
      cardinality: 'ONE_TO_MANY',
      displayOrder: 1,
      fieldMappings: []
    }
  ],
  versions: []
}

function renderEditor() {
  return render(MasterObjectEditor, {
    props: { modelValue: true, objectId: 1 },
    global: {
      directives: { hasPermi: {}, loading: {} },
      stubs: {
        ...passiveStubs,
        ElDrawer: DrawerStub,
        ElButton: ButtonStub,
        ElCard: CardStub,
        ElAlert: AlertStub,
        Dialog: DialogStub,
        Pagination: PaginationStub
      }
    }
  })
}

describe('master-data editor screenshot feedback', () => {
  beforeEach(() => {
    catalogApi.getSubjectDomainList.mockReset().mockResolvedValue([])
    catalogApi.getSourceSystemPage.mockReset().mockResolvedValue({ list: [], total: 0 })
    catalogApi.getDatasetFields.mockReset().mockResolvedValue([])
    catalogApi.getDatasetPage.mockReset().mockResolvedValue({ list: [], total: 0 })
    masterApi.getMasterObject.mockReset().mockResolvedValue(detail)
    masterApi.saveMasterAssembly.mockReset().mockResolvedValue(true)
    masterApi.validateMasterObject.mockReset().mockResolvedValue({
      errors: [],
      warnings: [
        { code: 'STANDARD', message: '部分启用字段尚未绑定数据标准' },
        { code: 'JOIN_KEY', message: '关联字段未全部标记为主键或关联键' }
      ],
      errorCodes: [],
      warningCodes: ['STANDARD', 'JOIN_KEY']
    })
  })

  it('persists the visible M1/M2 assembly before validating the draft', async () => {
    const view = renderEditor()
    await waitFor(() => expect(masterApi.getMasterObject).toHaveBeenCalledWith(1))

    await fireEvent.click(view.getByRole('button', { name: '校验' }))

    expect(masterApi.saveMasterAssembly).toHaveBeenCalledTimes(1)
    expect(masterApi.saveMasterAssembly).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        components: expect.arrayContaining([
          expect.objectContaining({ componentKey: 'employee', levelCode: 'M1' }),
          expect.objectContaining({ componentKey: 'family', levelCode: 'M2' })
        ])
      })
    )
    expect(masterApi.saveMasterAssembly.mock.invocationCallOrder[0]).toBeLessThan(
      masterApi.validateMasterObject.mock.invocationCallOrder[0]
    )
  })

  it('shows an error-free response with warnings as passed guidance', async () => {
    const view = renderEditor()
    await waitFor(() => expect(masterApi.getMasterObject).toHaveBeenCalledWith(1))

    await fireEvent.click(view.getByRole('button', { name: '校验' }))

    expect(await view.findByRole('alert')).toHaveTextContent('结构校验通过：2 条提醒')
    expect(view.queryByText('结构校验失败：0 个问题')).not.toBeInTheDocument()
  })

  it('keeps candidate pagination in a normal-flow dialog footer row', async () => {
    const view = renderEditor()
    await waitFor(() => expect(masterApi.getMasterObject).toHaveBeenCalledWith(1))

    await fireEvent.click(view.getByRole('button', { name: '从已发布数据集中选择' }))

    const pagination = await view.findByTestId('candidate-pagination-control')
    expect(pagination.parentElement).toHaveClass('candidate-pagination')
  })
})
