import { join } from 'node:path'
import { spawn } from 'node:child_process'

import kill from 'tree-kill'

import type { Language, ShortLanguageCode } from '@/types'
import type {
  NLUProcessResult,
  NLPAction,
  NLPDomain,
  NLPJSProcessResult,
  NLPSkill,
  NLPUtterance,
  NLUResult
} from '@/core/nlp/types'
import { langs } from '@@/core/langs.json'
import { PYTHON_TCP_SERVER_BIN_PATH } from '@/constants'
import {
  PYTHON_TCP_CLIENT,
  BRAIN,
  SOCKET_SERVER,
  MODEL_LOADER,
  NER
} from '@/core'
import { LogHelper } from '@/helpers/log-helper'
import { LangHelper } from '@/helpers/lang-helper'
import { ActionLoop } from '@/core/nlp/nlu/action-loop'
import { SlotFilling } from '@/core/nlp/nlu/slot-filling'
import Conversation, { DEFAULT_ACTIVE_CONTEXT } from '@/core/nlp/conversation'
import { Telemetry } from '@/telemetry'
import { SkillDomainHelper } from '@/helpers/skill-domain-helper'

export const DEFAULT_NLU_RESULT = {
  utterance: '',
  newUtterance: '',
  currentEntities: [],
  entities: [],
  currentResolvers: [],
  resolvers: [],
  slots: {},
  skillConfigPath: '',
  answers: [], // For dialog action type
  sentiment: {},
  classification: {
    domain: '',
    skill: '',
    action: '',
    confidence: 0
  },
  actionConfig: null
}

export default class NLU {
  private static instance: NLU
  private _nluResult: NLUResult = DEFAULT_NLU_RESULT
  public conversation = new Conversation('conv0')

  get nluResult(): NLUResult {
    return this._nluResult
  }

  async setNLUResult(newNLUResult: NLUResult): Promise<void> {
    const skillConfigPath = newNLUResult.skillConfigPath
      ? newNLUResult.skillConfigPath
      : join(
          process.cwd(),
          'skills',
          newNLUResult.classification.domain,
          newNLUResult.classification.skill,
          'config',
          BRAIN.lang + '.json'
        )
    const { actions } = await SkillDomainHelper.getSkillConfig(
      skillConfigPath,
      BRAIN.lang
    )

    this._nluResult = {
      ...newNLUResult,
      skillConfigPath,
      actionConfig: actions[
        newNLUResult.classification.action
      ] as NLUResult['actionConfig']
    }
  }

  constructor() {
    if (!NLU.instance) {
      LogHelper.title('NLU')
      LogHelper.success('New instance')

      NLU.instance = this
    }
  }

  /**
   * Check if the utterance should break the action loop
   * based on the active context and the utterance content
   */
  private shouldBreakActionLoop(utterance: NLPUtterance): boolean {
    const loopStopWords = LangHelper.getActionLoopStopWords(BRAIN.lang)
    const hasActiveContext = this.conversation.hasActiveContext()
    const hasOnlyOneWord = utterance.split(' ').length === 1
    const hasLessThan5Words = utterance.split(' ').length < 5
    const hasStopWords = loopStopWords.some((word) =>
      utterance.toLowerCase().includes(word)
    )
    const hasLoopWord = utterance.toLowerCase().includes('loop')

    if (
      (hasActiveContext && hasStopWords && hasOnlyOneWord) ||
      (hasLessThan5Words && hasStopWords && hasLoopWord)
    ) {
      LogHelper.info('Should break action loop')
      return true
    }

    return false
  }

  /**
   * Set new language; recreate a new TCP server with new language; and reprocess understanding
   */
  private async switchLanguage(
    utterance: NLPUtterance,
    locale: ShortLanguageCode
  ): Promise<void> {
    const connectedHandler = async (): Promise<void> => {
      await this.process(utterance)
    }

    BRAIN.lang = locale
    await BRAIN.talk(`${BRAIN.wernicke('random_language_switch')}.`, true)

    // Recreate a new TCP server process and reconnect the TCP client
    kill(global.pythonTCPServerProcess.pid as number, () => {
      global.pythonTCPServerProcess = spawn(
        `${PYTHON_TCP_SERVER_BIN_PATH} ${locale}`,
        {
          shell: true
        }
      )

      PYTHON_TCP_CLIENT.connect()
      PYTHON_TCP_CLIENT.ee.removeListener('connected', connectedHandler)
      PYTHON_TCP_CLIENT.ee.on('connected', connectedHandler)
    })
  }

  /**
   * Classify the utterance,
   * pick-up the right classification
   * and extract entities
   */
  public process(utterance: NLPUtterance): Promise<NLUProcessResult | null> {
    const processingTimeStart = Date.now()

    return new Promise(async (resolve, reject) => {
      LogHelper.title('NLU')
      LogHelper.info('Processing...')

      if (!MODEL_LOADER.hasNlpModels()) {
        if (!BRAIN.isMuted) {
          await BRAIN.talk(`${BRAIN.wernicke('random_errors')}!`)
        }

        const msg =
          'An NLP model is missing, please rebuild the project or if you are in dev run: npm run train'
        LogHelper.error(msg)
        return reject(msg)
      }

      if (this.shouldBreakActionLoop(utterance)) {
        this.conversation.cleanActiveContext()

        await BRAIN.talk(`${BRAIN.wernicke('action_loop_stopped')}.`, true)

        return resolve({})
      }

      // Add spaCy entities
      await NER.mergeSpacyEntities(utterance)

      // Pre NLU processing according to the active context if there is one
      if (this.conversation.hasActiveContext()) {
        // When the active context is in an action loop, then directly trigger the action
        if (this.conversation.activeContext.isInActionLoop) {
          return resolve(await ActionLoop.handle(utterance))
        }

        // When the active context has slots filled
        if (Object.keys(this.conversation.activeContext.slots).length > 0) {
          try {
            return resolve(await SlotFilling.handle(utterance))
          } catch (e) {
            return reject({})
          }
        }
      }

      const result: NLPJSProcessResult =
        await MODEL_LOADER.mainNLPContainer.process(utterance)
      const { locale, answers, classifications } = result
      const sentiment = {
        vote: result.sentiment.vote,
        score: result.sentiment.score
      }
      let { score, intent, domain } = result

      /**
       * If a context is active, then use the appropriate classification based on score probability.
       * E.g. 1. Create my shopping list; 2. Actually delete it.
       * If there are several "delete it" across skills, Leon needs to make use of
       * the current context ({domain}.{skill}) to define the most accurate classification
       */
      if (this.conversation.hasActiveContext()) {
        classifications.forEach(({ intent: newIntent, score: newScore }) => {
          if (newScore > 0.6) {
            const [skillName] = newIntent.split('.')
            const newDomain = MODEL_LOADER.mainNLPContainer.getIntentDomain(
              locale,
              newIntent
            )
            const contextName = `${newDomain}.${skillName}`
            if (this.conversation.activeContext.name === contextName) {
              score = newScore
              intent = newIntent
              domain = newDomain
            }
          }
        })
      }

      const [skillName, actionName] = intent.split('.')
      await this.setNLUResult({
        ...DEFAULT_NLU_RESULT, // Reset entities, slots, etc.
        utterance,
        newUtterance: utterance,
        answers, // For dialog action type
        sentiment,
        classification: {
          domain,
          skill: skillName || '',
          action: actionName || '',
          confidence: score
        }
      })

      const isSupportedLanguage = LangHelper.getShortCodes().includes(locale)
      if (!isSupportedLanguage) {
        await BRAIN.talk(
          `${BRAIN.wernicke('random_language_not_supported')}.`,
          true
        )
        return resolve({})
      }

      // Trigger language switching
      if (BRAIN.lang !== locale) {
        await this.switchLanguage(utterance, locale)
        return resolve(null)
      }

      if (intent === 'None') {
        const fallback = this.fallback(
          langs[LangHelper.getLongCode(locale)].fallbacks
        )

        if (!fallback) {
          if (!BRAIN.isMuted) {
            await BRAIN.talk(
              `${BRAIN.wernicke('random_unknown_intents')}.`,
              true
            )
          }

          LogHelper.title('NLU')
          const msg = 'Intent not found'
          LogHelper.warning(msg)

          Telemetry.utterance({ utterance, lang: BRAIN.lang })

          return resolve(null)
        }

        await this.setNLUResult(fallback)
      }

      LogHelper.title('NLU')
      LogHelper.success(
        `Intent found: ${this._nluResult.classification.skill}.${
          this._nluResult.classification.action
        } (domain: ${
          this._nluResult.classification.domain
        }); Confidence: ${this._nluResult.classification.confidence.toFixed(2)}`
      )

      const skillConfigPath = join(
        process.cwd(),
        'skills',
        this._nluResult.classification.domain,
        this._nluResult.classification.skill,
        'config',
        BRAIN.lang + '.json'
      )
      this._nluResult.skillConfigPath = skillConfigPath

      try {
        this._nluResult.entities = await NER.extractEntities(
          BRAIN.lang,
          skillConfigPath,
          this._nluResult
        )
      } catch (e) {
        LogHelper.error(`Failed to extract entities: ${e}`)
      }

      const shouldSlotLoop = await SlotFilling.route(intent, utterance)
      if (shouldSlotLoop) {
        return resolve({})
      }

      // In case all slots have been filled in the first utterance
      if (
        this.conversation.hasActiveContext() &&
        Object.keys(this.conversation.activeContext.slots).length > 0
      ) {
        try {
          return resolve(await SlotFilling.handle(utterance))
        } catch (e) {
          return reject({})
        }
      }

      const newContextName = `${this._nluResult.classification.domain}.${skillName}`
      if (this.conversation.activeContext.name !== newContextName) {
        this.conversation.cleanActiveContext()
      }
      await this.conversation.setActiveContext({
        ...DEFAULT_ACTIVE_CONTEXT,
        lang: BRAIN.lang,
        slots: {},
        isInActionLoop: false,
        originalUtterance: this._nluResult.utterance,
        newUtterance: utterance,
        skillConfigPath: this._nluResult.skillConfigPath,
        actionName: this._nluResult.classification.action,
        domain: this._nluResult.classification.domain,
        intent,
        entities: this._nluResult.entities
      })
      // Pass current utterance entities to the NLU result object
      this._nluResult.currentEntities =
        this.conversation.activeContext.currentEntities
      // Pass context entities to the NLU result object
      this._nluResult.entities = this.conversation.activeContext.entities

      try {
        const processedData = await BRAIN.execute(this._nluResult)

        // Prepare next action if there is one queuing
        if (processedData.nextAction) {
          this.conversation.cleanActiveContext()
          await this.conversation.setActiveContext({
            ...DEFAULT_ACTIVE_CONTEXT,
            lang: BRAIN.lang,
            slots: {},
            isInActionLoop: !!processedData.nextAction.loop,
            originalUtterance: processedData.utterance ?? '',
            newUtterance: utterance ?? '',
            skillConfigPath: processedData.skillConfigPath || '',
            actionName: processedData.action?.next_action || '',
            domain: processedData.classification?.domain || '',
            intent: `${processedData.classification?.skill}.${processedData.action?.next_action}`,
            entities: []
          })
        }

        const processingTimeEnd = Date.now()
        const processingTime = processingTimeEnd - processingTimeStart

        return resolve({
          processingTime, // In ms, total time
          ...processedData,
          newUtterance: utterance,
          nluProcessingTime:
            processingTime - (processedData?.executionTime || 0) // In ms, NLU processing time only
        })
      } catch (e) {
        const errorMessage = `Failed to execute action: ${e}`

        LogHelper.error(errorMessage)

        if (!BRAIN.isMuted) {
          SOCKET_SERVER.socket?.emit('is-typing', false)
        }

        return reject(new Error(errorMessage))
      }
    })
  }

  /**
   * Pickup and compare the right fallback
   * according to the wished skill action
   */
  private fallback(fallbacks: Language['fallbacks']): NLUResult | null {
    const words = this._nluResult.utterance.toLowerCase().split(' ')

    if (fallbacks.length > 0) {
      LogHelper.info('Looking for fallbacks...')
      const tmpWords = []

      for (let i = 0; i < fallbacks.length; i += 1) {
        for (let j = 0; j < fallbacks[i]!.words.length; j += 1) {
          if (words.includes(fallbacks[i]!.words[j] as string)) {
            tmpWords.push(fallbacks[i]?.words[j])
          }
        }

        if (JSON.stringify(tmpWords) === JSON.stringify(fallbacks[i]?.words)) {
          this._nluResult.entities = []
          this._nluResult.classification.domain = fallbacks[i]
            ?.domain as NLPDomain
          this._nluResult.classification.skill = fallbacks[i]?.skill as NLPSkill
          this._nluResult.classification.action = fallbacks[i]
            ?.action as NLPAction
          this._nluResult.classification.confidence = 1

          LogHelper.success('Fallback found')
          return this._nluResult
        }
      }
    }

    return null
  }
}
