import { createElement } from 'react'
import * as auroraComponents from '@leon-ai/aurora'

export default function renderAuroraComponent(component, supportedEvents) {
  if (component) {
    // eslint-disable-next-line import/namespace
    const reactComponent = auroraComponents[component.component]

    console.log('auroraComponents', auroraComponents)
    console.log('component.component', component.component)
    console.log('reactComponent', reactComponent)
    console.log('component.props', component.props)

    // Check if the browsed component has a supported event and bind it
    if (
      component.events[0] &&
      supportedEvents.includes(component.events[0].type)
    ) {
      const eventType = component.events[0].type

      component.props[eventType] = (arg) => {
        // TODO
        console.log('should emit event', eventType, component)
        console.log('arg', arg)
      }
    }

    // When children is a component, then wrap it in an array to render properly
    const isComponent = !!component.props?.children?.component
    if (isComponent) {
      component.props.children = [component.props.children]
    }

    if (component.props?.children && Array.isArray(component.props.children)) {
      component.props.children = component.props.children.map((child) => {
        return renderAuroraComponent(child, supportedEvents)
      })
    }

    return createElement(reactComponent, component.props)
  }
}
