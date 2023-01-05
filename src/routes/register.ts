import { AuthorizedRequest, Env } from '../types'
import { webhooksKey, respond, respondError } from '../utils'

export const register = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const { code, redirectUri } = request.parsedBody.data
  if (!code) {
    return respondError(400, 'Missing `code`.')
  }
  if (!redirectUri) {
    return respondError(400, 'Missing `redirectUri`.')
  }

  // Authenticate with Discord API and create a webhook.
  const response = (await (
    await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
  ).json()) as {
    webhook: { id: string }
  }

  if (!response.webhook) {
    return respond(500, {
      success: false,
      error: 'No webhook returned.',
      response,
    })
  }

  // Store webhook.
  await env.WEBHOOKS.put(
    webhooksKey(
      request.parsedBody.data.auth.chainId,
      request.dao,
      request.parsedBody.data.auth.publicKey,
      response.webhook.id
    ),
    JSON.stringify(response.webhook)
  )

  return respond(200, {
    success: true,
  })
}
