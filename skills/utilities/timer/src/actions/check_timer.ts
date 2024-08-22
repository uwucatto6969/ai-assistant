import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'

import { TimerWidget } from '../widgets/timer-widget'
import { getNewestTimerMemory } from '../lib/memory'

export const run: ActionFunction = async function () {
  const timerMemory = await getNewestTimerMemory()

  if (!timerMemory) {
    return await leon.answer({ key: 'no_timer_set' })
  }

  const { widgetId, interval, finishedAt, duration } = timerMemory
  const remainingTime = finishedAt - Math.floor(Date.now() / 1_000)

  const timerWidget = new TimerWidget({
    params: {
      id: widgetId,
      seconds: remainingTime <= 0 ? 0 : remainingTime,
      initialDuration: duration,
      interval
    }
  })

  await leon.answer({ widget: timerWidget })
}
