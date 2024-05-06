import type { LlamaContext, LlamaChatSession } from 'node-llama-cpp'

import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import {
  LLM_MANAGER,
  PERSONA,
  NLU,
  LOOP_CONVERSATION_LOGGER,
  LLM_PROVIDER
} from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

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

  public async execute(): Promise<LLMDutyResult | null> {
    LogHelper.title(this.name)
    LogHelper.info('Executing...')

    try {
      await LOOP_CONVERSATION_LOGGER.push({
        who: 'owner',
        message: NLU.nluResult.newUtterance
      })

      const prompt = NLU.nluResult.newUtterance

      const completionResult = await LLM_PROVIDER.prompt(prompt, {
        session: ChitChatLLMDuty.session,
        systemPrompt: PERSONA.getChitChatSystemPrompt(),
        maxTokens: ChitChatLLMDuty.context.contextSize,
        temperature: 1.3
      })

      await LOOP_CONVERSATION_LOGGER.push({
        who: 'leon',
        message: completionResult?.output as string
      })

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
