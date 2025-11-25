# Database Connection Strings Reference

This document provides a comprehensive reference for all database connection string environment variables used in the HIM Wellness BI Dashboard project.

## Overview

The project uses multiple PostgreSQL databases (hosted on Neon) for different purposes. Each database connection is configured via environment variables stored in different locations.

---

## Connection String Variables

### 1. `POSTGRES_URL_HIM_CRM`

**Location:** `.env.local` (root directory)

**Database:** `him_crm`

**User:** `himbi_readonly` (read-only access)

**Purpose:** 
- Primary connection for CRM-related operations
- Used by the main CRM dashboard features
- Accesses `mart_himdashboard` schema (e.g., `authorized_users` table)

**Used In:**
- `lib/db.ts` - Main database connection pool for CRM features
- `pages/api/contacts.ts` - Contacts API endpoints
- `pages/api/auth/check.ts` - Authentication checks

**Permissions:**
- Read-only access
- Can access `mart_himdashboard` schema
- **Cannot access `ref` schema** (permission denied)

**Note:** This connection does NOT have access to the `ref` schema tables (`ref.single_sku`, `ref.combo_sku`, `ref.combo_bom_long`). Use DDL connection for those.

---

### 2. `POSTGRES_URL_CURSORMADE_HIM_DB`

**Location:** `.env.local` (root directory)

**Database:** `cursormade_him_db`

**User:** Read-only user (specific user varies)

**Purpose:**
- Connection for the main data warehouse database
- Used for tickets system and TikTok sales performance data
- Accesses multiple schemas: `fact`, `dim`, `ref`, `tiktok_sales_performance_tables`, etc.

**Used In:**
- `lib/db-tickets.ts` - Tickets system database connection (with fallback to `POSTGRES_URL_HIM_CRM`)
- `lib/db-live-gmv.ts` - TikTok Live GMV and Product GMV dashboard connections (with fallback to `POSTGRES_URL_HIM_CRM`)
- `grant-tickets-permissions.js` - For extracting runtime user for permission grants

**Fallback Behavior:**
- If not set, falls back to `POSTGRES_URL_HIM_CRM`
- This allows the application to work even if this variable is not configured

**Permissions:**
- Read-only access (for runtime operations)
- Can access various schemas depending on granted permissions

---

### 3. `CURSORMADE_HIM_DB_DDL`

**Location:** `database/.env` (NOT committed to git)

**Database:** `cursormade_him_db`

**User:** `neondb_owner` (admin/owner access)

**Purpose:**
- Administrative connection for DDL operations (CREATE, ALTER, DROP) on `cursormade_him_db` database
- Schema creation and modification
- Permission grants
- Database setup and maintenance

**Used In:**
- `grant-tickets-permissions.js` - Granting permissions to runtime users
- `database/scripts/*.js` - Database setup and maintenance scripts for `cursormade_him_db`
- Schema creation and migration scripts

**Permissions:**
- Full admin/owner access
- Can create/modify schemas, tables, views
- Can grant/revoke permissions
- Can access all schemas in `cursormade_him_db`

**Important Notes:**
- **DO NOT COMMIT** this file to git (already in `.gitignore`)
- Contains sensitive admin credentials
- Only use for administrative operations, not runtime queries
- Specifically for `cursormade_him_db` database operations

---

### 4. `HIM_CRM_DDL`

**Location:** `database/.env` (NOT committed to git)

**Database:** `him_crm`

**User:** `neondb_owner` (admin/owner access)

**Purpose:**
- Administrative connection for DDL operations (CREATE, ALTER, DROP) on `him_crm` database
- Schema creation and modification in `him_crm`
- Permission grants for `him_crm` database
- Can access all schemas including `ref` schema in `him_crm`

**Used In:**
- `database/scripts/*.js` - Database setup and maintenance scripts for `him_crm`
- Scripts that need to access `ref` schema tables (`ref.single_sku`, `ref.combo_sku`, `ref.combo_bom_long`)
- Schema creation and migration scripts for `him_crm`

**Permissions:**
- Full admin/owner access
- Can create/modify schemas, tables, views
- Can grant/revoke permissions
- Can access all schemas including protected ones like `ref` in `him_crm`

**Important Notes:**
- **DO NOT COMMIT** this file to git (already in `.gitignore`)
- Contains sensitive admin credentials
- Only use for administrative operations, not runtime queries
- Specifically for `him_crm` database operations

---

## Database Summary

### `him_crm` Database

**Schemas:**
- `mart_himdashboard` - CRM dashboard tables
  - `authorized_users` - User authorization table
  - `crm_main_table` - Main CRM contacts table (if exists)
- `ref` - Reference/lookup tables
  - `single_sku` - Single SKU reference (63 rows)
  - `combo_sku` - Combo/bundle SKU reference (176 rows)
  - `combo_bom_long` - Bill of Materials for combos (361 rows)
- `auth`, `core`, `core_leads`, `flags`, `marts`, `master`, `raw`, `raw_tiktok`, `ref_tiktok`, `staging` - Other schemas

**Access:**
- Read-only: `POSTGRES_URL_HIM_CRM` (limited permissions)
- Admin: `HIM_CRM_DDL` (full admin access to `him_crm` database)

---

### `cursormade_him_db` Database

**Schemas:**
- `fact` - Fact tables (e.g., `fact_orders`)
- `dim` - Dimension tables (denormalized)
- `ref` - Reference/lookup tables
- `tiktok_sales_performance_tables` - TikTok sales data
  - `campaign_performance` - Campaign performance data (Live GMV and Product GMV)
  - Materialized views for aggregated data
- `dev_tickets` - Developer ticketing system

**Access:**
- Read-only: `POSTGRES_URL_CURSORMADE_HIM_DB` (with fallback to `POSTGRES_URL_HIM_CRM`)
- Admin: `CURSORMADE_HIM_DB_DDL` (full admin access to `cursormade_him_db` database)

---

## Usage Patterns

### For Runtime Application Code

```typescript
// CRM operations
import { pool } from '@/lib/db'; // Uses POSTGRES_URL_HIM_CRM

// Tickets system
import { pool } from '@/lib/db-tickets'; // Uses POSTGRES_URL_CURSORMADE_HIM_DB

// TikTok sales data
import { pool } from '@/lib/db-live-gmv'; // Uses POSTGRES_URL_CURSORMADE_HIM_DB
```

### For Administrative Scripts

```javascript
// Use DDL connection for cursormade_him_db admin operations
const pool = new Pool({
  connectionString: process.env.CURSORMADE_HIM_DB_DDL,
});

// Use DDL connection for him_crm admin operations
const himCrmPool = new Pool({
  connectionString: process.env.HIM_CRM_DDL,
});
```

---

## Environment File Locations

### `.env.local` (Root Directory)
- `POSTGRES_URL_HIM_CRM`
- `POSTGRES_URL_CURSORMADE_HIM_DB`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Other application environment variables

### `database/.env` (Database Directory)
- `CURSORMADE_HIM_DB_DDL` - Admin connection for `cursormade_him_db` database
- `HIM_CRM_DDL` - Admin connection for `him_crm` database
- **DO NOT COMMIT** - Contains admin credentials

---

## Permission Issues

### Common Issue: Cannot Access `ref` Schema

**Problem:** `POSTGRES_URL_HIM_CRM` uses `himbi_readonly` user which doesn't have `USAGE` permission on `ref` schema.

**Solution Options:**
1. **Grant permissions** to `himbi_readonly` user:
   ```sql
   GRANT USAGE ON SCHEMA ref TO himbi_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA ref TO himbi_readonly;
   ```

2. **Use `HIM_CRM_DDL` connection** for admin queries on `him_crm` database

3. **Create a new connection string** with appropriate permissions for `ref` schema access

---

## Quick Reference Table

| Variable Name | Location | Database | User Type | Primary Use |
|--------------|----------|----------|-----------|-------------|
| `POSTGRES_URL_HIM_CRM` | `.env.local` | `him_crm` | Read-only | CRM dashboard operations |
| `POSTGRES_URL_CURSORMADE_HIM_DB` | `.env.local` | `cursormade_him_db` | Read-only | Tickets, TikTok sales data |
| `CURSORMADE_HIM_DB_DDL` | `database/.env` | `cursormade_him_db` | Admin/Owner | DDL operations for `cursormade_him_db` |
| `HIM_CRM_DDL` | `database/.env` | `him_crm` | Admin/Owner | DDL operations for `him_crm` |

---

## Best Practices

1. **Never commit** `database/.env` file (contains admin credentials)
2. **Use read-only connections** for runtime application code
3. **Use DDL connection** only for administrative scripts and setup
4. **Check permissions** before assuming access to schemas/tables
5. **Document** any new connection strings added to the project
6. **Use fallbacks** where appropriate (e.g., `POSTGRES_URL_CURSORMADE_HIM_DB || POSTGRES_URL_HIM_CRM`)

---

## Troubleshooting

### "permission denied for schema ref"
- **Cause:** Read-only user doesn't have access
- **Solution:** Use DDL connection or grant permissions

### "relation does not exist"
- **Cause:** Wrong database or schema
- **Solution:** Verify connection string points to correct database

### "connection string not found"
- **Cause:** Environment variable not set
- **Solution:** Check `.env.local` or `database/.env` file exists and variable is defined

---

## Last Updated

- **Date:** 2025-01-XX
- **Verified Schemas:**
  - `him_crm.ref` - Contains `single_sku`, `combo_sku`, `combo_bom_long`
  - `him_crm.mart_himdashboard` - Contains `authorized_users`
  - `cursormade_him_db.tiktok_sales_performance_tables` - Contains campaign performance data

---

## Related Documentation

- `docs/project-config.md` - General project configuration
- `database/README.md` - Database setup and operations
- `database/scripts/README.md` - Database script documentation

