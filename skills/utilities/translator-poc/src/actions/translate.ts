import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'
import { Network } from '@sdk/network'

export const run: ActionFunction = async function (params) {
  console.log('params', params)

  const targetLanguage = params.slots.target_language.resolution.value
  const textToTranslate = params.utterance
  const network = new Network({
    baseURL: `${process.env['LEON_HOST']}:${process.env['LEON_PORT']}/api/v1`
  })

  console.log('targetLanguage', targetLanguage)
  console.log('textToTranslate', textToTranslate)

  /**
   * TODO: create SDK methods to handle request and response for every LLM duty
   */
  /*const response = await network.request({
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

  console.log('response', response)*/

  await leon.answer({
    key: 'translate',
    data: {
      output: `just a test ${targetLanguage} ${textToTranslate}`
      // output: response.data.output.translation
    }
  })
}
