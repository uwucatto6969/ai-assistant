import type { LlamaChatSession } from 'node-llama-cpp'

import type { LLMDuty } from '@/core/llm-manager/llm-duty'
import type { MessageLog } from '@/types'

export enum LLMDuties {
  CustomNER = 'customer-ner',
  Translation = 'translation',
  Summarization = 'summarization',
  Paraphrase = 'paraphrase',
  ChitChat = 'chit-chat'
  // TODO
  /*SentimentAnalysis = 'sentiment-analysis',
  QuestionAnswering = 'question-answering',
  IntentFallback = 'intent-fallback',
  RAG = 'rag',
  NLUParaphraser = 'nlu-paraphraser'*/
}

export enum LLMProviders {
  Local = 'local',
  Groq = 'groq'
}

export interface CompletionOptions {
  systemPrompt: string
  maxTokens?: number
  grammar?: string
  temperature?: number
  timeout?: number
  maxRetries?: number
  session?: LlamaChatSession | null
  duty?: LLMDuty
  data?: Record<string, unknown> | null
  history?: MessageLog[]
}
