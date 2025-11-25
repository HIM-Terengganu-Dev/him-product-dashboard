# Google Sheets Integration Setup Guide

This guide explains how to set up Google Sheets API integration to access Google Sheets data in real-time.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Sheet that you want to access
3. Administrative access to your GCP project

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and click **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Name**: e.g., "HIM Dashboard Sheets Reader"
   - **Description**: "Service account for reading Google Sheets data"
4. Click **Create and Continue**
5. Skip the optional steps (grant access, grant users access) and click **Done**

## Step 4: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

**Important**: Save this JSON file securely. It contains credentials to access your Google Sheets.

## Step 5: Get Service Account Email

1. In the service account details page, copy the **Email** address (e.g., `him-dashboard@project-id.iam.gserviceaccount.com`)
2. You'll need this to share the Google Sheet with the service account

## Step 6: Share Google Sheet with Service Account

1. Open your Google Sheet
2. Click the **Share** button (top right)
3. Paste the service account email address
4. Set permission to **Viewer** (read-only) or **Editor** (if you need write access)
5. Uncheck "Notify people" (service accounts don't have email addresses)
6. Click **Share**

## Step 7: Configure Environment Variable

You need to add the service account key to your environment variables. You have two options:

### Option A: Store as JSON String (Recommended for Vercel)

1. Open the downloaded JSON key file
2. Copy the entire JSON content
3. Add it to `.env.local` (for local development):

```bash
GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important**: The entire JSON must be on a single line with single quotes around it.

4. For Vercel deployment, add the same variable in:
   - Vercel Dashboard > Your Project > Settings > Environment Variables
   - Name: `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY`
   - Value: The entire JSON string (single line)

### Option B: Base64 Encoding (Alternative)

1. Convert the JSON file to base64:
   ```bash
   # On Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/key.json"))
   
   # On Mac/Linux:
   base64 -i path/to/key.json
   ```

2. Add to `.env.local`:
   ```bash
   GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY=<base64-encoded-string>
   ```

## Step 8: Get Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` (the long string between `/d/` and `/edit`)

Example:
- URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
- Spreadsheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## Usage Examples

### API Endpoint Usage

**Get sheet data:**
```javascript
// Get entire Sheet1
fetch('/api/google-sheets/SPREADSHEET_ID')

// Get specific range
fetch('/api/google-sheets/SPREADSHEET_ID?range=Sheet1!A1:Z1000')

// Get specific sheet
fetch('/api/google-sheets/SPREADSHEET_ID?range=Data!A1:C10')

// Get metadata
fetch('/api/google-sheets/SPREADSHEET_ID?metadata=true')
```

**Get multiple ranges:**
```javascript
fetch('/api/google-sheets/SPREADSHEET_ID/range', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ranges: ['Sheet1!A1:B10', 'Sheet2!A1:C5']
  })
})
```

### React Component Example

```typescript
import { useState, useEffect } from 'react';

function GoogleSheetViewer({ spreadsheetId, range }: { spreadsheetId: string; range?: string }) {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `/api/google-sheets/${spreadsheetId}${range ? `?range=${encodeURIComponent(range)}` : ''}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data.values);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [spreadsheetId, range]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Troubleshooting

### Error: "Permission denied"
- Make sure you've shared the Google Sheet with the service account email
- Check that the service account email has at least "Viewer" permission

### Error: "Spreadsheet not found"
- Verify the Spreadsheet ID is correct
- Check that the sheet is accessible to the service account

### Error: "GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY environment variable is not set"
- Make sure you've added the environment variable to `.env.local` (local) or Vercel environment variables (production)
- Restart your development server after adding the variable

### Error: "Invalid JSON format"
- Ensure the JSON is properly formatted and on a single line
- Check that there are no extra quotes or escaping issues
- If using base64, verify the encoding is correct

## Security Notes

1. **Never commit** the service account key file or `.env.local` to Git
2. The `.env.local` file is already in `.gitignore`
3. Service account keys have access to all sheets shared with them - use with caution
4. For production, always use Vercel Environment Variables (not committed files)
5. Consider using different service accounts for different environments (dev/prod)

## API Rate Limits

Google Sheets API has quota limits:
- **Default**: 100 requests per 100 seconds per user
- **Burst**: Up to 300 requests per 100 seconds

If you need higher limits, you can request a quota increase in Google Cloud Console.

