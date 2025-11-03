import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
}

type Segment = "Loyal Client" | "High-Spender Client" | "Repeat Client" | "One-time Client";

interface Client {
  id: string;
  name: string;
  phone: string;
  segment: Segment;
  totalSpent: number;
  aov: number;
  totalOrders: number;
}

interface Summary {
    'Loyal Client': number;
    'High-Spender Client': number;
    'Repeat Client': number;
    'One-time Client': number;
}

interface SegmentResponse {
  clients: Client[];
  summary: Summary;
  totalClients: number;
  totalPages: number;
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getSegmentCaseStatement = () => `
    CASE
        WHEN segment = 'high-spender' THEN 'High-Spender Client'
        WHEN segment = 'repeat' AND total_orders > 5 THEN 'Loyal Client'
        WHEN segment = 'repeat' THEN 'Repeat Client'
        WHEN segment = 'one-time' THEN 'One-time Client'
        ELSE 'Other'
    END
`;

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<SegmentResponse | { error: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { segment: segmentFilter, search } = req.query;
    
    const client = await pool.connect();
    try {
        const segmentCase = getSegmentCaseStatement();

        // Build base filters for all queries
        const whereClauses = [`c.segment IS NOT NULL`, `c.derived_segment != 'Other'`];
        const queryParams: any[] = [];
        let paramIndex = 1;

        whereClauses.push(`c.type = 'client'`);

        if (segmentFilter && typeof segmentFilter === 'string' && segmentFilter.toLowerCase() !== 'all') {
            whereClauses.push(`c.derived_segment = $${paramIndex++}`);
            queryParams.push(segmentFilter);
        }
        if (search && typeof search === 'string') {
            whereClauses.push(`(c.name ILIKE $${paramIndex++} OR c.phone_number ILIKE $${paramIndex++})`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        const whereString = `WHERE ${whereClauses.join(' AND ')}`;
        
        const fromSubquery = `FROM (
            SELECT *, ${segmentCase} as derived_segment
            FROM mart_himdashboard.crm_main_table
        ) as c`;

        // Summary Query (with filters)
        const summaryQuery = `
            SELECT c.derived_segment, COUNT(*) as count
            ${fromSubquery}
            ${whereString}
            GROUP BY c.derived_segment;
        `;
        const summaryResult = await client.query(summaryQuery, queryParams);
        const summary: Summary = { 'Loyal Client': 0, 'High-Spender Client': 0, 'Repeat Client': 0, 'One-time Client': 0 };
        summaryResult.rows.forEach(row => {
            if (summary.hasOwnProperty(row.derived_segment)) {
                summary[row.derived_segment as Segment] = parseInt(row.count, 10);
            }
        });

        // Count Query
        const countQuery = `SELECT COUNT(*) ${fromSubquery} ${whereString};`;
        const totalResult = await client.query(countQuery, queryParams);
        const totalClients = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalClients / limit);

        // Main Data Query
        const dataQuery = `
            SELECT 
                c.phone_number,
                c.name,
                c.derived_segment,
                c.aov,
                c.total_orders,
                (c.aov * c.total_orders) as total_spent
            ${fromSubquery}
            ${whereString}
            ORDER BY total_spent DESC NULLS LAST
            LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        const limitOffsetParams = [...queryParams, limit, offset];
        const result = await client.query(dataQuery, limitOffsetParams);
        
        const clients: Client[] = result.rows.map(row => ({
            id: String(row.phone_number || ''),
            name: row.name || 'N/A',
            phone: row.phone_number || 'N/A',
            segment: row.derived_segment,
            totalSpent: parseFloat(row.total_spent || 0),
            aov: parseFloat(row.aov || 0),
            totalOrders: parseInt(row.total_orders || 0),
        }));

        res.status(200).json({ clients, summary, totalClients, totalPages });

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
}