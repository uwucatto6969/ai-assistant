import { Widget, type WidgetOptions } from '@sdk/widget'
import { type WidgetComponent } from '@sdk/widget-component'
import { Flexbox, CircularProgress, Text } from '@sdk/aurora'

interface Params {
  minutes: number
}

export class TimerWidget extends Widget<Params> {
  constructor(options: WidgetOptions<Params>) {
    super(options)
  }

  /**
   * TODO
   * 1. Save timer + timer id in memory
   * 2. On rendering, set widget id to timer id
   * 3. When load feed, need to fetch all timers as per their timer id. Need a built-in API here
   */

  public render(): WidgetComponent {
    return new CircularProgress({
      value: 0,
      size: 'lg',
      children: new Flexbox({
        gap: 'xs',
        alignItems: 'center',
        justifyContent: 'center',
        children: [
          new Text({
            fontSize: 'lg',
            fontWeight: 'semi-bold',
            children: 0
          }),
          new Text({
            fontSize: 'xs',
            secondary: true,
            children: 'Total 10 minutes'
          })
        ]
      })
    })
  }
}
