import { AuthorizedRequest, Env } from '../types'
import { respond, allWebhookKeysForPrefix, webhooksKey } from '../utils'

// Returns if this public key has registered any webhooks for this DAO.
export const registrations = async (
  request: AuthorizedRequest,
  env: Env
): Promise<Response> => {
  const keys = await allWebhookKeysForPrefix(
    env,
    webhooksKey(
      request.params?.chainId ?? '',
      request.dao,
      request.params?.publicKey ?? '',
      ''
    )
  )

  const registrations = await Promise.all(
    keys.map(async (k) => {
      const {
        id: webhookId,
        guild_id: guildId,
        channel_id: channelId,
      } = (await env.WEBHOOKS.get(k, 'json')) as any

      // Get guild and channel metadata. If these fail because bot is not in
      // guild, just substitute placeholder ID data.
      const [guild, channel] = await Promise.allSettled([
        fetch(`https://discord.com/api/guilds/${guildId}`, {
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          },
        }).then((r) => r.json()),
        fetch(`https://discord.com/api/channels/${channelId}`, {
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          },
        }).then((r) => r.json()),
      ])

      return {
        id: webhookId,
        guild: {
          id: guildId,
          name:
            guild.status === 'fulfilled' ? (guild.value as any).name : guildId,
          iconHash:
            guild.status === 'fulfilled' ? (guild.value as any).icon : null,
        },
        channel: {
          id: channelId,
          name:
            channel.status === 'fulfilled'
              ? (channel.value as any).name
              : channelId,
        },
      }
    })
  )

  return respond(200, {
    registrations,
  })
}
