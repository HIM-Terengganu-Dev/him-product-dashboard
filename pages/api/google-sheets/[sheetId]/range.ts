import type { NextApiRequest, NextApiResponse } from 'next';
import { getMultipleRanges } from '../../../../lib/google-sheets';

/**
 * API endpoint to fetch multiple ranges from Google Sheets
 * 
 * POST /api/google-sheets/[sheetId]/range
 * 
 * Request body:
 * {
 *   "ranges": ["Sheet1!A1:B10", "Sheet2!A1:C5"]
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sheetId } = req.query;
  const { ranges } = req.body;

  if (!sheetId || typeof sheetId !== 'string') {
    return res.status(400).json({ error: 'Spreadsheet ID is required' });
  }

  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
    return res.status(400).json({ error: 'ranges array is required in request body' });
  }

  try {
    const data = await getMultipleRanges(sheetId, ranges);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Google Sheets API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Google Sheet data',
    });
  }
}

