import request from '@/config/axios'

export interface SimpleProcessDefinitionVO {
  id: string
  name: string
  key: string
}

export const getProcessDefinition = async (id?: string, key?: string) => {
  return await request.get({
    url: '/bpm/process-definition/get',
    params: { id, key }
  })
}

export const getProcessDefinitionPage = async (params) => {
  return await request.get({
    url: '/bpm/process-definition/page',
    params
  })
}

export const getProcessDefinitionList = async (params) => {
  return await request.get({
    url: '/bpm/process-definition/list',
    params
  })
}

export const getSimpleProcessDefinitionList = async (): Promise<SimpleProcessDefinitionVO[]> => {
  return await request.get({
    url: '/bpm/process-definition/simple-list'
  })
}
