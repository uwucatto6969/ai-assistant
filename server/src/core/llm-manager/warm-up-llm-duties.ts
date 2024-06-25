import { ActionRecognitionLLMDuty } from '@/core/llm-manager/llm-duties/action-recognition-llm-duty'
import { ConversationLLMDuty } from '@/core/llm-manager/llm-duties/conversation-llm-duty'
import { CustomNERLLMDuty } from '@/core/llm-manager/llm-duties/custom-ner-llm-duty'
import { ParaphraseLLMDuty } from '@/core/llm-manager/llm-duties/paraphrase-llm-duty'

export default async (): Promise<void> => {
  /**
   * Action Recognition LLM Duty warm-up
   */
  const actionRecognitionDuty = new ActionRecognitionLLMDuty({
    input: 'Hi there',
    data: {
      existingContextName: null
    }
  })
  await actionRecognitionDuty.init()
  await actionRecognitionDuty.execute()

  /**
   * Conversation LLM Duty warm-up
   */
  const conversationDuty = new ConversationLLMDuty()
  await conversationDuty.init()
  await conversationDuty.execute()

  /**
   * Custom NER LLM Duty warm-up
   */
  const customNERDuty = new CustomNERLLMDuty({
    input:
      'Add apples, 1L of milk, orange juice and tissues to the shopping list',
    data: {
      schema: {
        items: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        list_name: {
          type: 'string'
        }
      }
    }
  })
  await customNERDuty.init()
  await customNERDuty.execute()

  /**
   * Paraphrase LLM Duty warm-up
   */
  const paraphraseDuty = new ParaphraseLLMDuty({
    input: 'We have a wonderful planet.'
  })
  await paraphraseDuty.init()
  await paraphraseDuty.execute()
}
