import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { isDeveloper } from '../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';
import type { PostReplyRequest, PostReplyResponse } from '../../../types/tickets';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<PostReplyResponse | { error: string }>
) {
    if (!validateMethod(req, res, ['POST'])) {
        return;
    }

    const { ticketId, message } = req.body as PostReplyRequest;
    const { userEmail, userName, userPicture } = req.body as { userEmail: string; userName: string; userPicture?: string };

    // Validate required fields
    if (!ticketId || !message || !userEmail || !userName) {
        return sendErrorResponse(res, 400, 'Missing required fields');
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

            // Insert reply
            const result = await client.query(
                `INSERT INTO dev_tickets.ticket_replies 
         (ticket_id, author_email, author_name, author_picture, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
                [ticketId, userEmail, userName, userPicture, message]
            );

            const replyId = result.rows[0].id;

            sendSuccessResponse(res, {
                success: true,
                replyId,
                message: 'Reply posted successfully'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to post reply:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}
