import { createCors } from 'itty-cors'
import { Router } from 'itty-router'

import { Env } from './types'
import { authMiddleware } from './auth'
import { handleNonce } from './routes/nonce'
import { respondError } from './utils'
import { register } from './routes/register'
import { loadDaoFromParams } from './middleware'
import { registrations } from './routes/registrations'
import { unregister } from './routes/unregister'
import { notify } from './routes/notify'

// Create CORS handlers.
const { preflight, corsify } = createCors({
  methods: ['GET', 'POST'],
  origins: ['*'],
  maxAge: 3600,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
})

const router = Router()

// Handle CORS preflight OPTIONS request.
router.options('*', preflight)

//! Unauthenticated routes.

// Get nonce for publicKey.
router.get('/nonce/:publicKey', handleNonce)

// Count registrations for the given parameters.
router.get(
  '/:chainId/:dao/:publicKey/registrations',
  loadDaoFromParams,
  registrations
)

//! Authenticated routes.

// Webhook management routes.
router.post('/:dao/register', authMiddleware, loadDaoFromParams, register)
router.post('/:dao/unregister', authMiddleware, loadDaoFromParams, unregister)

// Notify route.
router.post(`/:chainId/:dao/notify`, loadDaoFromParams, notify)

//! 404
router.all('*', () => respondError(404, 'Not found'))

//! Entrypoint.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router
      .handle(request, env)
      .catch((err) => {
        console.error('Error handling request', request.url, err)
        return respondError(
          500,
          `Internal server error. ${
            err instanceof Error ? err.message : `${JSON.stringify(err)}`
          }`
        )
      })
      .then(corsify)
  },
}
