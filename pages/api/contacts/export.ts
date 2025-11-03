import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

// FIX: Corrected the type for NextApiRequest to include the `query` property,
// resolving an error that was caused by it being missing from the custom type.
interface ApiRequest extends NextApiRequest {
    method?: string;
    query: { [key: string]: string | string[] | undefined };
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

function escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function convertToCSV(data: any[]): string {
    if (data.length === 0) {
        return '';
    }
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(escapeCSVValue).join(',');
    
    const dataRows = data.map(row => 
        headers.map(header => escapeCSVValue(row[header])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
}

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<string | { error: string }>
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
      const dataQuery = `
        SELECT * FROM mart_himdashboard.crm_main_table 
        ${whereString}
        ORDER BY last_order_date DESC NULLS LAST`;
      
      const result = await client.query(dataQuery, queryParams);
      
      // The result.rows is an array of objects directly from the database.
      // We pass it directly to the CSV converter to get all columns.
      const csvData = convertToCSV(result.rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts_full_export.csv"');
      res.status(200).send(csvData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query for export failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}