import type { ActionFunction } from '@sdk/types'
import { leon } from '@sdk/leon'

export const run: ActionFunction = async function (params) {
  // TODO
  await leon.answer({ key: 'just a test' })
}
