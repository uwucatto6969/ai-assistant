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

interface TranslationLLMDutyParams extends LLMDutyParams {
  data: {
    source?: string | null
    target: string | null
    autoDetectLanguage?: boolean
  }
}

export class TranslationLLMDuty extends LLMDuty {
  private static instance: TranslationLLMDuty
  private static context: LlamaContext = null as unknown as LlamaContext
  private static session: LlamaChatSession = null as unknown as LlamaChatSession
  protected readonly systemPrompt: LLMDutyParams['systemPrompt'] = `You are an AI system that does translation. You do not add any context to your response. You only provide the translation without any additional information.`
  protected readonly name = 'Translation LLM Duty'
  protected input: LLMDutyParams['input'] = null
  protected data = {
    source: null,
    target: null,
    autoDetectLanguage: false
  } as TranslationLLMDutyParams['data']

  constructor(params: TranslationLLMDutyParams) {
    super()

    if (!TranslationLLMDuty.instance) {
      LogHelper.title(this.name)
      LogHelper.success('New instance')

      TranslationLLMDuty.instance = this
    }

    this.input = params.input
    this.data = params.data

    const promptSuffix = 'You do not add any context to your response.'
    if (this.data.autoDetectLanguage && !this.data.source) {
      this.systemPrompt = `You are an AI system that translates a given text to "${this.data.target}" by auto-detecting the source language. ${promptSuffix}`
    } else {
      this.systemPrompt = `You are an AI system that translates a given text from "${this.data.source}" to "${this.data.target}". ${promptSuffix}`
    }
  }

  public async init(): Promise<void> {
    if (LLM_PROVIDER_NAME === LLMProviders.Local) {
      if (!TranslationLLMDuty.context || !TranslationLLMDuty.session) {
        TranslationLLMDuty.context = await LLM_MANAGER.model.createContext({
          threads: LLM_THREADS
        })

        const { LlamaChatSession } = await Function(
          'return import("node-llama-cpp")'
        )()

        TranslationLLMDuty.session = new LlamaChatSession({
          contextSequence: TranslationLLMDuty.context.getSequence(),
          systemPrompt: this.systemPrompt
        }) as LlamaChatSession
      }
    }
  }

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      let prompt

      if (this.data.autoDetectLanguage && !this.data.source) {
        prompt = `Translate the given text to "${this.data.target}" by auto-detecting the source language.`
      } else {
        prompt = `Translate the given text from "${this.data.source}" to "${this.data.target}".`
      }

      prompt += `\nText to translate: "${this.input}"`

      const completionParams = {
        dutyType: LLMDuties.Translation,
        systemPrompt: this.systemPrompt as string
      }
      let completionResult

      if (LLM_PROVIDER_NAME === LLMProviders.Local) {
        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session: TranslationLLMDuty.session,
          maxTokens: TranslationLLMDuty.context.contextSize
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
