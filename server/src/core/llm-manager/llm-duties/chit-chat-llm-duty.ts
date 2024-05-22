import type { LlamaContext, LlamaChatSession } from 'node-llama-cpp'

import type { MessageLog } from '@/types'
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
  LLM_PROVIDER,
  SOCKET_SERVER
} from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'
import { LLMProviders } from '@/core/llm-manager/types'
import { LLM_PROVIDER as LLM_PROVIDER_NAME } from '@/constants'
import { StringHelper } from '@/helpers/string-helper'

export class ChitChatLLMDuty extends LLMDuty {
  private static instance: ChitChatLLMDuty
  private static context: LlamaContext = null as unknown as LlamaContext
  private static session: LlamaChatSession = null as unknown as LlamaChatSession
  private static messagesHistoryForNonLocalProvider: MessageLog[] =
    null as unknown as MessageLog[]
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
    if (LLM_PROVIDER_NAME === LLMProviders.Local) {
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
    } else {
      /**
       * For non-local providers:
       * Once Leon's instance is restarted, clean up the messages history,
       * then load the messages history
       */

      if (!ChitChatLLMDuty.messagesHistoryForNonLocalProvider) {
        await LOOP_CONVERSATION_LOGGER.clear()
      }

      ChitChatLLMDuty.messagesHistoryForNonLocalProvider =
        await LOOP_CONVERSATION_LOGGER.load()
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
      const completionParams = {
        systemPrompt: PERSONA.getChitChatSystemPrompt(),
        temperature: 1.3
      }
      let completionResult

      if (LLM_PROVIDER_NAME === LLMProviders.Local) {
        const generationId = StringHelper.random(6, { onlyLetters: true })
        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session: ChitChatLLMDuty.session,
          maxTokens: ChitChatLLMDuty.context.contextSize,
          onToken: (chunk) => {
            const detokenizedChunk = LLM_MANAGER.model.detokenize(chunk)

            SOCKET_SERVER.socket?.emit('llm-token', {
              token: detokenizedChunk,
              generationId
            })
          }
        })
      } else {
        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          history: ChitChatLLMDuty.messagesHistoryForNonLocalProvider
        })
      }

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
