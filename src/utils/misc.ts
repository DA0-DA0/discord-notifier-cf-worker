import { Env, V1Webhook, V2Webhook } from '../types'

export const v1WebhooksKey = (
  chainId: string,
  dao: string,
  publicKey: string,
  id: string
) => `${chainId}:${dao}:${publicKey}:${id}`

export const v1WebhooksForDaoPrefix = (chainId: string, dao: string) =>
  `${chainId}:${dao}:`

export const v2WebhooksKey = (
  chainId: string,
  dao: string,
  publicKey: string,
  id: string
) => `v2:${chainId}:${dao}:${publicKey}:${id}`

export const v2WebhooksForDaoPrefix = (chainId: string, dao: string) =>
  `v2:${chainId}:${dao}:`

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

/**
 * Load all webhooks, coercing V1 webhooks to the V2 shape.
 */
export const v2WebhooksForV1AndV2Keys = async (
  env: Env,
  v1Keys: string[],
  v2Keys: string[]
): Promise<V2Webhook[]> => [
  // Coerce V1 webhooks to V2.
  ...(
    await Promise.all(
      v1Keys.map(async (v1Key): Promise<V2Webhook | []> => {
        const webhook: V1Webhook | null = await env.WEBHOOKS.get(v1Key, 'json')
        // Webhook may not exist if it was deleted recently as KV stores take
        // time to propagate.
        if (!webhook) {
          return []
        }

        return {
          webhook,
          botToken: env.DISCORD_BOT_TOKEN,
        }
      })
    )
  ).flat(),
  // V2 webhooks.
  ...(
    await Promise.all(
      v2Keys.map(
        async (v2Key): Promise<V2Webhook | []> =>
          // Webhook may not exist if it was deleted recently as KV stores take
          // time to propagate.
          (await env.WEBHOOKS.get(v2Key, 'json')) || []
      )
    )
  ).flat(),
]
