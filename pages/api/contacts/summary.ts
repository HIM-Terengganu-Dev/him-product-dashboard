import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

// FIX: Correct the type for NextApiRequest to include the 'query' property,
// resolving an error that was caused by it being missing from the custom type.
interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
}

type ContactType = 'Client' | 'Prospect' | 'Lead';

interface TypeSummaryData {
  type: ContactType;
  count: number;
}

interface MarketplaceSummaryData {
  marketplace: string;
  count: number;
}

interface SummaryResponse {
    typeSummary: TypeSummaryData[];
    marketplaceSummary: MarketplaceSummaryData[];
    totalContacts: number;
    allMarketplaces: string[];
    allProducts: string[];
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
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
      const baseTable = 'mart_himdashboard.crm_main_table';

      // Queries for filtered data
      const typeSummaryPromise = client.query(
        `SELECT type, COUNT(*) as count FROM ${baseTable} ${whereString} GROUP BY type`,
        queryParams
      );
      
      const marketplaceWhereClause = `${whereString ? `${whereString} AND` : 'WHERE'} last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> ''`;
      const marketplaceSummaryPromise = client.query(
        `SELECT TRIM(last_marketplace) as marketplace, COUNT(*) as count 
         FROM ${baseTable} 
         ${marketplaceWhereClause}
         GROUP BY TRIM(last_marketplace) 
         ORDER BY count DESC`,
        queryParams
      );

      const totalContactsPromise = client.query(
        `SELECT COUNT(*) as count FROM ${baseTable} ${whereString}`,
        queryParams
      );

      // Queries for unfiltered dropdown options
      const allMarketplacesPromise = client.query(
        `SELECT DISTINCT TRIM(last_marketplace) as marketplace FROM ${baseTable} 
         WHERE last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> '' 
         ORDER BY marketplace ASC`
      );
      
      const allProductsPromise = client.query(
        `SELECT DISTINCT TRIM(last_order_product) as product FROM ${baseTable} 
         WHERE last_order_product IS NOT NULL AND TRIM(last_order_product) <> '' 
         ORDER BY product ASC`
      );
      
      const [
          typeSummaryResult, 
          marketplaceSummaryResult,
          totalContactsResult,
          allMarketplacesResult, 
          allProductsResult
      ] = await Promise.all([
          typeSummaryPromise,
          marketplaceSummaryPromise,
          totalContactsPromise,
          allMarketplacesPromise,
          allProductsPromise
      ]);

      // Process Total Contacts
      const totalContacts = parseInt(totalContactsResult.rows[0].count, 10) || 0;

      // Process Type Summary
      const summaryMap = new Map<ContactType, number>();
      const validTypes: ContactType[] = ['Client', 'Prospect', 'Lead'];
      validTypes.forEach(type => summaryMap.set(type, 0));

      typeSummaryResult.rows.forEach(row => {
        let contactType: ContactType | null = null;
        if (typeof row.type === 'string') {
          const normalizedType = row.type.trim();
          const titleCaseType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
          if (validTypes.includes(titleCaseType as ContactType)) {
            contactType = titleCaseType as ContactType;
          }
        }
        if (contactType) {
            summaryMap.set(contactType, (summaryMap.get(contactType) || 0) + parseInt(row.count, 10));
        }
      });
      
      const typeSummary: TypeSummaryData[] = Array.from(summaryMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => validTypes.indexOf(a.type) - validTypes.indexOf(b.type));
      
      // Process Marketplace Summary
       const marketplaceSummary: MarketplaceSummaryData[] = marketplaceSummaryResult.rows.map(row => ({
        marketplace: row.marketplace,
        count: parseInt(row.count, 10),
      }));

      // Process Marketplaces and Products for dropdowns
      const allMarketplaces: string[] = allMarketplacesResult.rows.map(row => row.marketplace);
      const allProducts: string[] = allProductsResult.rows.map(row => row.product);

      const response: SummaryResponse = {
          typeSummary,
          marketplaceSummary,
          totalContacts,
          allMarketplaces,
          allProducts
      };

      res.status(200).json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database summary query failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}