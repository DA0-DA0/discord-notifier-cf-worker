import { RequestWithDao, Env } from '../types'
import {
  allWebhookKeysForPrefix,
  objectMatchesStructure,
  respond,
  respondError,
  webhooksForDaoPrefix,
} from '../utils'

const BATCH_SIZE = 10
const RETRIES = 3

export const notify = async (
  request: RequestWithDao,
  env: Env
): Promise<Response> => {
  const { chainId } = request.params ?? {}
  if (!chainId) {
    return respondError(400, 'Missing `chainId`.')
  }

  const { apiKey, data } = await request.json?.()

  if (apiKey !== env.NOTIFY_API_KEY) {
    return respondError(401, 'Invalid API key.')
  }

  const allKeys = await allWebhookKeysForPrefix(
    env,
    webhooksForDaoPrefix(chainId, request.dao)
  )

  const webhooks: ({ id: string; url: string } | null)[] = await Promise.all(
    allKeys.map(async (k) => await env.WEBHOOKS.get(k, 'json'))
  )

  // Fire webhooks in batches.
  let succeeded = 0
  for (let i = 0; i < webhooks.length; i += BATCH_SIZE) {
    const batch = webhooks.slice(i, i + BATCH_SIZE)

    const responses = await Promise.all(
      batch.map(async (webhook, index) => {
        // Webhook may not exist if it was deleted recently as KV stores take
        // time to propagate.
        if (
          !webhook ||
          !objectMatchesStructure(webhook, {
            id: {},
            url: {},
          })
        ) {
          return
        }

        const { id, url } = webhook

        for (let i = RETRIES; i > 0; i--) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
            console.log(
              `Sent notification to ${url} for ${chainId}/${
                request.dao
              }. Status: ${response.status}. Response: ${await response
                .text()
                .catch(() => '')}`
            )
            return true
          } catch (err) {
            // If retries left, continue.
            if (i > 1) {
              continue
            }

            // If out of retries, log and remove webhook.
            console.error(err)
            console.error(
              `Removing webhook ${id} with URL ${url} for ${chainId}/${request.dao} after 3 failures. ${err}`
            )
            await env.WEBHOOKS.delete(allKeys[index])
            return false
          }
        }
      })
    )

    succeeded += responses.filter(Boolean).length
  }

  return respond(200, {
    success: true,
    count: succeeded,
  })
}
