import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, LLM_PROVIDER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'
import { LLMProviders } from '@/core/llm-manager/types'
import { LLM_PROVIDER as LLM_PROVIDER_NAME } from '@/constants'

interface TranslationLLMDutyParams extends LLMDutyParams {
  data: {
    source?: string | null
    target: string | null
    autoDetectLanguage?: boolean
  }
}

export class TranslationLLMDuty extends LLMDuty {
  protected readonly systemPrompt: LLMDutyParams['systemPrompt'] = null
  protected readonly name = 'Translation LLM Duty'
  protected input: LLMDutyParams['input'] = null
  protected data = {
    source: null,
    target: null,
    autoDetectLanguage: false
  } as TranslationLLMDutyParams['data']

  constructor(params: TranslationLLMDutyParams) {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.input = params.input
    this.data = params.data

    const promptSuffix = 'You do not add any context to your response.'
    if (this.data.autoDetectLanguage && !this.data.source) {
      this.systemPrompt = `You are an AI system that translates a given text to "${this.data.target}" by auto-detecting the source language. ${promptSuffix}`
    } else {
      this.systemPrompt = `You are an AI system that translates a given text from "${this.data.source}" to "${this.data.target}". ${promptSuffix}`
    }
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const prompt = `Text to translate: ${this.input}`
      const completionParams = {
        systemPrompt: this.systemPrompt as string
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
