import { STTParserBase } from '@/core/stt/stt-parser-base'
import { LogHelper } from '@/helpers/log-helper'
import { BRAIN, PYTHON_TCP_CLIENT, SOCKET_SERVER } from '@/core'

export default class LocalParser extends STTParserBase {
  protected readonly name = 'Local STT Parser'

  constructor() {
    super()

    LogHelper.title(this.name)
    LogHelper.success('New instance')

    try {
      LogHelper.success('Parser initialized')
    } catch (e) {
      LogHelper.error(`${this.name} - Failed to initialize: ${e}`)
    }
  }

  /**
   * Read audio buffer and return the transcript (decoded string)
   */
  public async parse(): Promise<string | null> {
    const newSpeechEventName = 'asr-new-speech'
    const endOfOwnerSpeechDetected = 'asr-end-of-owner-speech-detected'
    const newSpeechEventHasListeners =
      PYTHON_TCP_CLIENT.ee.listenerCount(newSpeechEventName) > 0
    const endOfOwnerSpeechDetectedHasListeners =
      PYTHON_TCP_CLIENT.ee.listenerCount(endOfOwnerSpeechDetected) > 0

    if (!newSpeechEventHasListeners) {
      PYTHON_TCP_CLIENT.ee.on(newSpeechEventName, (data) => {
        /**
         * If Leon is talking with voice, then interrupt him
         */
        if (BRAIN.isTalkingWithVoice) {
          BRAIN.setIsTalkingWithVoice(false, { shouldInterrupt: true })
        }

        // Send the owner speech to the client
        SOCKET_SERVER.socket?.emit('asr-speech', data.text)
      })
    }

    if (!endOfOwnerSpeechDetectedHasListeners) {
      PYTHON_TCP_CLIENT.ee.on(endOfOwnerSpeechDetected, (data) => {
        SOCKET_SERVER.socket?.emit('asr-end-of-owner-speech', {
          completeSpeech: data.utterance
        })
      })
    }

    return null
  }
}
