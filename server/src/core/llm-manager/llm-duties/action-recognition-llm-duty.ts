import type { LlamaChatSession, LlamaContext } from 'node-llama-cpp'

import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { CONVERSATION_LOGGER, LLM_MANAGER, LLM_PROVIDER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'
import { LLMProviders, LLMDuties } from '@/core/llm-manager/types'
import { LLM_PROVIDER as LLM_PROVIDER_NAME } from '@/constants'

export interface ActionRecognitionLLMDutyParams extends LLMDutyParams {
  data: {
    existingContextName: string | null
  }
}

const JSON_KEY_RESPONSE = 'intent_name'

export class ActionRecognitionLLMDuty extends LLMDuty {
  private static instance: ActionRecognitionLLMDuty
  private static context: LlamaContext = null as unknown as LlamaContext
  private static session: LlamaChatSession = null as unknown as LlamaChatSession
  protected readonly systemPrompt: LLMDutyParams['systemPrompt'] = null
  protected readonly name = 'Action Recognition LLM Duty'
  protected input: LLMDutyParams['input'] = null
  protected data = {
    existingContextName: null
  } as ActionRecognitionLLMDutyParams['data']

  constructor(params: ActionRecognitionLLMDutyParams) {
    super()

    if (!ActionRecognitionLLMDuty.instance) {
      LogHelper.title(this.name)
      LogHelper.success('New instance')

      ActionRecognitionLLMDuty.instance = this
    }

    this.input = params.input
    this.data = params.data

    this.systemPrompt = `INTENT MATCHING PROMPT:
You are tasked with matching user utterances to their corresponding intents. Your goal is to identify the most probable intent from a given utterance, considering the context of the conversation when necessary.
Once you have identified the intent, you must check again according to the sample whether the intent is correct or not.
It is better to not match any intent than to match the wrong intent.

INTENT FORMAT:
The intent format is "{domain}.{skill}.{action}", for example, "food_drink.advisor.suggest".

INTENT LIST:
The valid intents are listed below. You must only respond with one of the intents from this list. Do not generate new intents.

${LLM_MANAGER.llmActionsClassifierContent}

RESPONSE GUIDELINES:
* If the utterance matches one of the intents, respond with the corresponding intent in the format "{domain}.{skill}.{action}".
* If the utterance does not match any of the intents, respond with { "${JSON_KEY_RESPONSE}": "not_found" }. Do not make up new intents by yourself.`
  }

  public async init(): Promise<void> {
    if (LLM_PROVIDER_NAME === LLMProviders.Local) {
      if (
        !ActionRecognitionLLMDuty.context ||
        !ActionRecognitionLLMDuty.session
      ) {
        ActionRecognitionLLMDuty.context =
          await LLM_MANAGER.model.createContext({
            threads: LLM_THREADS
          })

        const { LlamaChatSession } = await Function(
          'return import("node-llama-cpp")'
        )()

        ActionRecognitionLLMDuty.session = new LlamaChatSession({
          contextSequence: ActionRecognitionLLMDuty.context.getSequence(),
          systemPrompt: this.systemPrompt
        }) as LlamaChatSession
      }
    }
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      let prompt = `Utterance: "${this.input}"`

      if (this.data.existingContextName) {
        prompt += `\nPrevious intent context: "${this.data.existingContextName}"`
      } else {
        prompt += '\nPrevious intent context: no context provided.'
      }

      const completionParams = {
        dutyType: LLMDuties.ActionRecognition,
        systemPrompt: this.systemPrompt as string,
        data: {
          [JSON_KEY_RESPONSE]: {
            type: 'string'
          }
        }
      }
      let completionResult

      if (LLM_PROVIDER_NAME === LLMProviders.Local) {
        const history = await LLM_MANAGER.loadHistory(
          CONVERSATION_LOGGER,
          ActionRecognitionLLMDuty.session,
          { nbOfLogsToLoad: 8 }
        )

        ActionRecognitionLLMDuty.session.setChatHistory(history)

        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session: ActionRecognitionLLMDuty.session,
          maxTokens: ActionRecognitionLLMDuty.context.contextSize
        })
      } else {
        completionResult = await LLM_PROVIDER.prompt(prompt, completionParams)
      }

      if (
        completionResult?.output &&
        typeof completionResult.output === 'object' &&
        completionResult.output[JSON_KEY_RESPONSE]
      ) {
        ;(completionResult.output[JSON_KEY_RESPONSE] as string) = (
          completionResult.output[JSON_KEY_RESPONSE] as string
        ).toLowerCase()
      }

      LogHelper.title(this.name)
      LogHelper.success('Duty executed')
      LogHelper.success(`Prompt — ${prompt}`)
      LogHelper.success(`Output — ${JSON.stringify(completionResult?.output)}`)

      return completionResult as unknown as LLMDutyResult
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)
    }

    return null
  }
}
