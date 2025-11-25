import { pool } from './db-live-gmv';

export interface OperationLogDetails {
    records_inserted?: number;
    records_updated?: number;
    records_deleted?: number;
    records_processed?: number;
    filename?: string;
    errors?: string[];
    warnings?: string[];
    [key: string]: any; // Allow additional fields
}

/**
 * Log an operation performed on Live GMV data
 * @param operationType - Type of operation: 'upload', 'update', 'delete', or 'manual_entry'
 * @param reportDate - The report date (YYYY-MM-DD format)
 * @param userEmail - Email of the user performing the operation
 * @param details - Additional details about the operation (optional)
 */
export async function logOperation(
    operationType: 'upload' | 'update' | 'delete' | 'manual_entry',
    reportDate: string,
    userEmail: string,
    details?: OperationLogDetails
): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO tiktok_sales_performance_tables.operation_logs 
             (operation_type, report_date, user_email, action_details, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [
                operationType,
                reportDate,
                userEmail.toLowerCase(), // Normalize email to lowercase
                details ? JSON.stringify(details) : null,
            ]
        );
    } catch (error) {
        // Log error but don't fail the main operation
        console.error('Failed to log operation:', error);
    } finally {
        client.release();
    }
}

