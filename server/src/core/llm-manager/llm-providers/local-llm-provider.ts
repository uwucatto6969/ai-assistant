import { LogHelper } from '@/helpers/log-helper'
import { CompletionOptions } from '@/core/llm-manager/types'
import { LLM_MANAGER } from '@/core'

type LocalCompletionOptions = Omit<CompletionOptions, ''>

export default class LocalLLMProvider {
  protected readonly name = 'Local LLM Provider'

  constructor() {
    LogHelper.title(this.name)
    LogHelper.success('New instance')
  }

  public runChatCompletion(
    prompt: string,
    completionOptions: LocalCompletionOptions
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!completionOptions.session) {
          return reject(new Error('Session is not defined'))
        }

        const isJSONMode = completionOptions.data !== null
        let promptParams = {
          maxTokens: completionOptions.maxTokens as number,
          temperature: completionOptions.temperature as number
        }

        if (isJSONMode) {
          const { LlamaJsonSchemaGrammar } = await Function(
            'return import("node-llama-cpp")'
          )()
          const grammar = new LlamaJsonSchemaGrammar(LLM_MANAGER.llama, {
            type: 'object',
            properties: completionOptions.data
          })

          promptParams = {
            ...promptParams,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            grammar
          }
        }

        const promise = completionOptions.session.prompt(prompt, promptParams)

        return resolve(promise)
      } catch (e) {
        LogHelper.title(this.name)
        const errorMessage = `Failed to run completion: ${e}`
        LogHelper.error(errorMessage)
        return reject(new Error(errorMessage))
      }
    })
  }
}
