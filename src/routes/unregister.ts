import { AuthorizedRequest, Env } from '../types'
import { webhooksKey, respond, respondError } from '../utils'

export const unregister = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const { id } = request.parsedBody.data
  if (!id) {
    return respondError(400, 'Missing `id`.')
  }

  // Delete webhook.
  await env.WEBHOOKS.delete(
    webhooksKey(
      request.parsedBody.data.auth.chainId,
      request.dao,
      request.parsedBody.data.auth.publicKey,
      id
    )
  )

  return respond(200, {
    success: true,
  })
}
