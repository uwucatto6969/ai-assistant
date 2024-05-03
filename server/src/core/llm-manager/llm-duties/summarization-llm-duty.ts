import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

interface SummarizationLLMDutyParams extends LLMDutyParams {}

export class SummarizationLLMDuty extends LLMDuty {
  protected readonly systemPrompt =
    'You are an AI system that summarizes a given text in a few sentences.'
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
          summary: {
            type: 'string'
          }
        }
      })
      const prompt = `TEXT TO SUMMARIZE:\n"${this.input}"`
      let rawResult = await session.prompt(prompt, {
        grammar,
        maxTokens: context.contextSize
        // temperature: 0.2
      })
      // If a closing bracket is missing, add it
      if (rawResult[rawResult.length - 1] !== '}') {
        rawResult += '}'
      }
      const parsedResult = grammar.parse(rawResult)
      const result = {
        dutyType: LLMDuties.Summarization,
        systemPrompt: this.systemPrompt,
        input: prompt,
        output: parsedResult,
        data: null
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
