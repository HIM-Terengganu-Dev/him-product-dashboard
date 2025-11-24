import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
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
            const isDeveloper = userEmail === 'himclinicdata@gmail.com' || userEmail === 'amirsyahmi.jamsari@gmail.com';
            
            let ticketQuery = `
                SELECT t.id, t.submitted_by_email
                FROM dev_tickets.tickets t
            `;
            
            if (!isDeveloper) {
                ticketQuery += ` WHERE t.submitted_by_email = $1`;
            }

            const ticketParams = !isDeveloper ? [userEmail.toLowerCase()] : [];
            const ticketResult = await client.query(ticketQuery, ticketParams);
            const tickets = ticketResult.rows;

            if (tickets.length === 0) {
                return sendSuccessResponse(res, { success: true, unreadCount: 0 });
            }

            const ticketIds = tickets.map((t: any) => t.id);

            // For each ticket, check if there are unread replies
            // A reply is unread if:
            // 1. It's not from the current user
            // 2. Either no read status exists, or the reply was created after last_read_at
            let unreadCount = 0;

            for (const ticket of tickets) {
                // Get the last read status for this user and ticket
                const readStatusResult = await client.query(
                    `SELECT last_read_at, last_read_reply_id 
                     FROM dev_tickets.ticket_read_status 
                     WHERE ticket_id = $1 AND user_email = $2`,
                    [ticket.id, userEmail.toLowerCase()]
                );

                const readStatus = readStatusResult.rows[0];
                const lastReadAt = readStatus ? new Date(readStatus.last_read_at) : null;

                // Count unread replies
                // Unread = replies created after last_read_at AND not from current user
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

                // Also check if there are new replies to tickets the user submitted
                // (for ticket owners, any new reply is unread)
                if (ticket.submitted_by_email.toLowerCase() === userEmail.toLowerCase()) {
                    // For ticket owners, also check if ticket was updated after last read
                    if (lastReadAt) {
                        const ticketUpdateResult = await client.query(
                            `SELECT updated_at FROM dev_tickets.tickets WHERE id = $1`,
                            [ticket.id]
                        );
                        if (ticketUpdateResult.rows.length > 0) {
                            const ticketUpdatedAt = new Date(ticketUpdateResult.rows[0].updated_at);
                            if (ticketUpdatedAt > lastReadAt) {
                                unreadCount += unreadReplies > 0 ? unreadReplies : 1;
                                continue;
                            }
                        }
                    } else {
                        // Never read, count all non-own replies
                        unreadCount += unreadReplies;
                        continue;
                    }
                }

                unreadCount += unreadReplies;
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

