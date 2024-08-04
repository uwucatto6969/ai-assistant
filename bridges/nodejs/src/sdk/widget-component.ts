type Events = (typeof SUPPORTED_EVENTS)[number]
interface Event {
  type: Events
  id: string
}

const SUPPORTED_EVENTS = ['onClick'] as const

function generateId(): string {
  return Math.random().toString(36).substring(2, 7)
}

export abstract class WidgetComponent<T = unknown> {
  public readonly component: string
  public readonly id: string
  public readonly props: T
  public readonly events: Event[]

  protected constructor(props: T) {
    this.component = this.constructor.name
    this.id = `${this.component.toLowerCase()}-${generateId()}`
    this.props = props
    this.events = this.parseEvents()
  }

  private parseEvents(): Event[] {
    if (!this.props) {
      return []
    }

    const eventTypes = Object.keys(this.props).filter(
      (key) => key.startsWith('on') && SUPPORTED_EVENTS.includes(key as Events)
    ) as Events[]

    return eventTypes.map((type) => ({
      type,
      id: `${this.id}_${type.toLowerCase()}-${generateId()}`
    }))
  }
}
