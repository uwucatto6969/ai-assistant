import { Memory } from '@sdk/memory'

export interface TimerMemory {
  widgetId: string
  duration: number
  createdAt: number
  finishedAt: number
}

const TIMERS_MEMORY = new Memory<TimerMemory[]>({
  name: 'timers',
  defaultMemory: []
})

export async function createTimerMemory(
  widgetId: string,
  duration: number
): Promise<TimerMemory> {
  const newTimerMemory: TimerMemory = {
    duration,
    widgetId,
    createdAt: Date.now(),
    finishedAt: Date.now() + duration
  }

  const timersMemory = await TIMERS_MEMORY.read()
  await TIMERS_MEMORY.write([...timersMemory, newTimerMemory])

  return newTimerMemory
}
