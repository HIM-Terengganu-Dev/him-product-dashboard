import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<{ authorized: boolean } | { error: string }>
) {
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return sendErrorResponse(res, 400, 'Email is required.');
  }

  try {
    const client = await pool.connect();
    try {
      // Check if the email exists in the authorized_users table.
      // We use `SELECT 1` because we only care about existence, which is faster than `COUNT(*)`
      const result = await client.query(
        'SELECT 1 FROM mart_himdashboard.authorized_users WHERE email = $1',
        [email.toLowerCase()] // Store and check emails in a consistent case
      );
      
      // Safely handle the case where rowCount might be null.
      const isAuthorized = (result.rowCount ?? 0) > 0;

      sendSuccessResponse(res, { authorized: isAuthorized });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authorization check failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
}