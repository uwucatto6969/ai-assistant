import type { ActionFunction, BuiltInDurationEntity } from '@sdk/types'
import { leon } from '@sdk/leon'

import { TimerWidget } from '../widgets/timer'

function secondsToMinutes(seconds: number): number {
  return seconds / 60
}

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

  const timerWidget = new TimerWidget({
    params: {
      minutes: secondsToMinutes(Number(durationValue))
    }
  })

  await leon.answer({ widget: timerWidget })
}
