import type { NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-tickets';
import { isDeveloper } from '../../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../../lib/api-helpers';
import type { ApiRequest } from '../../../../types';
import type { GetRepliesResponse } from '../../../../types/tickets';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<GetRepliesResponse | { error: string }>
) {
    if (!validateMethod(req, res, ['GET'])) {
        return;
    }

    const { ticketId } = req.query;
    const { userEmail } = req.query as { userEmail?: string };

    if (!ticketId || typeof ticketId !== 'string') {
        return sendErrorResponse(res, 400, 'Ticket ID is required');
    }

    if (!userEmail || typeof userEmail !== 'string') {
        return sendErrorResponse(res, 400, 'User email is required');
    }

    try {
        const client = await pool.connect();
        try {
            // Check if user has access to this ticket
            const ticketCheck = await client.query(
                'SELECT submitted_by_email FROM dev_tickets.tickets WHERE id = $1',
                [ticketId]
            );

            if (ticketCheck.rows.length === 0) {
                return sendErrorResponse(res, 404, 'Ticket not found');
            }

            const ticketOwner = ticketCheck.rows[0].submitted_by_email;
            const isAdmin = isDeveloper(userEmail);

            // User must be ticket owner or developer
            if (ticketOwner !== userEmail && !isAdmin) {
                return sendErrorResponse(res, 403, 'Access denied');
            }

            // Fetch all replies for this ticket
            const result = await client.query(
                `SELECT * FROM dev_tickets.ticket_replies 
         WHERE ticket_id = $1 
         ORDER BY created_at ASC`,
                [ticketId]
            );

            sendSuccessResponse(res, {
                success: true,
                replies: result.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to fetch replies:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}
