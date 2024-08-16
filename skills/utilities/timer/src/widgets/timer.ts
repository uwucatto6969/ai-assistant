import { Widget, type WidgetEventMethod, type WidgetOptions } from '@sdk/widget'
import { type WidgetComponent } from '@sdk/widget-component'

import { Timer } from './components/timer'

interface Params {
  seconds: number
}

export class TimerWidget extends Widget<Params> {
  constructor(options: WidgetOptions<Params>) {
    super(options)
  }

  /**
   * TODO
   * 1. Save timer + timer id in memory
   * 2. On rendering, set widget id to timer id
   * 3. When load feed, need to fetch all timers (onFetch?) as per their timer id. Need a built-in API here
   * 4. onEnd (or onChange and check if done?), then trigger next action or utterance
   */

  public render(): WidgetComponent {
    const { seconds } = this.params
    const secondUnitContent = this.content('second_unit')
    const secondsUnitContent = this.content('seconds_unit')
    const minuteUnitContent = this.content('minute_unit')
    const minutesUnitContent = this.content('minutes_unit')
    let totalTimeContent = ''

    if (seconds >= 60) {
      const minutes = seconds / 60

      totalTimeContent = this.content('total_time', {
        value: minutes % 1 === 0 ? minutes : minutes.toFixed(2),
        unit: minutes > 1 ? minutesUnitContent : minuteUnitContent
      })
    } else {
      totalTimeContent = this.content('total_time', {
        value: seconds,
        unit: seconds > 1 ? secondsUnitContent : secondUnitContent
      })
    }

    return new Timer({
      initialTime: seconds,
      interval: 1_000,
      totalTimeContent,
      onEnd: (): WidgetEventMethod => {
        return this.sendUtterance('times_up', {
          from: 'leon'
        })
      }
    })
  }
}
