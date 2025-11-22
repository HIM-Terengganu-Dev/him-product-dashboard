import type { NextApiResponse } from 'next';

// Standard error response interface
export interface ErrorResponse {
  error: string;
  code?: string;
}

// Helper to send error responses
export function sendErrorResponse(
  res: NextApiResponse,
  statusCode: number,
  error: string,
  code?: string
): void {
  const errorResponse: ErrorResponse = { error };
  if (code) {
    errorResponse.code = code;
  }
  res.status(statusCode).json(errorResponse);
}

// Helper to send success responses with caching
export function sendSuccessResponse<T>(
  res: NextApiResponse<T>,
  data: T,
  cacheMaxAge: number = 60
): void {
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=300`
  );
  res.status(200).json(data);
}

// Helper to validate HTTP method
export function validateMethod(
  req: { method?: string },
  res: NextApiResponse,
  allowedMethods: string[]
): boolean {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    res.status(405).end(`Method ${req.method || 'undefined'} Not Allowed`);
    return false;
  }
  return true;
}

// Helper to parse pagination parameters
export function parsePagination(query: {
  page?: string | string[];
  limit?: string | string[];
}): { page: number; limit: number; offset: number } {
  const page = parseInt(Array.isArray(query.page) ? query.page[0] : query.page || '1', 10) || 1;
  const limit = parseInt(Array.isArray(query.limit) ? query.limit[0] : query.limit || '10', 10) || 10;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Helper to safely get string from query
export function getQueryString(
  query: { [key: string]: string | string[] | undefined },
  key: string
): string | undefined {
  const value = query[key];
  if (!value) return undefined;
  return typeof value === 'string' ? value : value[0];
}

// Helper to parse array from comma-separated string
export function parseQueryArray(
  query: { [key: string]: string | string[] | undefined },
  key: string
): string[] {
  const value = getQueryString(query, key);
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

// Helper to handle marketplace/product filters (handles _NONE_ special case)
export function buildMarketplaceFilter(
  marketplaceArray: string[],
  paramIndex: number,
  queryParams: any[]
): { clause: string | null; nextParamIndex: number } {
  const hasNone = marketplaceArray.includes('_NONE_');
  const filteredArray = marketplaceArray.filter(m => m !== '_NONE_');
  
  const conditions: string[] = [];
  
  if (hasNone) {
    conditions.push(`(last_marketplace IS NULL OR TRIM(last_marketplace) = '')`);
  }
  
  if (filteredArray.length > 0) {
    conditions.push(`last_marketplace = ANY($${paramIndex}::text[])`);
    queryParams.push(filteredArray);
    paramIndex++;
  }
  
  if (conditions.length === 0) {
    return { clause: null, nextParamIndex: paramIndex };
  }
  
  return {
    clause: `(${conditions.join(' OR ')})`,
    nextParamIndex: paramIndex,
  };
}

export function buildProductFilter(
  productArray: string[],
  paramIndex: number,
  queryParams: any[]
): { clause: string | null; nextParamIndex: number } {
  const hasNone = productArray.includes('_NONE_');
  const filteredArray = productArray.filter(p => p !== '_NONE_');
  
  const conditions: string[] = [];
  
  if (hasNone) {
    conditions.push(`(last_order_product IS NULL OR TRIM(last_order_product) = '')`);
  }
  
  if (filteredArray.length > 0) {
    conditions.push(`last_order_product = ANY($${paramIndex}::text[])`);
    queryParams.push(filteredArray);
    paramIndex++;
  }
  
  if (conditions.length === 0) {
    return { clause: null, nextParamIndex: paramIndex };
  }
  
  return {
    clause: `(${conditions.join(' OR ')})`,
    nextParamIndex: paramIndex,
  };
}

// Helper to format date in Asia/Kuala_Lumpur timezone
export function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('sv', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

// Helper to safely parse integer
export function parseIntSafe(value: string | undefined | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

