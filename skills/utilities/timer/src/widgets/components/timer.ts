import { WidgetComponent } from '@sdk/widget-component'

interface TimerProps {
  initialTime: number
  interval: number
  totalTimeContent: string
  onEnd?: () => void
}

export class Timer extends WidgetComponent<TimerProps> {
  constructor(props: TimerProps) {
    super(props)
  }
}
