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
  ssl: {
    rejectUnauthorized: false, // Required for Neon connections
  },
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

  try {
    const client = await pool.connect();
    try {
      // Query your materialized view with pagination and total count in one go
      const dataQuery = `
        WITH filtered_data AS (
            SELECT * FROM mart_himdashboard.crm_main_table 
            ${whereString}
        )
        SELECT *, COUNT(*) OVER() as total_count
        FROM filtered_data
        ORDER BY last_order_date DESC NULLS LAST 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      
      const finalQueryParams = [...queryParams, limit, offset];
      const result = await client.query(dataQuery, finalQueryParams);

      const totalContacts = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
      const totalPages = Math.ceil(totalContacts / limit);


      // Transform the database data into the structure your frontend expects.
      const contacts: Contact[] = result.rows.map(row => {
        
        // Mapping from your database columns:
        const phone = row.phone_number; // Used for display AND as the unique ID.
        const name = row.name;
        const type = row.type; // Should contain 'Client', 'Prospect', or 'Lead'
        
        let lastPurchaseDate: string | null = null;
        if (row.last_order_date) {
            const d = new Date(row.last_order_date);
            lastPurchaseDate = new Intl.DateTimeFormat('sv', {
                timeZone: 'Asia/Kuala_Lumpur', // UTC+8
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(d);
        }

        const lastPurchaseProduct = row.last_order_product;
        const lastMarketplace = row.last_marketplace;

        // Data validation and transformation
        const validTypes: ContactType[] = ['Client', 'Prospect', 'Lead'];
        let contactType: ContactType = 'Lead'; // Default to 'Lead'

        if (typeof type === 'string') {
          // Normalize the string: trim whitespace, capitalize first letter, lowercase the rest.
          const normalizedType = type.trim();
          const titleCaseType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
          
          if (validTypes.includes(titleCaseType as ContactType)) {
            contactType = titleCaseType as ContactType;
          }
        }

        return {
          id: String(phone || ''), // Use phone number as the unique string ID
          name: name || 'N/A',
          phone: phone || 'N/A',
          type: contactType,
          lastPurchaseDate: lastPurchaseDate,
          lastPurchaseProduct: lastPurchaseProduct || null,
          lastMarketplace: lastMarketplace || null,
        };
      });
      
      const responseData: PaginatedResponse = {
        contacts,
        totalContacts,
        totalPages,
      };
      
      // Add caching header
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