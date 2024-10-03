import { AuthorizedRequest, DiscordWebhook, Env, V2Webhook } from '../types'
import {
  objectMatchesStructure,
  respond,
  respondError,
  v2WebhooksKey,
} from '../utils'

export const register = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const { code, clientId, clientSecret, botToken, redirectUri } =
    request.parsedBody.data
  if (!code) {
    return respondError(400, 'Missing `code`.')
  }
  if (!clientId) {
    return respondError(400, 'Missing `clientId`.')
  }
  if (!clientSecret) {
    return respondError(400, 'Missing `clientSecret`.')
  }
  if (!botToken) {
    return respondError(400, 'Missing `botToken`.')
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
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
  ).json()) as
    | {
        webhook: DiscordWebhook
      }
    | {
        error: string
        error_description: string
      }

  if ('error_description' in response) {
    return respond(500, {
      success: false,
      error: `Discord Error: ${response.error_description}`,
      response,
    })
  } else if (
    !objectMatchesStructure(response.webhook, {
      id: {},
      guild_id: {},
      channel_id: {},
      url: {},
    })
  ) {
    return respond(500, {
      success: false,
      error: 'Invalid webhook returned. Contact support for assistance.',
      response,
    })
  }

  const webhook: V2Webhook = {
    webhook: response.webhook,
    botToken,
  }

  // Store webhook and associated data.
  await env.WEBHOOKS.put(
    v2WebhooksKey(
      request.parsedBody.data.auth.chainId,
      request.dao,
      request.parsedBody.data.auth.publicKey,
      response.webhook.id
    ),
    JSON.stringify(webhook)
  )

  return respond(200, {
    success: true,
  })
}
