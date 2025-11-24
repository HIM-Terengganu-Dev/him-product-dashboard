import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { isDeveloper } from '../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';
import type { ListTicketsResponse, Ticket } from '../../../types/tickets';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<ListTicketsResponse | { error: string }>
) {
    if (!validateMethod(req, res, ['GET'])) {
        return;
    }

    const { userEmail, status } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
        return sendErrorResponse(res, 400, 'User email is required');
    }

    const isAdmin = isDeveloper(userEmail);

    try {
        const client = await pool.connect();
        try {
            let query = `
                SELECT t.*, 
                (SELECT COUNT(*) FROM dev_tickets.ticket_replies tr WHERE tr.ticket_id = t.id)::int as reply_count 
                FROM dev_tickets.tickets t`;
            const params: any[] = [];

            // Build query based on role
            if (isAdmin) {
                // Admins can see all tickets, optionally filtered by status
                if (status && typeof status === 'string') {
                    query += ' WHERE t.status = $1';
                    params.push(status);
                }
            } else {
                // Regular users only see their own tickets
                query += ' WHERE t.submitted_by_email = $1';
                params.push(userEmail.toLowerCase());

                if (status && typeof status === 'string') {
                    query += ' AND t.status = $2';
                    params.push(status);
                }
            }

            query += ' ORDER BY t.created_at DESC';

            const result = await client.query(query, params);
            const tickets: Ticket[] = result.rows;

            sendSuccessResponse(res, {
                success: true,
                tickets,
                isAdmin
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}
