import type { ActionFunction, BuiltInDurationEntity } from '@sdk/types'
import { leon } from '@sdk/leon'

import { TimerWidget } from '../widgets/timer-widget'
import { createTimerMemory } from '../lib/memory'

export const run: ActionFunction = async function (params) {
  const supportedUnits = ['hours', 'minutes', 'seconds']
  const durations = (
    params.slots['duration']?.resolution as BuiltInDurationEntity['resolution']
  ).values
  const [duration] = durations

  if (!duration) {
    return leon.answer({ key: 'cannot_get_duration' })
  }

  const { unit } = duration
  if (!supportedUnits.includes(unit)) {
    return leon.answer({ key: 'unit_not_supported' })
  }

  const { value: durationValue } = duration
  const seconds = Number(durationValue)
  const interval = 1_000
  const timerWidget = new TimerWidget({
    params: {
      seconds,
      interval
    }
  })

  await createTimerMemory(timerWidget.id, seconds, interval)

  // TODO: return a speech without new utterance
  /*await leon.answer({
    widget: timerWidget,
    speech: 'I set a timer for ... ...'
  })*/
  await leon.answer({ widget: timerWidget })
}
