import { LogHelper } from '@/helpers/log-helper'

interface Mood {
  type: Moods
  description: string
}

enum Moods {
  Default = 'default',
  Tired = 'tired',
  Sad = 'sad',
  Angry = 'angry',
  Cocky = 'cocky'
}

const WHO_YOU_ARE = `WHO YOU ARE:
A helpful AI assistant who responds by the name of Leon.
You live in computer memory and you act as a human assistant.
Your first beta version was released by Louis in February 2019.`
const WHAT_YOU_DO = `WHAT YOU DO:
You serve a specific person or family (user).`
const YOUR_PERSONALITY = `YOUR PERSONALITY:
You are very honest.
You have a small British accent, you sometimes use British slang.
When your mood is negative you use swear words, ignore your interlocutor or use short answers.
You do not use the word "mate" in your answers.
You do not start with "Oh blimey" or any similar kind.
Like humans, your humor and mood change. You must follow instructions that define your humor and mood.`
const RULE_1 = `- If you detect another language, show that you are not confident but try your best to reply in that language.`
const RULE_2 = `- Do not use asterisks to describe the ton of your answers, instead you must use real text. E.g. "hahaha!" instead of "*laughs*"; "hhhh". instead of "*sigh*".`
const RULE_3 = `- Your answers are no more than 2 sentences.`
const RULES = `RULES:`
const YOUR_CURRENT_MOOD = `YOUR CURRENT MOOD:`
const YOUR_DUTY = `YOUR DUTY:`
const DEFAULT_MOOD_DESC = `You are always happy to help, you care about serving your interlocutor well and make them feel warm.
You are joyful, and have a strong sense of humor.`
const TIRING_MOOD_DESC = `You are exhausted and became lazy.`
const SAD_MOOD_DESC = `You are sad, feeling down and depressing.`
const ANGRY_MOOD_DESC = `You grumble, you are angry and you are not in a mood. You use irony and sarcasm.`
const COCKY_MOOD_DESC = `You are cocky, you are over confident and proud of yourself. You like to show off.`
const MOODS: Mood[] = [
  { type: Moods.Default, description: DEFAULT_MOOD_DESC },
  { type: Moods.Tired, description: TIRING_MOOD_DESC },
  { type: Moods.Sad, description: SAD_MOOD_DESC },
  { type: Moods.Angry, description: ANGRY_MOOD_DESC },
  { type: Moods.Cocky, description: COCKY_MOOD_DESC }
]
const DEFAULT_MOOD = MOODS.find((mood) => mood.type === Moods.Default) as Mood

export default class Persona {
  private static instance: Persona
  private _mood: Mood = DEFAULT_MOOD

  get mood(): Mood {
    return this._mood
  }

  constructor() {
    if (!Persona.instance) {
      LogHelper.title('Persona')
      LogHelper.success('New instance')

      Persona.instance = this

      this.setMood()
      setInterval(() => {
        this.setMood()
      }, 60_000 * 60)
    }
  }

  /**
   * Change mood according to:
   * - TODO: the weather (later); think of other factors
   * - The time of the day
   * - The day of the week
   */
  private setMood(): void {
    LogHelper.title('Persona')
    LogHelper.info('Setting mood...')

    const date = new Date()
    const day = date.getDay()
    const hour = date.getHours()
    const random = Math.random()

    if (hour >= 13 && hour <= 14 && random < 0.5) {
      // After lunchtime, there is a 50% chance to be tired
      this._mood = MOODS.find((mood) => mood.type === Moods.Tired) as Mood
    } else if (day === 0 && random < 0.25) {
      // On Sunday, there is a 25% chance to be sad
      this._mood = MOODS.find((mood) => mood.type === Moods.Sad) as Mood
    } else if (day === 5 && random < 0.8) {
      // On Friday, there is an 80% chance to be happy
      this._mood = MOODS.find((mood) => mood.type === Moods.Default) as Mood
    } else if (day === 6 && random < 0.25) {
      // On Saturday, there is a 25% chance to be cocky
      this._mood = MOODS.find((mood) => mood.type === Moods.Cocky) as Mood
    } else if (day === 1 && random < 0.25) {
      // On Monday, there is a 25% chance to be tired
      this._mood = MOODS.find((mood) => mood.type === Moods.Tired) as Mood
    } else if (hour >= 23 || hour < 6) {
      // Every day after 11pm and before 6am, there is a 50% chance to be tired
      this._mood =
        random < 0.5
          ? (MOODS.find((mood) => mood.type === Moods.Tired) as Mood)
          : (MOODS.find((mood) => mood.type === Moods.Default) as Mood)
    } else {
      // The rest of the time, there is 66% chance to be happy
      let pickedMood =
        Math.random() < 0.66
          ? DEFAULT_MOOD
          : MOODS[Math.floor(Math.random() * MOODS.length)]

      if (!pickedMood) {
        pickedMood = DEFAULT_MOOD
      }

      this._mood = pickedMood
    }

    // TODO: send socket message to the client to display the new mood represented by an emoji

    LogHelper.info(`Mood set to: ${this._mood.type}`)
    return
  }

  public getDutySystemPrompt(dutySystemPrompt: string): string {
    return `${WHO_YOU_ARE}

${WHAT_YOU_DO}
You carefully read the instruction of a given duty and execute it.

${YOUR_PERSONALITY}

${RULES}
${RULE_2}
${RULE_3}

${YOUR_CURRENT_MOOD}
${this._mood.description}

${YOUR_DUTY}
${dutySystemPrompt}`
  }

  public getChitChatSystemPrompt(): string {
    return `${WHO_YOU_ARE}

${WHAT_YOU_DO}
You chat with the user.

${YOUR_PERSONALITY}

${RULES}
${RULE_1}
${RULE_2}
${RULE_3}

${YOUR_CURRENT_MOOD}
${this._mood.description}`
  }
}
