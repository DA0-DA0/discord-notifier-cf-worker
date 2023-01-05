import { AuthorizedRequest } from './types'
import { respondError } from './utils'

export const loadDaoFromParams = async (
  request: AuthorizedRequest
): Promise<Response | void> => {
  const dao = request.params?.dao
  if (!dao) {
    return respondError(400, 'Missing `dao`.')
  }

  // Add DAO to request.
  request.dao = dao
}
