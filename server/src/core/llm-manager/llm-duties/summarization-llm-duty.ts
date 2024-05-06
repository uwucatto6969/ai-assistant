import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, LLM_PROVIDER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

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
      const prompt = `Summarize the following text: ${this.input}`

      const completionResult = await LLM_PROVIDER.prompt(prompt, {
        session,
        systemPrompt: this.systemPrompt,
        maxTokens: context.contextSize
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
