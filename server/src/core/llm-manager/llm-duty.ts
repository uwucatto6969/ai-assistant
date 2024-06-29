/**
 * Duties:
 *
 * [OK] Custom NER
 * [OK] Summarization
 * [OK] Translation
 * [OK] Paraphraser
 * Knowledge base / RAG
 * Question answering
 * Sentiment analysis
 * [OK] Conversation
 * Intent fallback
 * Custom prompting (for specific use cases in skills)
 */
import { LLMDuties } from '@/core/llm-manager/types'

export interface LLMDutyExecuteParams {
  isWarmingUp?: boolean
}
export interface LLMDutyParams {
  input: string | null
  data?: Record<string, unknown>
  systemPrompt?: string | null
}
export interface LLMDutyResult {
  dutyType: LLMDuties
  systemPrompt: LLMDutyParams['systemPrompt']
  input: LLMDutyParams['input']
  output: Record<string, unknown>
  data: Record<string, unknown>
}

export const DEFAULT_EXECUTE_PARAMS: LLMDutyExecuteParams = {
  isWarmingUp: false
}

export abstract class LLMDuty {
  protected abstract readonly name: string
  protected abstract readonly systemPrompt: LLMDutyParams['systemPrompt']
  protected abstract input: LLMDutyParams['input']

  protected abstract init(): Promise<void>
  protected abstract execute(
    params: LLMDutyExecuteParams
  ): Promise<LLMDutyResult | null>
}
