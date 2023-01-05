import { Request as IttyRequest } from 'itty-router'

export interface Env {
  NONCES: KVNamespace
  WEBHOOKS: KVNamespace

  // Environment variables.
  DISCORD_CLIENT_ID: string
  // Secrets.
  DISCORD_CLIENT_SECRET: string
  DISCORD_BOT_TOKEN: string
  NOTIFY_API_KEY: string
}

export interface Auth {
  type: string
  nonce: number
  chainId: string
  chainFeeDenom: string
  chainBech32Prefix: string
  publicKey: string
}

export type RequestBody<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends Record<string, unknown> = Record<string, any>
> = {
  data: {
    auth: Auth
  } & Data
  signature: string
}

export interface RequestWithDao extends IttyRequest {
  dao: string
}

export interface AuthorizedRequest<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends Record<string, any> = Record<string, any>
> extends IttyRequest {
  parsedBody: RequestBody<Data>
  dao: string
}
