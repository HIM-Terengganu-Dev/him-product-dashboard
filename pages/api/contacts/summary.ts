// This is your new backend API endpoint.
// It securely connects to your Neon database and fetches the data.
// To access this data, your frontend will make a request to /api/contacts.

import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

// This is the shape of data your frontend expects.
// We will transform the data from the database to match this structure.
type ContactType = 'Client' | 'Prospect' | 'Lead';

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: ContactType;
  lastPurchaseDate: string | null;
  lastPurchaseProduct: string | null;
  lastMarketplace: string | null;
}

interface PaginatedResponse {
  contacts: Contact[];
  totalContacts: number;
  totalPages: number;
}

// FIX: Correct the type for NextApiRequest which appears to be missing properties like `method` and `query`
// in the current environment. This can happen due to conflicting types or configuration issues.
interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
}

// Create a new connection pool.
// The Pool will read the POSTGRES_URL environment variable automatically.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<PaginatedResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { name, type, marketplace, product, startDate, endDate } = req.query;

  const whereClauses: string[] = [];
  const queryParams: (string | number | string[])[] = [];
  let paramIndex = 1;

  if (name && typeof name === 'string') {
    whereClauses.push(`name ILIKE $${paramIndex++}`);
    queryParams.push(`%${name}%`);
  }
  if (type && typeof type === 'string') {
      const typeArray = type.split(',');
      if (typeArray.length > 0) {
          whereClauses.push(`type ILIKE ANY($${paramIndex++}::text[])`);
          queryParams.push(typeArray);
      }
  }
  if (marketplace && typeof marketplace === 'string') {
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
  if (product && typeof product === 'string') {
      let productArray = product.split(',');
      const hasNone = productArray.includes('_NONE_');
      productArray = productArray.filter(p => p !== '_NONE_');
      
      const conditions: string[] = [];
      if (hasNone) {
          conditions.push(`(last_order_product IS NULL OR TRIM(last_order_product) = '')`);
      }
      if (productArray.length > 0) {
          conditions.push(`last_order_product = ANY($${paramIndex++}::text[])`);
          queryParams.push(productArray);
      }
      if (conditions.length > 0) {
          whereClauses.push(`(${conditions.join(' OR ')})`);
      }
  }
  if (startDate && typeof startDate === 'string') {
    whereClauses.push(`last_order_date >= $${paramIndex++}`);
    queryParams.push(startDate);
  }
  if (endDate && typeof endDate === 'string') {
    whereClauses.push(`last_order_date <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const baseTable = 'mart_himdashboard.crm_main_table';
  
  try {
    const client = await pool.connect();
    try {
      const dataQuery = client.query(`
          SELECT *, COUNT(*) OVER() as total_count
          FROM ${baseTable}
          ${whereString}
          ORDER BY last_order_date DESC NULLS LAST 
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );
      
      const dataResult = await dataQuery;

      const totalContacts = dataResult.rows.length > 0 ? parseInt(dataResult.rows[0].total_count, 10) : 0;
      const totalPages = Math.ceil(totalContacts / limit);
      
      const contacts: Contact[] = dataResult.rows.map(row => {
        let lastPurchaseDate: string | null = null;
        if (row.last_order_date) {
            const d = new Date(row.last_order_date);
            lastPurchaseDate = new Intl.DateTimeFormat('sv', {
                timeZone: 'Asia/Kuala_Lumpur',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(d);
        }
        const validTypes: ContactType[] = ['Client', 'Prospect', 'Lead'];
        let contactType: ContactType = 'Lead';
        if (typeof row.type === 'string') {
          const normalizedType = row.type.trim();
          const titleCaseType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
          if (validTypes.includes(titleCaseType as ContactType)) {
            contactType = titleCaseType as ContactType;
          }
        }
        return {
          id: String(row.phone_number || ''),
          name: row.name || 'N/A', phone: row.phone_number || 'N/A', type: contactType,
          lastPurchaseDate: lastPurchaseDate, lastPurchaseProduct: row.last_order_product || null, lastMarketplace: row.last_marketplace || null,
        };
      });

      const responseData: PaginatedResponse = {
        contacts, totalContacts, totalPages,
      };
      
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.status(200).json(responseData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}