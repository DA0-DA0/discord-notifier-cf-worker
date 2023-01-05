import { Env } from '../types'

export const webhooksKey = (
  chainId: string,
  dao: string,
  publicKey: string,
  id: string
) => `${chainId}:${dao}:${publicKey}:${id}`

export const webhooksForDaoPrefix = (chainId: string, dao: string) =>
  `${chainId}:${dao}:`

export const allWebhookKeysForPrefix = async (
  env: Env,
  prefix: string
): Promise<string[]> => {
  const allKeys: string[] = []

  let cursor: string | undefined
  while (true) {
    const {
      keys,
      list_complete: listComplete,
      cursor: newCursor,
    } = await env.WEBHOOKS.list({
      prefix,
      cursor,
    })
    allKeys.push(...keys.map((k) => k.name))
    if (listComplete) {
      break
    }
    cursor = newCursor
  }

  return allKeys
}
