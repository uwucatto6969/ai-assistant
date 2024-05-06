import {
  type LLMDutyParams,
  type LLMDutyResult,
  LLMDuty
} from '@/core/llm-manager/llm-duty'
import { LogHelper } from '@/helpers/log-helper'
import { CONVERSATION_LOGGER, LLM_MANAGER, LLM_PROVIDER, PERSONA } from '@/core'
import { LLM_THREADS } from '@/core/llm-manager/llm-manager'

interface ParaphraseLLMDutyParams extends LLMDutyParams {}

export class ParaphraseLLMDuty extends LLMDuty {
  protected readonly systemPrompt = `You are an AI system that generates answers (Natural Language Generation).
You must provide a text alternative according to your current mood and your personality.
Never indicate that it's a modified version.
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
      const { LlamaChatSession } = await Function(
        'return import("node-llama-cpp")'
      )()

      const context = await LLM_MANAGER.model.createContext({
        threads: LLM_THREADS
      })
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: PERSONA.getDutySystemPrompt(this.systemPrompt)
      })

      const history = await LLM_MANAGER.loadHistory(
        CONVERSATION_LOGGER,
        session
      )
      /**
       * Only the first (system prompt) messages is used
       * to provide some context
       */
      // session.setChatHistory([history[0], history[history.length - 1]])
      session.setChatHistory([history[0]])

      const prompt = `Modify the following text but do not say you modified it: ${this.input}`

      const completionResult = await LLM_PROVIDER.prompt(prompt, {
        session,
        systemPrompt: PERSONA.getDutySystemPrompt(this.systemPrompt),
        maxTokens: context.contextSize,
        temperature: 0.8
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
