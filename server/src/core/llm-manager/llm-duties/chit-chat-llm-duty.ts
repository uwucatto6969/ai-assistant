import type { LlamaContext, LlamaChatSession } from 'node-llama-cpp'

import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, PERSONA, NLU, LOOP_CONVERSATION_LOGGER } from '@/core'
import { LLMDuties } from '@/core/llm-manager/types'
import {
  LLM_THREADS,
  MAX_EXECUTION_RETRIES,
  MAX_EXECUTION_TIMOUT
} from '@/core/llm-manager/llm-manager'

export class ChitChatLLMDuty extends LLMDuty {
  private static instance: ChitChatLLMDuty
  private static context: LlamaContext = null as unknown as LlamaContext
  private static session: LlamaChatSession = null as unknown as LlamaChatSession
  protected readonly systemPrompt = ``
  protected readonly name = 'Chit-Chat LLM Duty'
  protected input: LLMDutyParams['input'] = null

  constructor() {
    super()

    if (!ChitChatLLMDuty.instance) {
      LogHelper.title(this.name)
      LogHelper.success('New instance')

      ChitChatLLMDuty.instance = this
    }
  }

  public async init(): Promise<void> {
    /**
     * A new context and session will be created only
     * when Leon's instance is restarted
     */
    if (!ChitChatLLMDuty.context || !ChitChatLLMDuty.session) {
      await LOOP_CONVERSATION_LOGGER.clear()

      ChitChatLLMDuty.context = await LLM_MANAGER.model.createContext({
        threads: LLM_THREADS
      })

      const { LlamaChatSession } = await Function(
        'return import("node-llama-cpp")'
      )()

      ChitChatLLMDuty.session = new LlamaChatSession({
        contextSequence: ChitChatLLMDuty.context.getSequence(),
        systemPrompt: PERSONA.getChitChatSystemPrompt()
      }) as LlamaChatSession
    } else {
      /**
       * As long as Leon's instance has not been restarted,
       * the context, session with history will be loaded
       */
      const history = await LLM_MANAGER.loadHistory(
        LOOP_CONVERSATION_LOGGER,
        ChitChatLLMDuty.session
      )

      ChitChatLLMDuty.session.setChatHistory(history)
    }
  }

  public async execute(
    retries = MAX_EXECUTION_RETRIES
  ): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      await LOOP_CONVERSATION_LOGGER.push({
        who: 'owner',
        message: NLU.nluResult.newUtterance
      })
      const prompt = NLU.nluResult.newUtterance

      const rawResultPromise = ChitChatLLMDuty.session.prompt(prompt, {
        maxTokens: ChitChatLLMDuty.context.contextSize,
        temperature: 1.3
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), MAX_EXECUTION_TIMOUT)
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
          LogHelper.error(
            `Prompt failed after ${MAX_EXECUTION_RETRIES} retries`
          )

          return null
        }
      }

      const { usedInputTokens, usedOutputTokens } =
        ChitChatLLMDuty.session.sequence.tokenMeter.getState()
      const result = {
        dutyType: LLMDuties.Paraphrase,
        systemPrompt: PERSONA.getChitChatSystemPrompt(),
        input: prompt,
        output: rawResult,
        data: null,
        maxTokens: ChitChatLLMDuty.context.contextSize,
        // Current context size
        usedInputTokens,
        usedOutputTokens
      }

      await LOOP_CONVERSATION_LOGGER.push({
        who: 'leon',
        message: result.output as string
      })

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
