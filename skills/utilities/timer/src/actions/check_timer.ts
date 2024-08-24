import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'
import { getWidgetId } from '@sdk/toolbox'

import { TimerWidget } from '../widgets/timer-widget'
import { getTimerMemoryByWidgetId, getNewestTimerMemory } from '../lib/memory'

export const run: ActionFunction = async function () {
  const widgetId = getWidgetId()
  const timerMemory = widgetId
    ? await getTimerMemoryByWidgetId(widgetId)
    : await getNewestTimerMemory()

  if (!timerMemory) {
    return await leon.answer({ key: 'no_timer_set' })
  }

  const { interval, finishedAt, duration } = timerMemory
  const remainingTime = finishedAt - Math.floor(Date.now() / 1_000)
  const initialProgress = 100 - (remainingTime / duration) * 100

  const timerWidget = new TimerWidget({
    params: {
      id: widgetId ?? timerMemory.widgetId,
      seconds: remainingTime <= 0 ? 0 : remainingTime,
      initialProgress,
      initialDuration: duration,
      interval
    },
    onFetchAction: 'check_timer'
  })

  await leon.answer({ widget: timerWidget })
}
