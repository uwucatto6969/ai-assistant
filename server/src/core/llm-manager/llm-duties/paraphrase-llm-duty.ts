import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, PERSONA } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

interface ParaphraseLLMDutyParams extends LLMDutyParams {}

export class ParaphraseLLMDuty extends LLMDuty {
  protected readonly systemPrompt = `You are an AI system that generates answers (Natural Language Generation) based on a given text. Provide a text alternative of the given text according to your current mood. You do not ask follow up question if the original text does not contain any.`
  protected readonly name = 'Paraphrase LLM Duty'
  protected input: LLMDutyParams['input'] = null

  constructor(params: ParaphraseLLMDutyParams) {
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
          text_alternative: {
            type: 'string'
          }
        }
      })
      const prompt = `TEXT TO MODIFY:\n"${this.input}"`
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
        dutyType: LLMDuties.Paraphrase,
        systemPrompt: PERSONA.getDutySystemPrompt(this.systemPrompt),
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
