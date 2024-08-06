import { Widget, type WidgetOptions } from '@sdk/widget'
import { type WidgetComponent } from '@sdk/widget-component'
import {
  Button,
  Flexbox,
  List,
  ListHeader,
  ListItem,
  Checkbox,
  Link
} from '@sdk/aurora'

interface Params {
  value1: string
  value2: string
}

// TODO
function runSkillAction(actionName, params) {
  return {
    method: 'run_skill_action',
    params: {
      actionName,
      params
    }
  }
}
// TODO
function sendUtterance(utterance) {
  return {
    method: 'send_utterance',
    params: {
      utterance
    }
  }
}

export class PlaygroundTestWidget extends Widget<Params> {
  constructor(options: WidgetOptions<Params>) {
    super(options)
  }

  public render(): WidgetComponent {
    const children = this.params.value1 + ' ' + this.params.value2

    // TODO: timer

    // TODO
    return new Flexbox({
      gap: 'md',
      flexDirection: 'column',
      children: [
        new Link({
          href: 'https://getleon.ai',
          children: 'Test link'
        }),
        new List({
          children: [
            new ListHeader({
              children: 'Shopping List'
            }),
            new ListItem({
              children: new Checkbox({
                value: 'Milk',
                label: 'Milk',
                checked: true
              })
            }),
            new ListItem({
              children: new Checkbox({
                value: 'Eggs',
                label: 'Eggs',
                checked: false
              })
            }),
            new ListItem({
              children: new Checkbox({
                value: 'Bread',
                label: 'Bread',
                checked: true
              })
            })
          ]
        }),
        new List({
          children: [
            new ListHeader({
              children: 'Select your music provider'
            }),
            new ListItem({
              children: new Button({
                children: 'Spotify',
                onClick: () => {
                  return runSkillAction('play_music', 'spotify')
                }
              })
            }),
            new ListItem({
              children: new Button({
                children: 'Apple Music',
                onClick: () => {
                  return runSkillAction('play_music', 'apple_music')
                }
              })
            }),
            new ListItem({
              children: new Button({
                children: 'YouTube Music',
                onClick: () => {
                  return runSkillAction('play_music', 'youtube_music')
                }
              })
            })
          ]
        })
        // TODO: form input
      ]
    })
  }
}
