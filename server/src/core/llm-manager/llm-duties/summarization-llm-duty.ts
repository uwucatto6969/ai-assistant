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

interface SummarizationLLMDutyParams extends LLMDutyParams {}

export class SummarizationLLMDuty extends LLMDuty {
  protected readonly systemPrompt =
    'You are an AI system that summarizes a given text in a few sentences. You do not add any context to your response.'
  protected readonly name = 'Summarization LLM Duty'
  protected input: LLMDutyParams['input'] = null

  constructor(params: SummarizationLLMDutyParams) {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.input = params.input
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const prompt = `Summarize the following text: ${this.input}`
      const completionParams = {
        dutyType: LLMDuties.Summarization,
        systemPrompt: this.systemPrompt
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
      LogHelper.success('Duty executed')
      LogHelper.success(`Prompt — ${prompt}`)
      LogHelper.success(`Output — ${completionResult?.output}`)

      return completionResult as unknown as LLMDutyResult
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)
    }

    return null
  }
}
