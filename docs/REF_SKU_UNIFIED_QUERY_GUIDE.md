# ref_sku Unified Table - Query Guide

## Overview

The `ref_sku.sku` table is a unified structure that combines:
- **Single SKUs** (`sku_type = 'single'`)
- **Combo SKUs** (`sku_type = 'combo'`) with components stored as JSONB

## Table Structure

```sql
CREATE TABLE ref_sku.sku (
  sku_name TEXT NOT NULL,
  sku_name_norm TEXT NOT NULL PRIMARY KEY,
  sku_type TEXT NOT NULL CHECK (sku_type IN ('single', 'combo')),
  title TEXT,
  product_category TEXT,        -- For single SKUs
  sale_class TEXT,              -- For single SKUs
  bundle_usage TEXT,            -- For combo SKUs
  creation_date TEXT,
  components JSONB              -- For combos: array of component objects
);
```

## Component JSONB Structure

For combo SKUs, `components` is a JSONB array:
```json
[
  {
    "component_sku_norm": "VGOMX",
    "component_sku_name": "VGOMX",
    "qty": 1
  },
  {
    "component_sku_norm": "COF1",
    "component_sku_name": "COF1",
    "qty": 2
  }
]
```

## Common Queries

### 1. Get All SKUs
```sql
SELECT * FROM ref_sku.sku;
```

### 2. Get Only Single SKUs
```sql
SELECT * 
FROM ref_sku.sku 
WHERE sku_type = 'single';
```

### 3. Get Only Combo SKUs
```sql
SELECT * 
FROM ref_sku.sku 
WHERE sku_type = 'combo';
```

### 4. Get Combo with Components
```sql
SELECT 
  sku_name,
  title,
  components,
  jsonb_array_length(components) as component_count
FROM ref_sku.sku
WHERE sku_type = 'combo' 
  AND components IS NOT NULL;
```

### 5. Find Combos Containing a Specific Component
```sql
-- Find all combos that contain "VGOMX"
SELECT 
  sku_name,
  title,
  components
FROM ref_sku.sku
WHERE sku_type = 'combo'
  AND components @> '[{"component_sku_norm": "VGOMX"}]'::jsonb;
```

### 6. Find Combos Containing Multiple Components
```sql
-- Find combos that contain both "VGOMX" and "COF1"
SELECT 
  sku_name,
  title,
  components
FROM ref_sku.sku
WHERE sku_type = 'combo'
  AND components @> '[{"component_sku_norm": "VGOMX"}]'::jsonb
  AND components @> '[{"component_sku_norm": "COF1"}]'::jsonb;
```

### 7. Get Single SKUs by Category
```sql
SELECT 
  product_category,
  COUNT(*) as count,
  array_agg(sku_name) as skus
FROM ref_sku.sku
WHERE sku_type = 'single' 
  AND product_category IS NOT NULL
GROUP BY product_category
ORDER BY count DESC;
```

### 8. Get Component Details for a Combo
```sql
SELECT 
  sku_name,
  title,
  jsonb_array_elements(components) as component
FROM ref_sku.sku
WHERE sku_type = 'combo' 
  AND sku_name_norm = 'SA-VGOHIM';
```

### 9. Count Components per Combo
```sql
SELECT 
  sku_name,
  title,
  jsonb_array_length(components) as component_count
FROM ref_sku.sku
WHERE sku_type = 'combo'
ORDER BY component_count DESC;
```

### 10. Find Combos with Specific Component Quantity
```sql
-- Find combos where "VGOMX" has quantity > 1
SELECT 
  sku_name,
  title,
  component->>'component_sku_norm' as component_sku,
  (component->>'qty')::int as qty
FROM ref_sku.sku,
  jsonb_array_elements(components) as component
WHERE sku_type = 'combo'
  AND component->>'component_sku_norm' = 'VGOMX'
  AND (component->>'qty')::int > 1;
```

### 11. Get All Unique Components Used in Combos
```sql
SELECT DISTINCT
  component->>'component_sku_norm' as component_sku_norm,
  component->>'component_sku_name' as component_sku_name
FROM ref_sku.sku,
  jsonb_array_elements(components) as component
WHERE sku_type = 'combo'
ORDER BY component_sku_norm;
```

### 12. Search by SKU Name (Case-Insensitive)
```sql
SELECT *
FROM ref_sku.sku
WHERE sku_name ILIKE '%coffee%'
   OR title ILIKE '%coffee%';
```

## Indexes Available

The following indexes are created for optimal performance:

- `idx_sku_type` - On `sku_type` column
- `idx_sku_components` - GIN index on `components` JSONB (for fast component searches)
- `idx_sku_product_category` - On `product_category` (partial index for single SKUs)
- `idx_sku_bundle_usage` - On `bundle_usage` (partial index for combo SKUs)
- Primary key index on `sku_name_norm`

## Performance Tips

1. **Use GIN index for component searches**: The `@>` operator uses the GIN index automatically
2. **Filter by sku_type first**: Always filter by `sku_type` when possible
3. **Use partial indexes**: The category and bundle_usage indexes are partial (only for relevant rows)

## Migration Notes

- Old tables are backed up as `*_backup`
- All 239 SKUs migrated successfully (63 single + 176 combo)
- All 361 BOM relationships converted to JSONB components
- Average 2.05 components per combo

## Example: Complete Combo Lookup

```sql
-- Get full combo details with component information
SELECT 
  c.sku_name,
  c.title,
  c.bundle_usage,
  jsonb_array_length(c.components) as component_count,
  jsonb_pretty(c.components) as components_formatted
FROM ref_sku.sku c
WHERE c.sku_type = 'combo'
  AND c.sku_name_norm = 'SA-VGOHIM';
```

## Backup Tables

Old tables are preserved as backups:
- `ref_sku.single_sku_backup`
- `ref_sku.combo_sku_backup`
- `ref_sku.combo_bom_long_backup`

**To drop backups after verification:**
```sql
DROP TABLE ref_sku.single_sku_backup CASCADE;
DROP TABLE ref_sku.combo_sku_backup CASCADE;
DROP TABLE ref_sku.combo_bom_long_backup CASCADE;
```

