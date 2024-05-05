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

  public async execute(
    retries = MAX_EXECUTION_RETRIES
  ): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const { LlamaJsonSchemaGrammar, LlamaChatSession } = await Function(
        'return import("node-llama-cpp")'
      )()

      const context = await LLM_MANAGER.model.createContext({
        threads: LLM_THREADS
      })
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: this.systemPrompt
      })
      const grammar = new LlamaJsonSchemaGrammar(LLM_MANAGER.llama, {
        type: 'object',
        properties: {
          ...this.data.schema
        }
      })
      const prompt = `UTTERANCE TO PARSE:\n"${this.input}"`
      const rawResultPromise = session.prompt(prompt, {
        grammar,
        maxTokens: context.contextSize
        // temperature: 0.2
      })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), MAX_EXECUTION_TIMOUT)
      )

      let parsedResult

      try {
        let rawResult = await Promise.race([rawResultPromise, timeoutPromise])

        // If a closing bracket is missing, add it
        if (rawResult[rawResult.length - 1] !== '}') {
          rawResult += '}'
        }
        parsedResult = grammar.parse(rawResult)
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
        dutyType: LLMDuties.CustomNER,
        systemPrompt: this.systemPrompt,
        input: prompt,
        output: parsedResult,
        data: this.data,
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
