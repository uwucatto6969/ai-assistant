import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'
import { Network } from '@sdk/network'

export const run: ActionFunction = async function (params) {
  console.log('params', params)
  let textToTranslate = null
  let targetLanguage = null

  for (const currentEntity of params.current_entities) {
    if (currentEntity.entity === 'text_to_parse') {
      textToTranslate = currentEntity.resolution.value
    }
    if (currentEntity.entity === 'language') {
      targetLanguage = currentEntity.resolution.value
    }
  }

  if (!textToTranslate) {
    // TODO: handle error
    return
  }
  if (!targetLanguage) {
    // TODO: handle error
    return
  }

  const network = new Network({
    baseURL: `${process.env['LEON_HOST']}:${process.env['LEON_PORT']}/api/v1`
  })

  /**
   * TODO: create SDK methods to handle request and response for every LLM duty
   */
  const response = await network.request({
    url: '/llm-inference',
    method: 'POST',
    data: {
      dutyType: 'translation',
      input: textToTranslate,
      data: {
        target: targetLanguage,
        autoDetectLanguage: true
      }
    }
  })

  console.log('response', response)

  await leon.answer({
    key: 'translate',
    data: {
      output: response.data.output.translation
    }
  })
}
