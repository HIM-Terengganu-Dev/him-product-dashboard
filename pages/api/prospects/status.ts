import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
}

type Status = "Active" | "Inactive";

interface Prospect {
  id: string;
  name: string;
  phone: string;
  status: Status;
  lastContactDate: string | null;
}

interface Summary {
    'Active': number;
    'Inactive': number;
}

interface StatusResponse {
  prospects: Prospect[];
  summary: Summary;
  totalProspects: number;
  totalPages: number;
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// A prospect is 'Active' if their status in the database is 'new' or 'active', otherwise they are 'Inactive'.
const getStatusCaseStatement = () => `
    CASE
        WHEN status = 'new' OR status = 'active' THEN 'Active'
        ELSE 'Inactive'
    END
`;

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<StatusResponse | { error: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { status: statusFilter, search } = req.query;
    
    const client = await pool.connect();
    try {
        const statusCase = getStatusCaseStatement();

        const whereClauses: string[] = [`c.type = 'prospect'`];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (statusFilter && typeof statusFilter === 'string' && statusFilter.toLowerCase() !== 'all') {
            whereClauses.push(`c.derived_status = $${paramIndex++}`);
            queryParams.push(statusFilter);
        }
        if (search && typeof search === 'string') {
            whereClauses.push(`(c.name ILIKE $${paramIndex++} OR c.phone_number ILIKE $${paramIndex++})`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;

        const fromSubquery = `FROM (
            SELECT *, ${statusCase} as derived_status
            FROM mart_himdashboard.crm_main_table
        ) as c`;

        // Summary Query
        const summaryQuery = `
            SELECT c.derived_status, COUNT(*) as count
            ${fromSubquery}
            ${whereString}
            GROUP BY c.derived_status;
        `;
        const summaryResult = await client.query(summaryQuery, queryParams);
        const summary: Summary = { 'Active': 0, 'Inactive': 0 };
        summaryResult.rows.forEach(row => {
            if (summary.hasOwnProperty(row.derived_status)) {
                summary[row.derived_status as Status] = parseInt(row.count, 10);
            }
        });

        // Count Query
        const countQuery = `SELECT COUNT(*) ${fromSubquery} ${whereString};`;
        const totalResult = await client.query(countQuery, queryParams);
        const totalProspects = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalProspects / limit);
        
        // Main Data Query
        const dataQuery = `
            SELECT *
            ${fromSubquery}
            ${whereString}
            ORDER BY c.last_order_date DESC NULLS LAST
            LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        const limitOffsetParams = [...queryParams, limit, offset];
        const result = await client.query(dataQuery, limitOffsetParams);

        const prospects: Prospect[] = result.rows.map(row => {
            let lastContactDate: string | null = null;
            if (row.last_order_date) {
                const d = new Date(row.last_order_date);
                lastContactDate = new Intl.DateTimeFormat('sv', {
                    timeZone: 'Asia/Kuala_Lumpur',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                }).format(d);
            }
            return {
                id: String(row.phone_number || ''),
                name: row.name || 'N/A',
                phone: row.phone_number || 'N/A',
                status: row.derived_status,
                lastContactDate: lastContactDate,
            };
        });

        res.status(200).json({ prospects, summary, totalProspects, totalPages });

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
}