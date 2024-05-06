import { LogHelper } from '@/helpers/log-helper'

export default class GroqLLMProvider {
  protected readonly name = 'Groq LLM Provider'

  constructor() {
    LogHelper.title(this.name)
    LogHelper.success('New instance')

    try {
      // TODO: set history and stuff?

      LogHelper.success('Provider initialized')
    } catch (e) {
      LogHelper.error(`${this.name} - Failed to initialize: ${e}`)
    }
  }

  /**
   * TODO
   */
  public async runChatCompletion(): Promise<void> {}
}
