import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, PERSONA, NLU } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

// interface ChitChatLLMDutyParams extends LLMDutyParams {}

export class ChitChatLLMDuty extends LLMDuty {
  private static instance: ChitChatLLMDuty
  // TODO
  protected readonly systemPrompt = ``
  protected readonly name = 'Chit-Chat LLM Duty'
  protected input: LLMDutyParams['input'] = null

  // constructor(params: ChitChatLLMDutyParams) {
  constructor() {
    super()

    if (!ChitChatLLMDuty.instance) {
      LogHelper.title(this.name)
      LogHelper.success('New instance')

      ChitChatLLMDuty.instance = this

      // this.input = params.input
    }
  }

  public async execute(retries = 3): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      const { LlamaJsonSchemaGrammar, LlamaChatSession } = await Function(
        'return import("node-llama-cpp")'
      )()

      /**
       * TODO: make context, session, etc. persistent
       */

      const context = await LLM_MANAGER.model.createContext({
        threads: LLM_THREADS
      })
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: PERSONA.getDutySystemPrompt(this.systemPrompt)
      })

      const history = await LLM_MANAGER.loadHistory(session)
      session.setChatHistory(history)

      const grammar = new LlamaJsonSchemaGrammar(LLM_MANAGER.llama, {
        type: 'object',
        properties: {
          model_answer: {
            type: 'string'
          }
        }
      })
      const prompt = `NEW MESSAGE FROM USER:\n"${NLU.nluResult.newUtterance}"`

      const rawResultPromise = session.prompt(prompt, {
        grammar,
        maxTokens: context.contextSize,
        temperature: 1.0
      })

      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Timeout')), 8_000) // 5 seconds timeout
      )

      let rawResult

      try {
        rawResult = await Promise.race([rawResultPromise, timeoutPromise])
      } catch (error) {
        if (retries > 0) {
          LogHelper.title(this.name)
          LogHelper.info('Prompt took too long, retrying...')

          return this.execute(retries - 1)
        } else {
          LogHelper.title(this.name)
          LogHelper.error('Prompt failed after 3 retries')

          return null
        }
      }

      // If a closing bracket is missing, add it
      if (rawResult[rawResult.length - 1] !== '}') {
        rawResult += '}'
      }
      const parsedResult = grammar.parse(rawResult)
      const result = {
        dutyType: LLMDuties.Paraphrase,
        systemPrompt: PERSONA.getChitChatSystemPrompt(),
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
