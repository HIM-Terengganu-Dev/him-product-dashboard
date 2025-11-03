import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
}

type Status = "New Client" | "Active" | "Churning" | "Churned";

interface Client {
  id: string;
  name: string;
  phone: string;
  status: Status;
  lastPurchaseDate: string | null;
  lastOrderProduct: string | null;
}

interface Summary {
    'New Client': number;
    'Active': number;
    'Churning': number;
    'Churned': number;
}

interface StatusResponse {
  clients: Client[];
  summary: Summary;
  totalClients: number;
  totalPages: number;
  allProducts: string[];
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getStatusCaseStatement = () => `
    CASE
        WHEN status = 'new' THEN 'New Client'
        WHEN status = 'active' AND last_order_date >= NOW() - INTERVAL '60 days' THEN 'Active'
        WHEN status = 'active' AND last_order_date BETWEEN NOW() - INTERVAL '180 days' AND NOW() - INTERVAL '61 days' THEN 'Churning'
        WHEN status = 'churned' OR (status = 'active' AND last_order_date < NOW() - INTERVAL '180 days') THEN 'Churned'
        ELSE 'Other' -- Should be handled or filtered out
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

    const { status: statusFilter, search, startDate, endDate, product } = req.query;
    
    const client = await pool.connect();
    try {
        const statusCase = getStatusCaseStatement();

        // Build base filters to be used across all queries
        const whereClauses: string[] = [`c.derived_status != 'Other'`];
        const queryParams: any[] = [];
        let paramIndex = 1;

        whereClauses.push(`c.type = 'client'`);

        if (statusFilter && typeof statusFilter === 'string' && statusFilter.toLowerCase() !== 'all') {
            whereClauses.push(`c.derived_status = $${paramIndex++}`);
            queryParams.push(statusFilter);
        }
        if (search && typeof search === 'string') {
            whereClauses.push(`(c.name ILIKE $${paramIndex++} OR c.phone_number ILIKE $${paramIndex++})`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (startDate && typeof startDate === 'string') {
            whereClauses.push(`c.last_order_date >= $${paramIndex++}`);
            queryParams.push(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            whereClauses.push(`c.last_order_date <= $${paramIndex++}`);
            queryParams.push(endDate);
        }
        if (product && typeof product === 'string' && product.length > 0) {
            whereClauses.push(`c.last_order_product = ANY($${paramIndex++}::text[])`);
            queryParams.push(product.split(','));
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const fromSubquery = `FROM (
            SELECT *, ${statusCase} as derived_status
            FROM mart_himdashboard.crm_main_table
        ) as c`;

        // Summary Query (now with filters)
        const summaryQuery = `
            SELECT c.derived_status, COUNT(*) as count
            ${fromSubquery}
            ${whereString}
            GROUP BY c.derived_status;
        `;
        const summaryResult = await client.query(summaryQuery, queryParams);
        const summary: Summary = { 'New Client': 0, 'Active': 0, 'Churning': 0, 'Churned': 0 };
        summaryResult.rows.forEach(row => {
            if (summary.hasOwnProperty(row.derived_status)) {
                summary[row.derived_status as Status] = parseInt(row.count, 10);
            }
        });

        // Product list for dropdown filter (unfiltered)
        const allProductsResult = await client.query(
            `SELECT DISTINCT TRIM(last_order_product) as product FROM mart_himdashboard.crm_main_table 
             WHERE last_order_product IS NOT NULL AND TRIM(last_order_product) <> '' 
             ORDER BY product ASC`
        );
        const allProducts: string[] = allProductsResult.rows.map(row => row.product);

        // Count Query
        const countQuery = `SELECT COUNT(*) ${fromSubquery} ${whereString};`;
        const totalResult = await client.query(countQuery, queryParams);
        const totalClients = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalClients / limit);
        
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

        const clients: Client[] = result.rows.map(row => {
            let lastPurchaseDate: string | null = null;
            if (row.last_order_date) {
                const d = new Date(row.last_order_date);
                lastPurchaseDate = new Intl.DateTimeFormat('sv', {
                    timeZone: 'Asia/Kuala_Lumpur',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                }).format(d);
            }
            return {
                id: String(row.phone_number || ''),
                name: row.name || 'N/A',
                phone: row.phone_number || 'N/A',
                status: row.derived_status,
                lastPurchaseDate: lastPurchaseDate,
                lastOrderProduct: row.last_order_product || null,
            };
        });

        res.status(200).json({ clients, summary, totalClients, totalPages, allProducts });

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
}