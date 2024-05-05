import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import {
  LLM_THREADS,
  MAX_EXECUTION_RETRIES,
  MAX_EXECUTION_TIMOUT
} from '@/core/llm-manager/llm-manager'

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

  public async execute(
    retries = MAX_EXECUTION_RETRIES
  ): Promise<LLMDutyResult | null> {
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
      const prompt = `Text to translate: ${this.input}`
      const rawResultPromise = session.prompt(prompt, {
        maxTokens: context.contextSize
        // temperature: 0.5
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), MAX_EXECUTION_TIMOUT)
      )

      let rawResult

      try {
        rawResult = await Promise.race([rawResultPromise, timeoutPromise])
      } catch (e) {
        if (retries > 0) {
          LogHelper.title(this.name)
          LogHelper.info('Prompt took too long, retrying...')

          return this.execute(retries - 1)
        } else {
          LogHelper.title(this.name)
          LogHelper.error(
            `Prompt failed after ${MAX_EXECUTION_RETRIES} retries`
          )

          return null
        }
      }

      const { usedInputTokens, usedOutputTokens } =
        session.sequence.tokenMeter.getState()
      const result = {
        dutyType: LLMDuties.Translation,
        systemPrompt: this.systemPrompt,
        input: prompt,
        output: rawResult,
        data: this.data,
        maxTokens: context.contextSize,
        // Current context size
        usedInputTokens,
        usedOutputTokens
      }

      LogHelper.title(this.name)
      LogHelper.success(`Duty executed: ${JSON.stringify(result)}`)

      return result
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)

      if (retries > 0) {
        LogHelper.info('Retrying...')
        return this.execute(retries - 1)
      }
    }

    return null
  }
}
