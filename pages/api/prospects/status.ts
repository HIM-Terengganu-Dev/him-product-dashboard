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
  allMarketplaces: string[];
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
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

    const { status: statusFilter, search, marketplace } = req.query;
    
    const client = await pool.connect();
    try {
        const statusCase = getStatusCaseStatement();

        const whereClauses: string[] = [`type = 'prospect'`];
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        const fromSubqueryWithStatus = `
            (SELECT *, ${statusCase} as derived_status FROM mart_himdashboard.crm_main_table) as c
        `;

        if (statusFilter && typeof statusFilter === 'string' && statusFilter.toLowerCase() !== 'all') {
            whereClauses.push(`derived_status = $${paramIndex++}`);
            queryParams.push(statusFilter);
        }
        if (search && typeof search === 'string') {
            whereClauses.push(`(name ILIKE $${paramIndex++} OR phone_number ILIKE $${paramIndex++})`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (marketplace && typeof marketplace === 'string' && marketplace.length > 0) {
            let marketplaceArray = marketplace.split(',');
            const hasNone = marketplaceArray.includes('_NONE_');
            marketplaceArray = marketplaceArray.filter(m => m !== '_NONE_');
            
            const conditions: string[] = [];
            if (hasNone) {
                conditions.push(`(last_marketplace IS NULL OR TRIM(last_marketplace) = '')`);
            }
            if (marketplaceArray.length > 0) {
                conditions.push(`last_marketplace = ANY($${paramIndex++}::text[])`);
                queryParams.push(marketplaceArray);
            }
            if (conditions.length > 0) {
                whereClauses.push(`(${conditions.join(' OR ')})`);
            }
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;

        // Summary Query
        const summaryResult = await client.query(`
            SELECT derived_status, COUNT(*) as count
            FROM ${fromSubqueryWithStatus}
            ${whereString.replace(/c\./g, '')}
            GROUP BY derived_status;
        `, queryParams);
        const summary: Summary = { 'Active': 0, 'Inactive': 0 };
        summaryResult.rows.forEach(row => {
            if (summary.hasOwnProperty(row.derived_status)) {
                summary[row.derived_status as Status] = parseInt(row.count, 10);
            }
        });

        // Marketplace list for dropdown filter (unfiltered)
        const allMarketplacesResult = await client.query(
            `SELECT DISTINCT TRIM(last_marketplace) as marketplace FROM mart_himdashboard.crm_main_table 
             WHERE last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> '' 
             ORDER BY marketplace ASC`
        );
        const allMarketplaces: string[] = allMarketplacesResult.rows.map(row => row.marketplace);
        
        // Main Data Query with integrated total count
        const dataQuery = `
            SELECT *, COUNT(*) OVER() as total_count
            FROM ${fromSubqueryWithStatus}
            ${whereString.replace(/c\./g, '')}
            ORDER BY last_order_date DESC NULLS LAST
            LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        const limitOffsetParams = [...queryParams, limit, offset];
        const result = await client.query(dataQuery, limitOffsetParams);

        const totalProspects = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
        const totalPages = Math.ceil(totalProspects / limit);
        
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
        
        // Add caching header
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        res.status(200).json({ prospects, summary, totalProspects, totalPages, allMarketplaces });

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
}