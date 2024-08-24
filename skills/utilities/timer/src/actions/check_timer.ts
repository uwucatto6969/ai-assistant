import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'

import { TimerWidget } from '../widgets/timer-widget'
import { getByWidgetIdTimerMemory, getNewestTimerMemory } from '../lib/memory'

export const run: ActionFunction = async function (params) {
  const widgetId = params.current_entities.find(
    (entity) => entity.entity === 'widgetid'
  )?.sourceText
  let timerMemory

  if (widgetId) {
    timerMemory = await getByWidgetIdTimerMemory(widgetId)
  } else {
    timerMemory = await getNewestTimerMemory()
  }

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
    }
  })

  await leon.answer({ widget: timerWidget })
}
