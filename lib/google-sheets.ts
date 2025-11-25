import { google } from 'googleapis';

/**
 * Google Sheets API client utility
 * Supports both Service Account and OAuth 2.0 authentication
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range?: string;
  authType?: 'service_account' | 'oauth';
}

/**
 * Initialize Google Sheets API client using Service Account
 * Service Account key should be in GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY env variable
 */
export function getGoogleSheetsClient() {
  if (!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let credentials;
  try {
    // Try parsing as JSON string first
    credentials = JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY);
  } catch {
    // If parsing fails, it might be base64 encoded
    try {
      const decoded = Buffer.from(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } catch {
      throw new Error('Invalid GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY format. Expected JSON string or base64-encoded JSON.');
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetch data from a Google Sheet
 * @param spreadsheetId - The ID of the Google Spreadsheet
 * @param range - The A1 notation range (e.g., 'Sheet1!A1:Z1000') or just 'Sheet1'
 * @returns Promise with sheet data
 */
export async function getSheetData(spreadsheetId: string, range?: string): Promise<any[][]> {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: range || 'Sheet1',
    });

    return response.data.values || [];
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error('Permission denied. Make sure the Google Sheet is shared with the service account email.');
    } else if (error.code === 404) {
      throw new Error('Google Sheet not found. Check the spreadsheet ID.');
    } else {
      throw new Error(`Failed to fetch sheet data: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Get metadata about a Google Spreadsheet
 */
export async function getSpreadsheetMetadata(spreadsheetId: string) {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount,
      })),
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get multiple ranges from a Google Sheet in a single request
 */
export async function getMultipleRanges(spreadsheetId: string, ranges: string[]) {
  const sheets = getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    return response.data.valueRanges?.map((range, index) => ({
      range: ranges[index],
      values: range.values || [],
    })) || [];
  } catch (error: any) {
    throw new Error(`Failed to fetch multiple ranges: ${error.message || 'Unknown error'}`);
  }
}

