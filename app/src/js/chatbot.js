import { createRoot } from 'react-dom/client'
import axios from 'axios'

import renderAuroraComponent from './render-aurora-component'

export default class Chatbot {
  constructor(socket, serverURL) {
    this.socket = socket
    this.serverURL = serverURL
    this.et = new EventTarget()
    this.feed = document.querySelector('#feed')
    this.typing = document.querySelector('#is-typing')
    this.noBubbleMessage = document.querySelector('#no-bubble')
    this.bubbles = localStorage.getItem('bubbles')
    this.parsedBubbles = JSON.parse(this.bubbles)
  }

  async init() {
    await this.loadFeed()
    this.scrollDown()

    this.et.addEventListener('to-leon', (event) => {
      this.createBubble({
        who: 'me',
        string: event.detail
      })
    })

    this.et.addEventListener('me-received', (event) => {
      this.createBubble({
        who: 'leon',
        string: event.detail
      })
    })
  }

  sendTo(who, string) {
    if (who === 'leon') {
      this.et.dispatchEvent(new CustomEvent('to-leon', { detail: string }))
    }
  }

  receivedFrom(who, string) {
    if (who === 'leon') {
      this.et.dispatchEvent(new CustomEvent('me-received', { detail: string }))
    }
  }

  isTyping(who, value) {
    if (who === 'leon') {
      if (value) {
        this.enableTyping()
      } else if (value === false) {
        this.disableTyping()
      }
    }
  }

  enableTyping() {
    if (!this.typing.classList.contains('on')) {
      this.typing.classList.add('on')
    }
  }

  disableTyping() {
    if (this.typing.classList.contains('on')) {
      this.typing.classList.remove('on')
    }
  }

  scrollDown() {
    this.feed.scrollTo(0, this.feed.scrollHeight)
  }

  loadFeed() {
    return new Promise((resolve) => {
      if (this.parsedBubbles === null || this.parsedBubbles.length === 0) {
        this.noBubbleMessage.classList.remove('hide')
        localStorage.setItem('bubbles', JSON.stringify([]))
        this.parsedBubbles = []
        resolve()
      } else {
        for (let i = 0; i < this.parsedBubbles.length; i += 1) {
          const bubble = this.parsedBubbles[i]

          this.createBubble({
            who: bubble.who,
            string: bubble.string,
            save: false,
            isCreatingFromLoadingFeed: true
          })

          if (i + 1 === this.parsedBubbles.length) {
            setTimeout(() => {
              resolve()
            }, 100)
          }
        }
      }
    })
  }

  createBubble(params) {
    const {
      who,
      string,
      save = true,
      bubbleId,
      isCreatingFromLoadingFeed = false
    } = params
    const container = document.createElement('div')
    const bubble = document.createElement('p')

    container.className = `bubble-container ${who}`
    bubble.className = 'bubble'

    const formattedString = this.formatMessage(string)

    bubble.innerHTML = formattedString

    if (bubbleId) {
      container.classList.add(bubbleId)
    }

    this.feed.appendChild(container).appendChild(bubble)

    let widgetComponentTree = null
    let widgetSupportedEvents = null

    /**
     * Widget rendering
     */
    if (
      formattedString.includes &&
      formattedString.includes('"component":"WidgetWrapper"')
    ) {
      const parsedWidget = JSON.parse(formattedString)
      container.setAttribute('data-widget-id', parsedWidget.id)

      widgetComponentTree = parsedWidget.componentTree
      widgetSupportedEvents = parsedWidget.supportedEvents

      /**
       * On widget fetching
       */
      if (isCreatingFromLoadingFeed && parsedWidget.onFetchAction) {
        const container = document.querySelector(
          `[data-widget-id="${parsedWidget.id}"]`
        )
        const root = createRoot(container)

        // TODO: widget fetching
        // TODO: inject Loader component in the componentTree to show loading state + refactor

        // TODO: fix several fetch/widgets + parse string on loading (need loading state first)
        // TODO: grab specific widgetid
        const qs = `skill_action=${parsedWidget.onFetchAction}&widget_id=${parsedWidget.id}`
        axios
          .get(`${this.serverURL}/api/v1/fetch-widget?${qs}`)
          .then((data) => {
            const fetchedWidget = data.data.widget

            widgetComponentTree = fetchedWidget.componentTree

            const reactNode = renderAuroraComponent(
              this.socket,
              widgetComponentTree,
              widgetSupportedEvents
            )

            root.render(reactNode)
          })

        return container
      }

      /**
       * On widget creation
       */
      const root = createRoot(container)

      const reactNode = renderAuroraComponent(
        this.socket,
        widgetComponentTree,
        widgetSupportedEvents
      )

      root.render(reactNode)
    }

    if (save) {
      this.saveBubble(who, formattedString)
    }

    return container
  }

  saveBubble(who, string) {
    if (!this.noBubbleMessage.classList.contains('hide')) {
      this.noBubbleMessage.classList.add('hide')
    }

    if (this.parsedBubbles.length === 62) {
      this.parsedBubbles.shift()
    }

    this.parsedBubbles.push({ who, string })
    localStorage.setItem('bubbles', JSON.stringify(this.parsedBubbles))
    this.scrollDown()
  }

  formatMessage(message) {
    if (typeof message === 'string') {
      message = message.replace(/\n/g, '<br />')
    }

    return message
  }
}
