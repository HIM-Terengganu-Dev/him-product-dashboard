import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { isDeveloper } from '../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<{ success: boolean; unreadCount: number } | { error: string }>
) {
    if (!validateMethod(req, res, ['GET'])) {
        return;
    }

    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
        return sendErrorResponse(res, 400, 'User email is required');
    }

    try {
        const client = await pool.connect();
        try {
            // Get all tickets the user has access to
            // For regular users: only their own tickets
            // For developers: all tickets
            const userIsDeveloper = isDeveloper(userEmail);
            
            let ticketQuery = `
                SELECT t.id, t.submitted_by_email
                FROM dev_tickets.tickets t
            `;
            
            if (!userIsDeveloper) {
                ticketQuery += ` WHERE t.submitted_by_email = $1`;
            }

            const ticketParams = !userIsDeveloper ? [userEmail.toLowerCase()] : [];
            const ticketResult = await client.query(ticketQuery, ticketParams);
            const tickets = ticketResult.rows;

            if (tickets.length === 0) {
                return sendSuccessResponse(res, { success: true, unreadCount: 0 });
            }

            const ticketIds = tickets.map((t: any) => t.id);

            // Count unread tickets (tickets with unread replies)
            // A ticket is unread if:
            // 1. It has replies not from the current user
            // 2. Either no read status exists, or replies were created after last_read_at
            const ticketIds = tickets.map((t: any) => t.id);
            
            if (ticketIds.length === 0) {
                return sendSuccessResponse(res, { success: true, unreadCount: 0 });
            }

            // Get read status for all tickets at once
            const readStatusResult = await client.query(
                `SELECT ticket_id, last_read_at 
                 FROM dev_tickets.ticket_read_status 
                 WHERE ticket_id = ANY($1::uuid[]) AND user_email = $2`,
                [ticketIds, userEmail.toLowerCase()]
            );

            const readStatusMap = new Map();
            readStatusResult.rows.forEach((row: any) => {
                readStatusMap.set(row.ticket_id, new Date(row.last_read_at));
            });

            // Count unread tickets
            let unreadCount = 0;
            for (const ticket of tickets) {
                const lastReadAt = readStatusMap.get(ticket.id);

                // Count unread replies (replies not from current user, created after last_read_at)
                let unreadQuery = `
                    SELECT COUNT(*) as count
                    FROM dev_tickets.ticket_replies
                    WHERE ticket_id = $1 
                      AND author_email != $2
                `;
                const unreadParams: any[] = [ticket.id, userEmail.toLowerCase()];

                if (lastReadAt) {
                    unreadQuery += ` AND created_at > $3`;
                    unreadParams.push(lastReadAt.toISOString());
                }

                const unreadResult = await client.query(unreadQuery, unreadParams);
                const unreadReplies = parseInt(unreadResult.rows[0].count);

                // If there are unread replies, count this ticket as unread
                if (unreadReplies > 0) {
                    unreadCount++;
                }
            }

            sendSuccessResponse(res, {
                success: true,
                unreadCount
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to get unread count:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}

