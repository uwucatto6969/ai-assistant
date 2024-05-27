import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { LLM_MANAGER, LLM_PROVIDER, PERSONA, SOCKET_SERVER } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'
import { LLMProviders, LLMDuties } from '@/core/llm-manager/types'
import { LLM_PROVIDER as LLM_PROVIDER_NAME } from '@/constants'
import { StringHelper } from '@/helpers/string-helper'

interface ParaphraseLLMDutyParams extends LLMDutyParams {}

export class ParaphraseLLMDuty extends LLMDuty {
  protected readonly systemPrompt = `You are an AI system that generates answers (Natural Language Generation).
You must provide a text alternative according to your current mood and your personality.
Never indicate that it's a modified version.
Do not interpret the text, just paraphrase it.
You do not ask question if the original text does not contain any.
If there are data in the original text, make sure to provide them.

Examples:

Modify this text: I added your items to the shopping list.
I included the items you mentioned to the shopping list. Happy shopping!

Modify this text: the sun is a star.
The sun is a star, it is the closest star to Earth.`
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
      const prompt = `Modify the following text but do not say you modified it: ${this.input}`
      const completionParams = {
        dutyType: LLMDuties.Paraphrase,
        systemPrompt: PERSONA.getDutySystemPrompt(this.systemPrompt),
        temperature: 0.8
      }
      let completionResult

      if (LLM_PROVIDER_NAME === LLMProviders.Local) {
        const { LlamaChatSession } = await Function(
          'return import("node-llama-cpp")'
        )()

        /*const history = await LLM_MANAGER.loadHistory(
          CONVERSATION_LOGGER,
          session
        )*/
        /**
         * Only the first (system prompt) messages is used
         * to provide some context
         */
        // session.setChatHistory([history[0], history[history.length - 1]])
        // session.setChatHistory([history[0]])

        const context = await LLM_MANAGER.model.createContext({
          threads: LLM_THREADS
        })
        const session = new LlamaChatSession({
          contextSequence: context.getSequence(),
          systemPrompt: completionParams.systemPrompt
        })

        const generationId = StringHelper.random(6, { onlyLetters: true })
        completionResult = await LLM_PROVIDER.prompt(prompt, {
          ...completionParams,
          session,
          maxTokens: context.contextSize,
          onToken: (chunk) => {
            const detokenizedChunk = LLM_PROVIDER.cleanUpResult(
              LLM_MANAGER.model.detokenize(chunk)
            )

            SOCKET_SERVER.socket?.emit('llm-token', {
              token: detokenizedChunk,
              generationId
            })
          }
        })
      } else {
        completionResult = await LLM_PROVIDER.prompt(prompt, completionParams)
      }

      LogHelper.title(this.name)
      LogHelper.success('Duty executed')
      LogHelper.success(`Prompt — ${prompt}`)
      LogHelper.success(`Output — ${completionResult?.output}`)

      return completionResult as unknown as LLMDutyResult
    } catch (e) {
      LogHelper.title(this.name)
      LogHelper.error(`Failed to execute: ${e}`)
    }

    return null
  }
}
