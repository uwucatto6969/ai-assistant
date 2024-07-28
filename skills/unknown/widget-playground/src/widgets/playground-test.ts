import { Widget, type WidgetOptions } from '@sdk/widget'
import { type WidgetComponent } from '@sdk/widget-component'
import { Button } from '@sdk/aurora'

interface Params {
  value1: string
  value2: string
}

export class PlaygroundTestWidget extends Widget<Params> {
  constructor(options: WidgetOptions<Params>) {
    super(options)
  }

  public render(): WidgetComponent {
    function testo() {
      console.log('testo')
      return 'testi'
    }

    const children = this.params.value1 + ' ' + this.params.value2
    return new Button({
      children,
      secondary: true,
      onClick: (): void => {
        console.log('test')
      }
    })
  }
}
