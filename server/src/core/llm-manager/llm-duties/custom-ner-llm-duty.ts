import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import { LLM_CONTEXT_SIZE, LLM_THREADS } from '@/core/llm-manager/llm-manager'

interface CustomNERLLMDutyParams<T> extends LLMDutyParams {
  data: {
    schema: T
  }
}

export class CustomNERLLMDuty<T> extends LLMDuty {
  protected readonly systemPrompt =
    'You are an AI system that extract entities (Named-Entity Recognition) from a given utterance. E.g. shopping list name = "shopping".'
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
      const { LlamaCompletion, LlamaJsonSchemaGrammar } = await import(
        'node-llama-cpp'
      )
      const context = await LLM_MANAGER.model.createContext({
        contextSize: LLM_CONTEXT_SIZE,
        threads: LLM_THREADS
      })
      const completion = new LlamaCompletion({
        contextSequence: context.getSequence()
      })
      const grammar = new LlamaJsonSchemaGrammar(LLM_MANAGER.llama, {
        type: 'object',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        properties: {
          ...this.data.schema
        }
      })
      const prompt = `Utterance: ${this.input}`
      const rawResult = await completion.generateCompletion(prompt, {
        grammar,
        maxTokens: context.contextSize
      })
      const parsedResult = grammar.parse(rawResult)
      const result = {
        dutyType: LLMDuties.CustomNER,
        systemPrompt: this.systemPrompt,
        input: prompt,
        output: parsedResult,
        data: this.data
      }

      LogHelper.title(this.name)
      LogHelper.success(`Duty executed: ${JSON.stringify(result)}`)

      return result as unknown as LLMDutyResult
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)
    }

    return null
  }
}
