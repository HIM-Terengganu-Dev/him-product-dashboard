import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<{ success: boolean; message?: string } | { error: string }>
) {
    if (!validateMethod(req, res, ['POST'])) {
        return;
    }

    const { ticketId, userEmail } = req.body as { ticketId: string; userEmail: string };

    if (!userEmail || !ticketId) {
        return sendErrorResponse(res, 400, 'Ticket ID and user email are required');
    }

    try {
        const client = await pool.connect();
        try {
            // Get the latest reply ID for this ticket
            const latestReplyResult = await client.query(
                `SELECT id FROM dev_tickets.ticket_replies 
                 WHERE ticket_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [ticketId]
            );

            const latestReplyId = latestReplyResult.rows.length > 0 
                ? latestReplyResult.rows[0].id 
                : null;

            // Upsert read status
            await client.query(
                `INSERT INTO dev_tickets.ticket_read_status (ticket_id, user_email, last_read_reply_id, last_read_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (ticket_id, user_email)
                 DO UPDATE SET 
                   last_read_reply_id = EXCLUDED.last_read_reply_id,
                   last_read_at = CURRENT_TIMESTAMP`,
                [ticketId, userEmail.toLowerCase(), latestReplyId]
            );

            sendSuccessResponse(res, {
                success: true,
                message: 'Ticket marked as read'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to mark ticket as read:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}

