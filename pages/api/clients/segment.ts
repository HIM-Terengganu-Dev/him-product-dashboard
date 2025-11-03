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
        const whereClauses = [`segment IS NOT NULL`, `derived_segment != 'Other'`, `type = 'client'`];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (segmentFilter && typeof segmentFilter === 'string' && segmentFilter.toLowerCase() !== 'all') {
            whereClauses.push(`derived_segment = $${paramIndex++}`);
            queryParams.push(segmentFilter);
        }
        if (search && typeof search === 'string') {
            whereClauses.push(`(name ILIKE $${paramIndex++} OR phone_number ILIKE $${paramIndex++})`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        const whereString = `WHERE ${whereClauses.join(' AND ')}`;
        
        const fromSubqueryWithSegment = `
            (SELECT *, ${segmentCase} as derived_segment FROM mart_himdashboard.crm_main_table) as c
        `;

        // Summary Query (with filters)
        const summaryResult = await client.query(`
            SELECT derived_segment, COUNT(*) as count
            FROM ${fromSubqueryWithSegment}
            ${whereString.replace(/c\./g, '')}
            GROUP BY derived_segment;
        `, queryParams);
        const summary: Summary = { 'Loyal Client': 0, 'High-Spender Client': 0, 'Repeat Client': 0, 'One-time Client': 0 };
        summaryResult.rows.forEach(row => {
            if (summary.hasOwnProperty(row.derived_segment)) {
                summary[row.derived_segment as Segment] = parseInt(row.count, 10);
            }
        });

        // Main Data Query with integrated total count
        const dataQuery = `
            SELECT 
                phone_number,
                name,
                derived_segment,
                aov,
                total_orders,
                (aov * total_orders) as total_spent,
                COUNT(*) OVER() as total_count
            FROM ${fromSubqueryWithSegment}
            ${whereString.replace(/c\./g, '')}
            ORDER BY total_spent DESC NULLS LAST
            LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        const limitOffsetParams = [...queryParams, limit, offset];
        const result = await client.query(dataQuery, limitOffsetParams);
        
        const totalClients = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
        const totalPages = Math.ceil(totalClients / limit);
        
        const clients: Client[] = result.rows.map(row => ({
            id: String(row.phone_number || ''),
            name: row.name || 'N/A',
            phone: row.phone_number || 'N/A',
            segment: row.derived_segment,
            totalSpent: parseFloat(row.total_spent || 0),
            aov: parseFloat(row.aov || 0),
            totalOrders: parseInt(row.total_orders || 0),
        }));

        // Add caching header
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        res.status(200).json({ clients, summary, totalClients, totalPages });

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
}