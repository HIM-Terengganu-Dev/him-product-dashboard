import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import * as XLSX from 'xlsx';
import { pool } from '../../../../lib/db-live-gmv';
import { logOperation } from '../../../../lib/live-gmv-logger';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

interface ParsedRow {
  campaign_id: string;
  campaign_name: string;
  campaign_group: string;
  cost: number;
  net_cost: number;
  orders_sku: number;
  gross_revenue: number;
  roi: number;
  currency: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let uploadedFilePath: string | null = null;

  try {
    // Parse form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const { fields, files } = await new Promise<{
      fields: any;
      files: any;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Get report date
    const reportDate = Array.isArray(fields.reportDate) 
      ? fields.reportDate[0] 
      : fields.reportDate;

    if (!reportDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Report date is required',
        message: 'Please provide a report date' 
      });
    }

    // Get user email from form fields (optional, for logging)
    const userEmail = Array.isArray(fields.userEmail) 
      ? fields.userEmail[0] 
      : fields.userEmail || 'unknown@unknown.com';

    // Get uploaded file
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0] as FormidableFile;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload' 
      });
    }

    uploadedFilePath = file.filepath;

    // Read Excel file
    let workbook;
    try {
      workbook = XLSX.readFile(uploadedFilePath);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid file format',
        message: 'Could not read the Excel file. Please ensure it is a valid .xlsx or .xls file.' 
      });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No sheets found',
        message: 'The Excel file contains no sheets.' 
      });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return res.status(400).json({ 
        success: false,
        error: 'Sheet not found',
        message: `Could not read sheet "${sheetName}".` 
      });
    }

    let rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Empty file',
        message: 'The uploaded file contains no data. Please check that the first sheet has data rows.' 
      });
    }

    // Helper function to convert string to snake_case
    const toSnakeCase = (str: string): string => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore between lowercase and uppercase
        .replace(/[\s\-_]+/g, '_') // Replace spaces, hyphens, underscores with single underscore
        .replace(/[^\w_]/g, '') // Remove special characters
        .toLowerCase()
        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    };

    // Convert all column names to snake_case
    rawData = rawData.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        const snakeKey = toSnakeCase(key);
        newRow[snakeKey] = row[key];
      });
      return newRow;
    });

    const parsedData: ParsedRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get existing campaign groups from database (for reference)
    const client = await pool.connect();
    let existingCampaignGroups: Set<string> = new Set();
    try {
      const groupQuery = `
        SELECT DISTINCT campaign_group 
        FROM tiktok_sales_performance_tables.campaign_performance
        WHERE campaign_type = 'PRODUCT'
        LIMIT 100
      `;
      const groupResult = await client.query(groupQuery);
      existingCampaignGroups = new Set(groupResult.rows.map(r => r.campaign_group));
    } catch (err) {
      console.error('Error fetching existing campaign groups:', err);
    } finally {
      client.release();
    }

    // Parse each row
    rawData.forEach((row, index) => {
      try {
        // Get campaign ID
        const campaignIdRaw = row['campaign_id'] || row['campaignid'] || row['campaign_id'];
        if (!campaignIdRaw) {
          errors.push(`Row ${index + 2}: Missing campaign ID`);
          return;
        }
        const campaignId = String(campaignIdRaw).trim();

        // Get campaign name
        const campaignNameRaw = row['campaign_name'] || row['campaignname'] || row['campaign'];
        if (!campaignNameRaw) {
          errors.push(`Row ${index + 2}: Missing campaign name`);
          return;
        }
        const campaignName = String(campaignNameRaw).trim();

        // For Product GMV: campaign group = campaign name (no bracket detection)
        // If there's a campaign_group column in Excel, use that instead
        let campaignGroup = row['campaign_group'] || row['campaigngroup'] || campaignName;

        // Parse numeric values (handles currency symbols, commas, etc.)
        const parseNumeric = (value: any, fieldName: string): number => {
          if (value === null || value === undefined || value === '') return 0;
          
          // Convert to string and clean up
          let str = String(value).trim();
          
          // Remove currency symbols (RM, $, €, etc.) and other text
          str = str.replace(/[RM$\€£¥,\s]/gi, '');
          
          // Remove everything except digits, decimal point, and minus sign
          str = str.replace(/[^\d.-]/g, '');
          
          // Handle empty string after cleaning
          if (!str || str === '' || str === '-') return 0;
          
          const num = parseFloat(str);
          if (isNaN(num)) {
            if (index < 3) {
              console.log(`[WARNING] Row ${index + 2}: Invalid ${fieldName} value "${value}" -> cleaned to "${str}" -> NaN`);
            }
            return 0;
          }
          
          return num;
        };

        // All column names are now in snake_case
        const cost = parseNumeric(row['cost'] || 0, 'cost');
        const netCost = parseNumeric(row['net_cost'] || 0, 'net_cost');
        
        // Handle variations for orders_sku: "orders_sku", "orders", "sku"
        const ordersSku = parseNumeric(
          row['orders_sku'] || row['orders'] || row['sku'] || 0, 
          'orders_sku'
        );
        
        // Handle variations for gross_revenue: "gross_revenue", "revenue", "gmv", "total_revenue"
        let grossRevenueRaw: any = null;
        
        const revenueKeys = [
          'gross_revenue',
          'grossrevenue', 
          'revenue',
          'gmv',
          'total_revenue',
          'totalrevenue',
          'gross_revenue_rm',
          'grossrevenue_rm'
        ];
        
        for (const key of revenueKeys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            grossRevenueRaw = row[key];
            break;
          }
        }
        
        // If still not found, search all keys for revenue-related names
        if (!grossRevenueRaw || grossRevenueRaw === 0 || grossRevenueRaw === '0') {
          const allKeys = Object.keys(row);
          const revenueKey = allKeys.find(key => {
            const lowerKey = key.toLowerCase();
            return (lowerKey.includes('revenue') || lowerKey.includes('gmv')) && 
                   !lowerKey.includes('cost') && 
                   !lowerKey.includes('roi');
          });
          if (revenueKey) {
            grossRevenueRaw = row[revenueKey];
          }
        }
        
        const grossRevenue = parseNumeric(grossRevenueRaw || 0, 'gross_revenue');
        const roi = parseNumeric(row['roi'] || 0, 'roi');

        // Determine currency (default to RM)
        let currency = 'RM';
        const costStr = String(row['cost'] || '');
        if (costStr.includes('RM')) currency = 'RM';
        else if (costStr.includes('$')) currency = 'USD';
        else if (costStr.includes('€')) currency = 'EUR';

        parsedData.push({
          campaign_id: campaignId,
          campaign_name: campaignName,
          campaign_group: String(campaignGroup).trim(),
          cost,
          net_cost: netCost,
          orders_sku: Math.floor(ordersSku),
          gross_revenue: grossRevenue,
          roi,
          currency,
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Detect conflicts: same campaign_id with different groups
    const campaignGroupMap = new Map<string, string>();
    const conflicts: string[] = [];
    
    parsedData.forEach((row, index) => {
      const existingGroup = campaignGroupMap.get(row.campaign_id);
      if (existingGroup && existingGroup !== row.campaign_group) {
        conflicts.push(
          `Campaign ID ${row.campaign_id} has conflicting groups: "${existingGroup}" and "${row.campaign_group}"`
        );
      } else if (!existingGroup) {
        campaignGroupMap.set(row.campaign_id, row.campaign_group);
      }
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Group conflicts detected',
        message: 'The same campaign ID appears with different groups. Please ensure each campaign ID has a consistent group.',
        errors: [...errors, ...conflicts],
        conflicts,
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data',
        message: 'No valid data found in the uploaded file',
        errors,
      });
    }
    
    // If we have parsing errors but also valid data, we'll proceed but include errors in response
    if (errors.length > 0 && parsedData.length > 0) {
      console.log(`[WARNING] Upload proceeded with ${errors.length} parsing errors`);
    }

    // Insert/Update data in database
    console.log(`Preparing to insert/update ${parsedData.length} records for date: ${reportDate}`);
    
    const dbClient = await pool.connect();
    try {
      await dbClient.query('SELECT 1');
      console.log('Database connection successful');
      
      await dbClient.query('BEGIN');
      console.log('Transaction started');

      let insertedCount = 0;
      let updatedCount = 0;

      for (const row of parsedData) {
        // Parse campaign_id to bigint
        let campaignIdBigint: number;
        try {
          campaignIdBigint = parseInt(String(row.campaign_id).trim());
          if (isNaN(campaignIdBigint) || campaignIdBigint <= 0) {
            errors.push(`Row ${parsedData.indexOf(row) + 2}: Invalid campaign ID "${row.campaign_id}" - must be a positive number`);
            continue;
          }
        } catch (error) {
          errors.push(`Row ${parsedData.indexOf(row) + 2}: Invalid campaign ID "${row.campaign_id}" - must be a number`);
          continue;
        }

        const query = `
          INSERT INTO tiktok_sales_performance_tables.campaign_performance (
            campaign_id,
            campaign_group,
            campaign_name,
            report_date,
            campaign_type,
            cost,
            net_cost,
            live_views,
            orders_sku,
            gross_revenue,
            roi,
            currency,
            uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (campaign_id, report_date)
          DO UPDATE SET
            campaign_group = EXCLUDED.campaign_group,
            campaign_name = EXCLUDED.campaign_name,
            campaign_type = EXCLUDED.campaign_type,
            cost = EXCLUDED.cost,
            net_cost = EXCLUDED.net_cost,
            live_views = EXCLUDED.live_views,
            orders_sku = EXCLUDED.orders_sku,
            gross_revenue = EXCLUDED.gross_revenue,
            roi = EXCLUDED.roi,
            currency = EXCLUDED.currency,
            uploaded_at = CURRENT_TIMESTAMP,
            uploaded_by = EXCLUDED.uploaded_by
          RETURNING (xmax = 0) AS is_insert
        `;

        const values = [
          campaignIdBigint,
          row.campaign_group || '',
          row.campaign_name || '',
          reportDate,
          'PRODUCT',  // campaign_type for Product GMV
          row.cost || 0,
          row.net_cost || 0,
          0,  // live_views = 0 for Product GMV (not applicable)
          row.orders_sku || 0,
          row.gross_revenue || 0,
          row.roi || 0,
          row.currency || 'RM',
          userEmail as string,
        ];

        const result = await dbClient.query(query, values);
        
        if (result.rows[0].is_insert) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      }

      await dbClient.query('COMMIT');
      
      // Log the operation
      await logOperation(
        insertedCount > 0 && updatedCount > 0 ? 'update' : insertedCount > 0 ? 'upload' : 'update',
        reportDate,
        userEmail as string,
        {
          records_inserted: insertedCount,
          records_updated: updatedCount,
          records_processed: parsedData.length,
          filename: file.originalFilename || file.newFilename,
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      );

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${parsedData.length} records`,
        recordsProcessed: parsedData.length,
        recordsInserted: insertedCount,
        recordsUpdated: updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (error) {
      console.error('Database error:', error);
      try {
        await dbClient.query('ROLLBACK');
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    } finally {
      dbClient.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.stack : undefined)
        : undefined,
    });
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
  }
}

