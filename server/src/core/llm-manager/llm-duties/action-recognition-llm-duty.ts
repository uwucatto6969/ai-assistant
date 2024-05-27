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
  protected readonly systemPrompt: LLMDutyParams['systemPrompt'] = null
  protected readonly name = 'Action Recognition LLM Duty'
  protected input: LLMDutyParams['input'] = null
  protected data = {
    existingContextName: null
  } as ActionRecognitionLLMDutyParams['data']

  constructor(params: ActionRecognitionLLMDutyParams) {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.input = params.input
    this.data = params.data

    const basePrompt = `INTENT MATCHING PROMPT:
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
* If the utterance does not match any of the intents, respond with { "${JSON_KEY_RESPONSE}": "not_found" }.
* Never match a loop intent if the user's utterance does not explicitly mention the intent.`

    if (this.data.existingContextName) {
      this.systemPrompt = `${basePrompt}
* If the utterance is ambiguous and could match multiple intents, consider the context and history of the conversation to disambiguate the intent.
* Remember, it is always better to not match any intent than to match the wrong intent.

CONTEXTUAL DISAMBIGUATION:
When the utterance is ambiguous, consider the following context to disambiguate the intent:
* The history of the conversation. Review the previous messages to understand the context.
* Do not be creative to match the intent. Instead, you should only consider: the user's utterance, the context of the conversation, and the history of the conversation.

By considering the context, you should be able to resolve the ambiguity and respond with the most probable intent.`
    } else {
      this.systemPrompt = basePrompt
    }
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const prompt = `Utterance: "${this.input}"`
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

        const history = await LLM_MANAGER.loadHistory(
          CONVERSATION_LOGGER,
          session,
          { nbOfLogsToLoad: 8 }
        )

        session.setChatHistory(history)

        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session,
          maxTokens: context.contextSize
        })
      } else {
        completionResult = await LLM_PROVIDER.prompt(prompt, completionParams)
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
