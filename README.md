# discord-notifier-cf-worker

A [Cloudflare Worker](https://workers.cloudflare.com/) that sends
[Discord](https://discord.com) notifications for [DAO DAO](https://daodao.zone/)
DAOs.

Used template for [Cosmos wallet
authentication](https://github.com/NoahSaso/cloudflare-worker-cosmos-auth) to
authenticate requests via a [Cosmos](https://cosmos.network) wallet signature.

## Development

### Run locally

```sh
npm run dev
# OR
wrangler dev --local --persist
```

### Configuration

1. Copy `wrangler.toml.example` to `wrangler.toml`.

2. Create KV namespaces for production and development:

```sh
npx wrangler kv:namespace create NONCES
npx wrangler kv:namespace create NONCES --preview

npx wrangler kv:namespace create WEBHOOKS
npx wrangler kv:namespace create WEBHOOKS --preview
```

3. Update the binding IDs in `wrangler.toml`:

```toml
kv-namespaces = [
  { binding = "NONCES", id = "<INSERT NONCES_ID>", preview_id = "<INSERT NONCES_PREVIEW_ID>" },
  { binding = "WEBHOOKS", id = "<INSERT WEBHOOKS_ID>", preview_id = "<INSERT WEBHOOKS_PREVIEW_ID>" },
]
```

4. Configure variables in `wrangler.toml`:

```toml
[vars]
DISCORD_CLIENT_ID = "<VALUE>"
```

5. Configure secrets:

```sh
echo <VALUE> | npx wrangler secret put DISCORD_CLIENT_SECRET
echo <VALUE> | npx wrangler secret put DISCORD_BOT_TOKEN
echo <VALUE> | npx wrangler secret put NOTIFY_API_KEY
```

## Deploy

```sh
wrangler publish
# OR
npm run deploy
```

## Architecture

The `WEBHOOKS` KV store maps `chainId:daoAddress:walletPublicKey:webhookId` to a
webhook object.
