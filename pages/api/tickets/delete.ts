import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { isDeveloper } from '../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<{ success: boolean; message?: string } | { error: string }>
) {
    if (!validateMethod(req, res, ['DELETE', 'POST'])) {
        return;
    }

    const { ticketId, userEmail } = req.body as { ticketId: string; userEmail: string };

    // Validate user email
    if (!userEmail) {
        return sendErrorResponse(res, 400, 'User email is required');
    }

    // Only developers can delete tickets
    if (!isDeveloper(userEmail)) {
        return sendErrorResponse(res, 403, 'Unauthorized: Only developers can delete tickets');
    }

    if (!ticketId) {
        return sendErrorResponse(res, 400, 'Ticket ID is required');
    }

    try {
        const client = await pool.connect();
        try {
            // First, verify the ticket exists
            const ticketCheck = await client.query(
                'SELECT id FROM dev_tickets.tickets WHERE id = $1',
                [ticketId]
            );

            if (ticketCheck.rows.length === 0) {
                return sendErrorResponse(res, 404, 'Ticket not found');
            }

            // Delete the ticket (replies will be cascade deleted due to ON DELETE CASCADE)
            const result = await client.query(
                'DELETE FROM dev_tickets.tickets WHERE id = $1',
                [ticketId]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(res, 404, 'Ticket not found');
            }

            sendSuccessResponse(res, {
                success: true,
                message: 'Ticket deleted successfully'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}



