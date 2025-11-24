import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import * as XLSX from 'xlsx';
import { pool } from '../../../../lib/db-live-gmv';
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
  live_views: number;
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

    // Log first row to help debug column names
    const originalColumns = Object.keys(XLSX.utils.sheet_to_json(worksheet)[0] || {});
    const convertedColumns = Object.keys(rawData[0] || {});
    console.log('Original Excel columns:', originalColumns);
    console.log('Converted to snake_case:', convertedColumns);
    
    // Show what "Gross Revenue" converts to
    const grossRevenueVariations = originalColumns.filter(col => 
      col.toLowerCase().includes('gross') || col.toLowerCase().includes('revenue') || col.toLowerCase().includes('gmv')
    );
    if (grossRevenueVariations.length > 0) {
      console.log('Found revenue-related columns in Excel:', grossRevenueVariations);
      grossRevenueVariations.forEach(origCol => {
        const originalRow = XLSX.utils.sheet_to_json(worksheet)[0] as any;
        const originalValue = originalRow[origCol];
        const convertedKey = toSnakeCase(origCol);
        const convertedValue = rawData[0]?.[convertedKey];
        console.log(`  "${origCol}" -> "${convertedKey}" (original value: ${originalValue}, converted value: ${convertedValue})`);
      });
    } else {
      console.log('[WARNING] No revenue-related columns found!');
      console.log('  All available columns:', originalColumns.join(', '));
    }

    // Parse and validate data
    const parsedData: ParsedRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Track campaign_id to group mapping for conflict detection
    const campaignIdToGroup = new Map<string, string>();

    // Find single-word campaign names to use as base groups
    const baseCampaignNames = new Set<string>();
    rawData.forEach((row, index) => {
      const campaignName = String(row['campaign_name'] || '').trim();
      if (campaignName && !campaignName.includes(' ')) {
        baseCampaignNames.add(campaignName);
      }
    });

    rawData.forEach((row, index) => {
      try {
        // All column names are now in snake_case
        const campaignName = String(row['campaign_name'] || '').trim();
        const campaignId = String(row['campaign_id'] || '').trim();
        
        if (!campaignId || !campaignName) {
          const availableCols = Object.keys(row).join(', ');
          errors.push(`Row ${index + 2}: Missing campaign ID or name. Available columns: ${availableCols}`);
          return;
        }

        // Helper function to extract group from brackets, parentheses, or curly braces
        // Precedence: brackets [] > parentheses () > curly braces {}
        const extractGroup = (name: string): { group: string; hasGroupMarker: boolean; warning?: string } => {
          // Detect all group markers
          const bracketMatch = name.match(/\[([^\]]+)\]/);
          const parenMatch = name.match(/\(([^)]+)\)/);
          const braceMatch = name.match(/\{([^}]+)\}/);
          
          const foundMarkers: string[] = [];
          if (bracketMatch) foundMarkers.push(`[${bracketMatch[1]}]`);
          if (parenMatch) foundMarkers.push(`(${parenMatch[1]})`);
          if (braceMatch) foundMarkers.push(`{${braceMatch[1]}}`);
          
          // Check for multiple group markers
          let warning: string | undefined;
          if (foundMarkers.length > 1) {
            warning = `Multiple group markers detected: ${foundMarkers.join(', ')}. Using precedence: brackets [] > parentheses () > curly braces {}.`;
          }
          
          // Use precedence: brackets > parentheses > braces
          if (bracketMatch) {
            return { group: bracketMatch[1].trim(), hasGroupMarker: true, warning };
          }
          
          if (parenMatch) {
            return { group: parenMatch[1].trim(), hasGroupMarker: true, warning };
          }
          
          if (braceMatch) {
            return { group: braceMatch[1].trim(), hasGroupMarker: true, warning };
          }
          
          return { group: '', hasGroupMarker: false };
        };

        // Determine campaign group
        const { group: extractedGroup, hasGroupMarker, warning } = extractGroup(campaignName);
        let campaignGroup = '';
        
        // Collect warnings about multiple group markers
        if (warning) {
          warnings.push(`Row ${index + 2} (${campaignName}): ${warning}`);
        }
        
        if (hasGroupMarker) {
          campaignGroup = extractedGroup;
        } else {
          // Find matching base campaign name
          let matched = false;
          for (const baseName of baseCampaignNames) {
            if (campaignName.toLowerCase().includes(baseName.toLowerCase())) {
              campaignGroup = baseName;
              matched = true;
              break;
            }
          }
          
          // If no match found, use the campaign name itself as group
          if (!matched) {
            if (campaignName.includes(' ')) {
              // Multi-word name without a matching base - might be an error
              errors.push(`Row ${index + 2}: Cannot determine group for "${campaignName}". Use [Group], (Group), or {Group} notation.`);
              return;
            } else {
              campaignGroup = campaignName;
            }
          }
        }

        // Add brackets to campaign name if not present
        const finalCampaignName = hasGroupMarker 
          ? campaignName 
          : `[${campaignGroup}] ${campaignName}`;

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
            // Log warning for first few rows but don't error out
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
        const liveViews = parseNumeric(row['live_views'] || 0, 'live_views');
        
        // Handle variations for orders_sku: "orders_sku", "orders", "sku"
        const ordersSku = parseNumeric(
          row['orders_sku'] || row['orders'] || row['sku'] || 0, 
          'orders_sku'
        );
        
        // Handle variations for gross_revenue: "gross_revenue", "revenue", "gmv", "total_revenue"
        // Try multiple snake_case variations (including without underscore)
        let grossRevenueRaw: any = null;
        
        // First, try standard variations
        const revenueKeys = [
          'gross_revenue',
          'grossrevenue', 
          'revenue',
          'gmv',
          'total_revenue',
          'totalrevenue',
          'gross_revenue_rm',  // In case Excel has "Gross Revenue (RM)"
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
            if (index < 3) {
              console.log(`[DEBUG] Row ${index + 2} - Found revenue in key "${revenueKey}": ${grossRevenueRaw}`);
            }
          }
        }
        
        const grossRevenue = parseNumeric(grossRevenueRaw || 0, 'gross_revenue');
        
        // Debug logging for first few rows
        if (index < 3) {
          console.log(`[DEBUG] Row ${index + 2} - Gross Revenue parsing:`, {
            'allKeys': Object.keys(row),
            'gross_revenue': row['gross_revenue'],
            'grossrevenue': row['grossrevenue'],
            'revenue': row['revenue'],
            'gmv': row['gmv'],
            'grossRevenueRaw': grossRevenueRaw,
            'grossRevenue': grossRevenue,
            'isZero': grossRevenue === 0,
            'parsedValue': grossRevenue
          });
        }
        
        // Warn if gross revenue is 0 but we expected a value
        if (grossRevenue === 0 && index < 3) {
          console.log(`[WARNING] Row ${index + 2} - Gross Revenue is 0. All row values:`, row);
        }
        
        const roi = parseNumeric(row['roi'] || 0, 'roi');

        // Determine currency (default to RM)
        let currency = 'RM';
        const costStr = String(row['cost'] || '');
        if (costStr.includes('RM')) currency = 'RM';
        else if (costStr.includes('$')) currency = 'USD';
        else if (costStr.includes('€')) currency = 'EUR';

        // Log parsed values before pushing (for debugging)
        if (index < 3) {  // Log first 3 rows
          console.log(`[DEBUG] Row ${index + 2} parsed values:`, {
            campaign_id: campaignId,
            campaign_name: finalCampaignName,
            cost,
            gross_revenue: grossRevenue,
            orders_sku: Math.floor(ordersSku),
          });
        }
        
        parsedData.push({
          campaign_id: campaignId,
          campaign_name: finalCampaignName,
          campaign_group: campaignGroup,
          cost,
          net_cost: netCost,
          live_views: Math.floor(liveViews),
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
    
    const client = await pool.connect();
    try {
      // Test connection first
      await client.query('SELECT 1');
      console.log('Database connection successful');
      
      await client.query('BEGIN');
      console.log('Transaction started');

      let insertedCount = 0;
      let updatedCount = 0;

      for (const row of parsedData) {
        // Note: ROAS is calculated automatically by the database (computed/generated column)
        // We don't need to calculate or insert it manually

        // Parse campaign_id to bigint (table expects bigint, not varchar)
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
          campaignIdBigint,  // campaign_id as bigint
          row.campaign_group || '',  // Ensure not null
          row.campaign_name || '',  // campaign_name in database (Excel: "Campaign name")
          reportDate,
          'LIVE',  // campaign_type - must be 'LIVE' or 'PRODUCT' (check constraint)
          row.cost || 0,
          row.net_cost || 0,
          row.live_views || 0,
          row.orders_sku || 0,
          row.gross_revenue || 0,
          row.roi || 0,
          row.currency || 'RM',
          'system', // TODO: Get from auth session
        ];

        const result = await client.query(query, values);
        
        // Debug: Log what was inserted for first row
        if (parsedData.indexOf(row) === 0) {
          console.log(`[DEBUG] First row INSERT/UPDATE values:`, {
            campaign_id: campaignIdBigint,
            campaign_name: row.campaign_name,
            gross_revenue: row.gross_revenue,
            cost: row.cost,
            values_array: values
          });
        }
        
        if (result.rows[0].is_insert) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      }

      await client.query('COMMIT');
      
      // Verify the data was saved correctly (check first record with gross_revenue > 0)
      const recordWithRevenue = parsedData.find(r => r.gross_revenue > 0);
      if (recordWithRevenue) {
        const verifyQuery = `
          SELECT campaign_id, campaign_name, gross_revenue, cost 
          FROM tiktok_sales_performance_tables.campaign_performance
          WHERE campaign_id = $1 AND report_date = $2
          LIMIT 1
        `;
        try {
          const verifyResult = await client.query(verifyQuery, [
            parseInt(String(recordWithRevenue.campaign_id)),
            reportDate
          ]);
          if (verifyResult.rows.length > 0) {
            const savedRow = verifyResult.rows[0];
            // Convert to numbers for comparison (database returns numeric as number or string)
            const savedRevenue = typeof savedRow.gross_revenue === 'string' 
              ? parseFloat(savedRow.gross_revenue) 
              : Number(savedRow.gross_revenue) || 0;
            const expectedRevenue = typeof recordWithRevenue.gross_revenue === 'string'
              ? parseFloat(recordWithRevenue.gross_revenue)
              : Number(recordWithRevenue.gross_revenue) || 0;
            
            console.log('[VERIFY] Data saved to database:', {
              campaign_id: savedRow.campaign_id,
              campaign_name: savedRow.campaign_name,
              gross_revenue_in_db: savedRow.gross_revenue,
              cost_in_db: savedRow.cost,
              gross_revenue_expected: recordWithRevenue.gross_revenue,
              cost_expected: recordWithRevenue.cost,
              match: savedRevenue === expectedRevenue
            });
            
            // Warn if gross_revenue doesn't match
            if (savedRevenue !== expectedRevenue) {
              console.log('[WARNING] Gross revenue mismatch! Expected:', recordWithRevenue.gross_revenue, 'Got:', savedRow.gross_revenue);
            }
          }
        } catch (verifyError) {
          console.log('[WARNING] Could not verify saved data:', verifyError);
        }
      } else {
        console.log('[WARNING] No records with gross_revenue > 0 found in parsed data!');
      }

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
        await client.query('ROLLBACK');
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    } finally {
      client.release();
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

