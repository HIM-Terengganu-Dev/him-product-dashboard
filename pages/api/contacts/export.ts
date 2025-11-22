import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import {
  validateMethod,
  getQueryString,
  parseQueryArray,
  buildMarketplaceFilter,
  buildProductFilter,
  sendErrorResponse,
} from '../../../lib/api-helpers';
import type { ApiRequest } from '../../../types';

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
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const { name, type, marketplace, product, startDate, endDate } = req.query;

  const whereClauses: string[] = [];
  const queryParams: (string | number | string[])[] = [];
  let paramIndex = 1;

  const nameStr = getQueryString(req.query, 'name');
  if (nameStr) {
    whereClauses.push(`name ILIKE $${paramIndex++}`);
    queryParams.push(`%${nameStr}%`);
  }

  const typeArray = parseQueryArray(req.query, 'type');
  if (typeArray.length > 0) {
    whereClauses.push(`type ILIKE ANY($${paramIndex++}::text[])`);
    queryParams.push(typeArray);
  }

  const marketplaceStr = getQueryString(req.query, 'marketplace');
  if (marketplaceStr) {
    const marketplaceArray = marketplaceStr.split(',');
    const filter = buildMarketplaceFilter(marketplaceArray, paramIndex, queryParams);
    if (filter.clause) {
      whereClauses.push(filter.clause);
      paramIndex = filter.nextParamIndex;
    }
  }

  const productStr = getQueryString(req.query, 'product');
  if (productStr) {
    const productArray = productStr.split(',');
    const filter = buildProductFilter(productArray, paramIndex, queryParams);
    if (filter.clause) {
      whereClauses.push(filter.clause);
      paramIndex = filter.nextParamIndex;
    }
  }

  const startDateStr = getQueryString(req.query, 'startDate');
  if (startDateStr) {
    whereClauses.push(`last_order_date >= $${paramIndex++}`);
    queryParams.push(startDateStr);
  }

  const endDateStr = getQueryString(req.query, 'endDate');
  if (endDateStr) {
    whereClauses.push(`last_order_date <= $${paramIndex++}`);
    queryParams.push(endDateStr);
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
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
}