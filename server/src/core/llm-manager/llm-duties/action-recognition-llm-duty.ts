import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, LLM_PROVIDER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'
import { LLMProviders, LLMDuties } from '@/core/llm-manager/types'
import { LLM_PROVIDER as LLM_PROVIDER_NAME } from '@/constants'
import { StringHelper } from '@/helpers/string-helper'

interface ActionRecognitionLLMDutyParams extends LLMDutyParams {}

const JSON_KEY_RESPONSE = 'action_name'
const RANDOM_STR = StringHelper.random(4)

export class ActionRecognitionLLMDuty extends LLMDuty {
  protected readonly systemPrompt = `You are an AI expert in intent classification and matching.
You look up every utterance sample and description. Then you return the most probable intent (action) to be triggered based on a given utterance.
If the intent is not listed, do not make it up yourself. Instead you must return { "${JSON_KEY_RESPONSE}": "not_found" }. Test: ${RANDOM_STR}`
  protected readonly name = 'Action Recognition LLM Duty'
  protected input: LLMDutyParams['input'] = null

  constructor(params: ActionRecognitionLLMDutyParams) {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.input = params.input
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const prompt = `Utterance: "${this.input}"`
      const completionParams = {
        dutyType: LLMDuties.ActionRecognition,
        systemPrompt: this.systemPrompt,
        data: {
          [JSON_KEY_RESPONSE]: {
            type: 'string'
          }
        }
      }
      let completionResult

      if (LLM_PROVIDER_NAME === LLMProviders.Local) {
        const { LlamaChatSession } = await Function(
          'return import("node-llama-cpp")'
        )()

        const context = await LLM_MANAGER.model.createContext({
          threads: LLM_THREADS
        })
        const session = new LlamaChatSession({
          contextSequence: context.getSequence(),
          systemPrompt: completionParams.systemPrompt
        })

        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session,
          maxTokens: context.contextSize
        })
      } else {
        completionResult = await LLM_PROVIDER.prompt(prompt, completionParams)
      }

      LogHelper.title(this.name)
      LogHelper.success(`Duty executed: ${JSON.stringify(completionResult)}`)

      return completionResult as unknown as LLMDutyResult
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)
    }

    return null
  }
}
