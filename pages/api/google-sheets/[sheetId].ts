import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, getSpreadsheetMetadata } from '../../../lib/google-sheets';

/**
 * API endpoint to fetch data from Google Sheets
 * 
 * GET /api/google-sheets/[sheetId]?range=Sheet1!A1:Z1000
 * 
 * Query parameters:
 * - range: Optional. A1 notation range (e.g., 'Sheet1!A1:Z1000' or 'Sheet1')
 *          Defaults to 'Sheet1' if not provided
 * - metadata: Optional. If 'true', returns spreadsheet metadata instead of data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sheetId } = req.query;
  const { range, metadata } = req.query;

  if (!sheetId || typeof sheetId !== 'string') {
    return res.status(400).json({ error: 'Spreadsheet ID is required' });
  }

  try {
    // Return metadata if requested
    if (metadata === 'true') {
      const metadata = await getSpreadsheetMetadata(sheetId);
      return res.status(200).json({ success: true, data: metadata });
    }

    // Fetch sheet data
    const values = await getSheetData(sheetId, range as string | undefined);

    // Transform array data into a more structured format
    const data = values.map((row, index) => ({
      rowIndex: index + 1,
      values: row,
    }));

    return res.status(200).json({
      success: true,
      data: {
        values,
        formattedData: data,
        rowCount: values.length,
        columnCount: values[0]?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Google Sheets API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Google Sheet data',
    });
  }
}

