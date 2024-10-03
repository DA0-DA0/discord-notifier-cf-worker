/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthorizedRequest, Env } from '../types'
import {
  respond,
  allWebhookKeysForPrefix,
  v1WebhooksKey,
  v2WebhooksKey,
  v2WebhooksForV1AndV2Keys,
} from '../utils'

// Returns if this public key has registered any webhooks for this DAO.
export const registrations = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const v1Keys = await allWebhookKeysForPrefix(
    env,
    v1WebhooksKey(
      request.params?.chainId ?? '',
      request.dao,
      request.params?.publicKey ?? '',
      ''
    )
  )
  const v2Keys = await allWebhookKeysForPrefix(
    env,
    v2WebhooksKey(
      request.params?.chainId ?? '',
      request.dao,
      request.params?.publicKey ?? '',
      ''
    )
  )

  const webhooks = await v2WebhooksForV1AndV2Keys(env, v1Keys, v2Keys)

  const registrations = (
    await Promise.all(
      webhooks.map(
        async ({ webhook: { id, guild_id, channel_id }, botToken }) => {
          if (!id || !guild_id || !channel_id) {
            return
          }

          // Get guild and channel metadata. If these fail because bot is not in
          // guild, just substitute placeholder ID data.
          const [guild, channel] = await Promise.allSettled([
            fetch(`https://discord.com/api/guilds/${guild_id}`, {
              headers: {
                Authorization: `Bot ${botToken}`,
              },
            }).then((r) => r.json()),
            fetch(`https://discord.com/api/channels/${channel_id}`, {
              headers: {
                Authorization: `Bot ${botToken}`,
              },
            }).then((r) => r.json()),
          ])

          return {
            id,
            guild: {
              id: guild_id,
              name:
                (guild.status === 'fulfilled' &&
                  'value' in guild &&
                  (guild.value as any).name) ||
                guild_id,
              iconHash:
                (guild.status === 'fulfilled' &&
                  'value' in guild &&
                  (guild.value as any).icon) ||
                null,
            },
            channel: {
              id: channel_id,
              name:
                (channel.status === 'fulfilled' &&
                  'value' in channel &&
                  (channel.value as any).name) ||
                channel_id,
            },
          }
        }
      )
    )
  ).filter(Boolean)

  return respond(200, {
    registrations,
  })
}
