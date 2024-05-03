import fs from 'node:fs'

import type { Llama, LlamaModel } from 'node-llama-cpp'

import {
  HAS_LLM,
  HAS_LLM_NLG,
  LLM_MINIMUM_FREE_RAM,
  LLM_MINIMUM_TOTAL_RAM,
  LLM_NAME_WITH_VERSION,
  LLM_PATH
} from '@/constants'
import { LogHelper } from '@/helpers/log-helper'
import { SystemHelper } from '@/helpers/system-helper'

type LLMManagerLlama = Llama | null
type LLMManagerModel = LlamaModel | null

// Set to 0 to use the maximum threads supported by the current machine hardware
export const LLM_THREADS = 4

/**
 * node-llama-cpp beta 3 docs:
 * @see https://github.com/withcatai/node-llama-cpp/pull/105
 */
export default class LLMManager {
  private static instance: LLMManager
  private _isLLMEnabled = false
  private _isLLMNLGEnabled = false
  private _llama: LLMManagerLlama = null
  private _model: LLMManagerModel = null

  get llama(): Llama {
    return this._llama as Llama
  }

  get model(): LlamaModel {
    return this._model as LlamaModel
  }

  get isLLMEnabled(): boolean {
    return this._isLLMEnabled
  }

  get isLLMNLGEnabled(): boolean {
    return this._isLLMNLGEnabled
  }

  constructor() {
    if (!LLMManager.instance) {
      LogHelper.title('LLM Manager')
      LogHelper.success('New instance')

      LLMManager.instance = this
    }
  }

  public async loadLLM(): Promise<void> {
    LogHelper.title('LLM Manager')

    if (!HAS_LLM) {
      LogHelper.warning(
        'LLM is not enabled because you have explicitly disabled it'
      )

      return
    }

    const freeRAMInGB = SystemHelper.getFreeRAM()
    const totalRAMInGB = SystemHelper.getTotalRAM()
    const isLLMPathFound = fs.existsSync(LLM_PATH)
    const isCurrentFreeRAMEnough = LLM_MINIMUM_FREE_RAM <= freeRAMInGB
    const isTotalRAMEnough = LLM_MINIMUM_TOTAL_RAM <= totalRAMInGB

    /**
     * In case the LLM is not set up and
     * the current free RAM is enough to load the LLM
     */
    if (!isLLMPathFound && isCurrentFreeRAMEnough) {
      LogHelper.warning(
        'The LLM is not set up yet whereas the current free RAM is enough to enable it. You can run the following command to set it up: "npm install"'
      )

      return
    }
    /**
     * In case the LLM is set up and
     * the current free RAM is not enough to load the LLM
     */
    if (isLLMPathFound && !isCurrentFreeRAMEnough) {
      LogHelper.warning(
        'There is not enough free RAM to load the LLM. So the LLM will not be enabled.'
      )

      return
    }

    /**
     * In case the LLM is not found and
     * the total RAM is enough to load the LLM
     */
    if (!isLLMPathFound && isTotalRAMEnough) {
      LogHelper.warning(
        `LLM is not enabled because it is not found at "${LLM_PATH}". Run the following command to set it up: "npm install"`
      )

      return
    }

    try {
      const { LlamaLogLevel, getLlama } = await Function(
        'return import("node-llama-cpp")'
      )()

      this._llama = await getLlama({
        logLevel: LlamaLogLevel.debug
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      this._model = await this._llama.loadModel({
        modelPath: LLM_PATH
      })
      this._isLLMEnabled = true

      if (HAS_LLM_NLG) {
        this._isLLMNLGEnabled = true
      }

      LogHelper.success(`${LLM_NAME_WITH_VERSION} LLM has been loaded`)
    } catch (e) {
      LogHelper.error(`LLM Manager failed to load: ${e}`)
    }
  }
}
