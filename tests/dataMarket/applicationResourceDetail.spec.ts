import { defineComponent } from 'vue'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import ApplicationResourceDetail from '@/views/dataMarket/application/ApplicationResourceDetail.vue'

const CollapseItemStub = defineComponent({
  props: ['title'],
  template: '<section><h4>{{ title }}</h4><slot name="title" /><slot /></section>'
})

describe('application approval resource detail', () => {
  it('renders ordinary datasets separately from one grouped master-data object', () => {
    const view = render(ApplicationResourceDetail, {
      props: {
        detail: {
          datasets: [
            {
              applicationDatasetId: 1,
              datasetId: 101,
              datasetSnapshot: { businessName: '测试数据集', datasetCode: 'TEST' },
              fields: []
            },
            {
              applicationDatasetId: 2,
              datasetId: 201,
              datasetSnapshot: {
                businessName: '测试人员信息数据集',
                datasetCode: 'test_employee'
              },
              fields: []
            },
            {
              applicationDatasetId: 3,
              datasetId: 202,
              datasetSnapshot: {
                businessName: '测试家庭信息数据集',
                datasetCode: 'test_family'
              },
              fields: []
            }
          ],
          resourceGroups: [
            {
              id: 11,
              resourceType: 'DATASET',
              resourceId: 101,
              resourceVersionNo: null,
              resourceSnapshot: {},
              displayOrder: 1,
              components: []
            },
            {
              id: 12,
              resourceType: 'MASTER_OBJECT',
              resourceId: 7,
              resourceVersionNo: 3,
              resourceSnapshot: { objectName: '人员信息主数据', objectCode: 'EMPLOYEE' },
              displayOrder: 2,
              components: [
                {
                  masterComponentId: 71,
                  componentKey: 'employee',
                  applicationDatasetId: 2,
                  componentSnapshot: {
                    displayName: '测试人员信息数据集',
                    levelCode: 'M1',
                    componentCategory: 'CORE'
                  },
                  requestedFieldIds: [],
                  automaticFieldIds: [],
                  displayOrder: 1
                },
                {
                  masterComponentId: 72,
                  componentKey: 'family',
                  applicationDatasetId: 3,
                  componentSnapshot: {
                    displayName: '测试家庭信息数据集',
                    levelCode: 'M2',
                    componentCategory: 'RELATION'
                  },
                  requestedFieldIds: [],
                  automaticFieldIds: [],
                  displayOrder: 2
                }
              ]
            }
          ]
        }
      },
      global: {
        stubs: {
          ElCollapse: { template: '<div><slot /></div>' },
          ElCollapseItem: CollapseItemStub,
          ElTable: { template: '<div><slot /></div>' },
          ElTableColumn: true,
          ElTag: { template: '<span><slot /></span>' }
        }
      }
    })

    expect(view.getByText('普通数据集')).toBeInTheDocument()
    expect(view.getByText('主数据对象')).toBeInTheDocument()
    expect(view.getByText('人员信息主数据')).toBeInTheDocument()
    expect(view.getByText('M1 核心')).toBeInTheDocument()
    expect(view.getByText('M2 关系')).toBeInTheDocument()
  })
})
