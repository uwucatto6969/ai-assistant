import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, LLM_PROVIDER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

interface CustomNERLLMDutyParams<T> extends LLMDutyParams {
  data: {
    schema: T
  }
}

export class CustomNERLLMDuty<T> extends LLMDuty {
  protected readonly systemPrompt =
    'You are an AI system that extracts entities (Named-Entity Recognition) from a given utterance. E.g. shopping list name = "shopping".'
  protected readonly name = 'Custom NER LLM Duty'
  protected input: LLMDutyParams['input'] = null
  protected data = {
    schema: null
  } as CustomNERLLMDutyParams<T>['data']

  constructor(params: CustomNERLLMDutyParams<T>) {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.input = params.input
    this.data = params.data
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const { LlamaChatSession } = await Function(
        'return import("node-llama-cpp")'
      )()

      const context = await LLM_MANAGER.model.createContext({
        threads: LLM_THREADS
      })
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: this.systemPrompt
      })

      const prompt = `UTTERANCE TO PARSE:\n"${this.input}"`
      const completionResult = await LLM_PROVIDER.prompt(prompt, {
        session,
        systemPrompt: this.systemPrompt,
        maxTokens: context.contextSize,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        data: this.data.schema
      })

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
