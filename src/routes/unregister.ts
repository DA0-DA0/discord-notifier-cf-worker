import { AuthorizedRequest, Env } from '../types'
import { v1WebhooksKey, v2WebhooksKey, respond, respondError } from '../utils'

export const unregister = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const { id } = request.parsedBody.data
  if (!id) {
    return respondError(400, 'Missing `id`.')
  }

  // Delete webhook.
  await Promise.all([
    env.WEBHOOKS.delete(
      v1WebhooksKey(
        request.parsedBody.data.auth.chainId,
        request.dao,
        request.parsedBody.data.auth.publicKey,
        id
      )
    ),
    env.WEBHOOKS.delete(
      v2WebhooksKey(
        request.parsedBody.data.auth.chainId,
        request.dao,
        request.parsedBody.data.auth.publicKey,
        id
      )
    ),
  ])

  return respond(200, {
    success: true,
  })
}
