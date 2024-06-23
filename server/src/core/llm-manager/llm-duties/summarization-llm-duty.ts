import type { LlamaChatSession, LlamaContext } from 'node-llama-cpp'

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
  private static instance: SummarizationLLMDuty
  private static context: LlamaContext = null as unknown as LlamaContext
  private static session: LlamaChatSession = null as unknown as LlamaChatSession
  protected readonly systemPrompt =
    'You are an AI system that summarizes a given text in a few sentences. You do not add any context to your response.'
  protected readonly name = 'Summarization LLM Duty'
  protected input: LLMDutyParams['input'] = null

  constructor(params: SummarizationLLMDutyParams) {
    super()

    if (!SummarizationLLMDuty.instance) {
      LogHelper.title(this.name)
      LogHelper.success('New instance')

      SummarizationLLMDuty.instance = this
    }

    this.input = params.input
  }

  public async init(): Promise<void> {
    if (LLM_PROVIDER_NAME === LLMProviders.Local) {
      if (!SummarizationLLMDuty.context || !SummarizationLLMDuty.session) {
        SummarizationLLMDuty.context = await LLM_MANAGER.model.createContext({
          threads: LLM_THREADS
        })

        const { LlamaChatSession } = await Function(
          'return import("node-llama-cpp")'
        )()

        SummarizationLLMDuty.session = new LlamaChatSession({
          contextSequence: SummarizationLLMDuty.context.getSequence(),
          systemPrompt: this.systemPrompt
        }) as LlamaChatSession
      }
    }
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
        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session: SummarizationLLMDuty.session,
          maxTokens: SummarizationLLMDuty.context.contextSize
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
