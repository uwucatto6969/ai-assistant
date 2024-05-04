import path from 'node:path'
import fs from 'node:fs'

import { LOGS_PATH } from '@/constants'
import { LogHelper } from '@/helpers/log-helper'

interface MessageLog {
  who: 'owner' | 'leon'
  sentAt: number
  message: string
}

const CONVERSATION_LOG_PATH = path.join(LOGS_PATH, 'conversation_log.json')

/**
 * The goal of this class is to log the conversation data between the
 * owner and Leon.
 * This data is saved on the owner's machine.
 * This data can then be used to provide more context to the LLM to achieve
 * better results.
 */
export class ConversationLogger {
  private static readonly nbOfLogsToKeep = 512
  private static readonly nbOfLogsToLoad = 32

  private static async createConversationLogFile(): Promise<void> {
    try {
      if (!fs.existsSync(CONVERSATION_LOG_PATH)) {
        await fs.promises.writeFile(CONVERSATION_LOG_PATH, '[]', 'utf-8')
      }
    } catch (e) {
      LogHelper.title('Conversation Logger')
      LogHelper.error(`Failed to create conversation log file: ${e})`)
    }
  }

  private static async getAllLogs(): Promise<MessageLog[]> {
    try {
      let conversationLog: MessageLog[] = []

      if (fs.existsSync(CONVERSATION_LOG_PATH)) {
        conversationLog = JSON.parse(
          await fs.promises.readFile(CONVERSATION_LOG_PATH, 'utf-8')
        )
      } else {
        await this.createConversationLogFile()
      }

      return conversationLog
    } catch (e) {
      LogHelper.title('Conversation Logger')
      LogHelper.error(`Failed to get conversation log: ${e})`)
    }

    return []
  }

  public static async push(
    newRecord: Omit<MessageLog, 'sentAt'>
  ): Promise<void> {
    try {
      const conversationLogs = await this.getAllLogs()

      if (conversationLogs.length >= this.nbOfLogsToKeep) {
        conversationLogs.shift()
      }

      conversationLogs.push({
        ...newRecord,
        sentAt: Date.now()
      })

      await fs.promises.writeFile(
        CONVERSATION_LOG_PATH,
        JSON.stringify(conversationLogs, null, 2),
        'utf-8'
      )
    } catch (e) {
      LogHelper.title('Conversation Logger')
      LogHelper.error(`Failed to push new record: ${e})`)
    }
  }

  public static async load(): Promise<MessageLog[] | void> {
    try {
      const conversationLog = await this.getAllLogs()

      return conversationLog.slice(-this.nbOfLogsToLoad)
    } catch (e) {
      LogHelper.title('Conversation Logger')
      LogHelper.error(`Failed to load conversation log: ${e})`)
    }
  }

  public static async clear(): Promise<void> {
    try {
      await fs.promises.writeFile(CONVERSATION_LOG_PATH, '[]', 'utf-8')
    } catch (e) {
      LogHelper.title('Conversation Logger')
      LogHelper.error(`Failed to clear conversation log: ${e})`)
    }
  }
}
