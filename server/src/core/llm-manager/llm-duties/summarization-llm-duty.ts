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
      const prompt = `Summarize the following text: ${this.input}`
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
        dutyType: LLMDuties.Summarization,
        systemPrompt: this.systemPrompt,
        input: prompt,
        output: rawResult,
        data: null,
        maxTokens: context.contextSize,
        // Current context size
        usedInputTokens,
        usedOutputTokens
      }

      LogHelper.title(this.name)
      LogHelper.success(`Duty executed: ${JSON.stringify(result)}`)

      return result as unknown as LLMDutyResult
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
