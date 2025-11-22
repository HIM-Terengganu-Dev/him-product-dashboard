import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

interface SummaryResponse {
  totalContacts: number;
  clients: number;
  prospects: number;
  leads: number;
}

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const baseTable = 'mart_himdashboard.crm_main_table';

  try {
    const client = await pool.connect();
    try {
      // Get total contacts
      const totalQuery = await client.query(`
        SELECT COUNT(*) as total
        FROM ${baseTable}
      `);

      // Get counts by type
      const typeQuery = await client.query(`
        SELECT 
          LOWER(TRIM(type)) as type,
          COUNT(*) as count
        FROM ${baseTable}
        WHERE type IS NOT NULL
        GROUP BY LOWER(TRIM(type))
      `);

      const totalContacts = parseInt(totalQuery.rows[0]?.total || '0', 10);

      // Parse type counts
      let clients = 0;
      let prospects = 0;
      let leads = 0;

      typeQuery.rows.forEach((row) => {
        const type = row.type.toLowerCase();
        const count = parseInt(row.count, 10);

        if (type === 'client') {
          clients = count;
        } else if (type === 'prospect') {
          prospects = count;
        } else if (type === 'lead') {
          leads = count;
        }
      });

      const responseData: SummaryResponse = {
        totalContacts,
        clients,
        prospects,
        leads,
      };

      sendSuccessResponse(res, responseData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
}