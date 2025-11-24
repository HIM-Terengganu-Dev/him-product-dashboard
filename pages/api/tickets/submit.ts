import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db-tickets';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';
import type { SubmitTicketRequest, SubmitTicketResponse } from '../../../types/tickets';

export default async function handler(
    req: ApiRequest,
    res: NextApiResponse<SubmitTicketResponse | { error: string }>
) {
    if (!validateMethod(req, res, ['POST'])) {
        return;
    }

    const { title, description, category, priority, page_url } = req.body as SubmitTicketRequest;

    // Validate required fields
    if (!title || !description || !category || !priority) {
        return sendErrorResponse(res, 400, 'Missing required fields: title, description, category, priority');
    }

    // Get user info from request body (should be passed from frontend)
    const { userEmail, userName } = req.body as { userEmail?: string; userName?: string };

    if (!userEmail || !userName) {
        return sendErrorResponse(res, 400, 'User email and name are required');
    }

    try {
        console.log('Attempting to submit ticket:', { userEmail, userName, title });
        const client = await pool.connect();
        console.log('Database connection successful');
        try {
            // Get browser info from headers
            const userAgent = req.headers['user-agent'] || 'Unknown';

            const result = await client.query(
                `INSERT INTO dev_tickets.tickets 
         (title, description, category, priority, submitted_by_email, submitted_by_name, page_url, browser_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
                [title, description, category, priority, userEmail, userName, page_url, userAgent]
            );

            const ticketId = result.rows[0].id;
            console.log('Ticket created successfully:', ticketId);

            sendSuccessResponse(res, {
                success: true,
                ticketId,
                message: 'Ticket submitted successfully'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to submit ticket:', error);
        sendErrorResponse(res, 500, 'Internal Server Error');
    }
}
