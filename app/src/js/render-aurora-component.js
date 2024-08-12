import { createElement } from 'react'
import * as auroraComponents from '@leon-ai/aurora'

export default function renderAuroraComponent(
  socket,
  component,
  supportedEvents
) {
  if (component) {
    // eslint-disable-next-line import/namespace
    const reactComponent = auroraComponents[component.component]

    // Check if the browsed component has a supported event and bind it
    if (
      reactComponent &&
      component.events[0] &&
      supportedEvents.includes(component.events[0].type)
    ) {
      const eventType = component.events[0].type

      component.props[eventType] = (data) => {
        const { method } = component.events[0]

        socket.emit('widget-event', { method, data })
      }
    }

    // When children is a component, then wrap it in an array to render properly
    const isComponent = !!component.props?.children?.component
    if (isComponent) {
      component.props.children = [component.props.children]
    }

    if (component.props?.children && Array.isArray(component.props.children)) {
      component.props.children = component.props.children.map((child) => {
        return renderAuroraComponent(socket, child, supportedEvents)
      })
    }

    return createElement(reactComponent, component.props)
  }
}
