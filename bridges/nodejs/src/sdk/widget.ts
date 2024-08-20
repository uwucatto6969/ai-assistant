import { type WidgetWrapperProps } from '@leon-ai/aurora'

import { INTENT_OBJECT, SKILL_CONFIG } from '@bridge/constants'
import { WidgetComponent } from '@sdk/widget-component'

type UtteranceSender = 'leon' | 'owner'

interface FetchWidgetDataWidgetEventMethodParams {
  actionName: string
  widgetId: string
  dataToSet: string[]
}
interface SendUtteranceWidgetEventMethodParams {
  from: UtteranceSender
  utterance: string
}
interface RunSkillActionWidgetEventMethodParams {
  actionName: string
  params: Record<string, unknown>
}
interface SendUtteranceOptions {
  from?: UtteranceSender
  data?: Record<string, unknown>
}

export interface WidgetEventMethod {
  methodName: 'send_utterance' | 'run_skill_action' | 'fetch_widget_data'
  methodParams:
    | SendUtteranceWidgetEventMethodParams
    | RunSkillActionWidgetEventMethodParams
    | FetchWidgetDataWidgetEventMethodParams
}
export interface WidgetOptions<T = unknown> {
  wrapperProps?: Omit<WidgetWrapperProps, 'children'>
  params: T
}

export abstract class Widget<T = unknown> {
  public actionName: string
  public id: string
  public widget: string
  public wrapperProps: WidgetOptions<T>['wrapperProps']
  public params: WidgetOptions<T>['params']

  protected constructor(options: WidgetOptions<T>) {
    if (options?.wrapperProps) {
      this.wrapperProps = options.wrapperProps
    }
    this.actionName = `${INTENT_OBJECT.domain}:${INTENT_OBJECT.skill}:${INTENT_OBJECT.action}`
    this.widget = this.constructor.name
    this.id = `${this.widget.toLowerCase()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`
    this.params = options.params
  }

  /**
   * Render the widget
   */
  public abstract render(): WidgetComponent<unknown>

  /**
   * Indicate the core to send a given utterance
   * @param key The key of the content
   * @param options The options of the utterance
   * @example content('provider_selected', { data: { provider: 'Spotify' } }) // 'I chose the Spotify provider'
   */
  protected sendUtterance(
    key: string,
    options?: SendUtteranceOptions
  ): WidgetEventMethod {
    const utteranceContent = this.content(key, options?.data)
    const from = options?.from || 'owner'

    return {
      methodName: 'send_utterance',
      methodParams: {
        from,
        utterance: utteranceContent
      }
    }
  }

  /**
   * Indicate the core to run a given skill action
   * @param actionName The name of the action
   * @param params The parameters of the action
   * @example runSkillAction('music_audio:player:next', { provider: 'Spotify' })
   */
  protected runSkillAction(
    actionName: string,
    params: Record<string, unknown>
  ): WidgetEventMethod {
    return {
      methodName: 'run_skill_action',
      methodParams: {
        actionName,
        params
      }
    }
  }

  /**
   * Indicate the core to fetch/set the data of a given widget
   * @param dataToSet Data to set on fetch
   * @example fetchWidgetData('timer-f42wa', { initialTime: 42 })
   */
  protected fetchWidgetData(dataToSet: string[]): WidgetEventMethod {
    return {
      methodName: 'fetch_widget_data',
      methodParams: {
        actionName: this.actionName,
        widgetId: this.id,
        dataToSet
      }
    }
  }

  /**
   * Grab and compute the target content of the widget
   * @param key The key of the content
   * @param data The data to apply
   * @example content('select_provider') // 'Please select a provider'
   * @example content('provider_selected', { provider: 'Spotify' }) // 'I chose the Spotify provider'
   */
  protected content(key: string, data?: Record<string, unknown>): string {
    const { widget_contents: widgetContents } = SKILL_CONFIG

    if (!widgetContents || !widgetContents[key]) {
      return 'INVALID'
    }

    let content = widgetContents[key]

    if (Array.isArray(content)) {
      content = content[Math.floor(Math.random() * content.length)] as string
    }

    if (data) {
      for (const key in data) {
        content = content.replaceAll(`%${key}%`, String(data[key]))
      }
    }

    return content
  }
}
