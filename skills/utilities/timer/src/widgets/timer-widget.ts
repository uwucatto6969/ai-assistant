import type { WidgetComponent } from '@sdk/widget-component'
import { Widget, type WidgetEventMethod, type WidgetOptions } from '@sdk/widget'

import { Timer } from './components/timer'

interface Params {
  seconds: number
  interval: number
  initialDuration?: number
  id?: string
}

export class TimerWidget extends Widget<Params> {
  constructor(options: WidgetOptions<Params>) {
    super(options)

    if (options.params.id) {
      this.id = options.params.id
    }
  }

  /**
   * TODO
   * 1. Save timer + timer id in memory
   * 2. On rendering, set widget id to timer id
   * 3. When load feed, need to fetch all timers (onFetch?) as per their timer id. Need a built-in API here
   * While fetching, set Aurora loader component for all components
   * 4. onEnd (or onChange and check if done?), then trigger next action or utterance
   */

  // TODO: rewrite Loader component? To accept children and set it for all components with onFetch by default
  // TODO: <Loader isLoading={isFetching}>content...</Loader>

  public render(): WidgetComponent {
    const { seconds, interval, initialDuration } = this.params
    const secondUnitContent = this.content('second_unit')
    const secondsUnitContent = this.content('seconds_unit')
    const minuteUnitContent = this.content('minute_unit')
    const minutesUnitContent = this.content('minutes_unit')
    const totalTime = initialDuration || seconds
    let totalTimeContent = ''

    if (totalTime >= 60) {
      const minutes = totalTime / 60

      totalTimeContent = this.content('total_time', {
        value: minutes % 1 === 0 ? minutes : minutes.toFixed(2),
        unit: minutes > 1 ? minutesUnitContent : minuteUnitContent
      })
    } else {
      totalTimeContent = this.content('total_time', {
        value: totalTime,
        unit: totalTime > 1 ? secondsUnitContent : secondUnitContent
      })
    }

    return new Timer({
      initialTime: seconds,
      interval,
      totalTimeContent,
      onEnd: (): WidgetEventMethod => {
        return this.sendUtterance('times_up', {
          from: 'leon'
        })
      }
    })
  }
}
