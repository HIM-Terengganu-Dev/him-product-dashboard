import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { isDeveloper } from '../../../lib/auth-utils';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';
import type { UpdateTicketRequest, UpdateTicketResponse } from '../../../types/tickets';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<UpdateTicketResponse | { error: string }>
) {
    if (!validateMethod(req, res, ['POST'])) {
        return;
    }

    const { ticketId, status, developer_notes, userEmail } = req.body as UpdateTicketRequest & { userEmail: string };

    // Validate user email
    if (!userEmail) {
        return sendErrorResponse(res, 400, 'User email is required');
    }

    if (!ticketId) {
        return sendErrorResponse(res, 400, 'Ticket ID is required');
    }

    try {
        const client = await pool.connect();
        try {
            // Check if user has permission to update this ticket
            const ticketCheck = await client.query(
                'SELECT submitted_by_email FROM dev_tickets.tickets WHERE id = $1',
                [ticketId]
            );

            if (ticketCheck.rows.length === 0) {
                return sendErrorResponse(res, 404, 'Ticket not found');
            }

            const ticketOwner = ticketCheck.rows[0].submitted_by_email;
            const userIsDeveloper = isDeveloper(userEmail);
            const isTicketOwner = ticketOwner.toLowerCase() === userEmail.toLowerCase();

            // Permission checks:
            // - Developers can update any ticket (status, developer_notes)
            // - Ticket owners can only close their own tickets (status = 'closed')
            // - Developer notes can only be set by developers
            if (!userIsDeveloper && !isTicketOwner) {
                return sendErrorResponse(res, 403, 'Unauthorized: You can only update your own tickets');
            }

            if (developer_notes !== undefined && !userIsDeveloper) {
                return sendErrorResponse(res, 403, 'Unauthorized: Only developers can add developer notes');
            }

            if (status && !userIsDeveloper && status !== 'closed') {
                return sendErrorResponse(res, 403, 'Unauthorized: You can only close your own tickets');
            }

            // Build update query dynamically based on provided fields
            const updates: string[] = [];
            const params: any[] = [];
            let paramCount = 1;

            if (status) {
                updates.push(`status = $${paramCount}`);
                params.push(status);
                paramCount++;

                // If status is resolved or closed, set resolved_at
                if (status === 'resolved' || status === 'closed') {
                    updates.push(`resolved_at = CURRENT_TIMESTAMP`);
                }
            }

            if (developer_notes !== undefined) {
                updates.push(`developer_notes = $${paramCount}`);
                params.push(developer_notes);
                paramCount++;
            }

            if (updates.length === 0) {
                return sendErrorResponse(res, 400, 'No fields to update');
            }

            params.push(ticketId);
            const query = `
        UPDATE dev_tickets.tickets 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await client.query(query, params);

            if (result.rowCount === 0) {
                return sendErrorResponse(res, 404, 'Ticket not found');
            }

            sendSuccessResponse(res, {
                success: true,
                message: 'Ticket updated successfully'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to update ticket:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}
