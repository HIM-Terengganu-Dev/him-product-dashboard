# ref_sku Storage Options Analysis

## Current Structure Analysis

**Current Setup:**
- `single_sku`: 63 rows (32 kB)
- `combo_sku`: 176 rows (72 kB)
- `combo_bom_long`: 361 rows (104 kB) - Junction table
- **Total: ~208 kB** (very small!)

**Key Insights:**
- Average 2.09 components per combo (min: 1, max: 4)
- No overlap between single_sku and combo_sku (they're distinct entities)
- Most queries need 1-2 tables, only complex queries need 3 tables

---

## Option 1: Unified SKU Table (Recommended for Simplicity)

### Structure
```sql
CREATE TABLE ref_sku.sku (
  sku_name TEXT NOT NULL,
  sku_name_norm TEXT NOT NULL PRIMARY KEY,
  sku_type TEXT NOT NULL CHECK (sku_type IN ('single', 'combo')),
  title TEXT,
  product_category TEXT,  -- For single SKUs
  sale_class TEXT,        -- For single SKUs
  bundle_usage TEXT,     -- For combo SKUs
  creation_date TEXT,
  components JSONB       -- For combos: [{"sku": "VGOMX", "qty": 1}, ...]
);
```

### Pros
- ✅ **Single table** - simpler queries, less joins
- ✅ **Easier maintenance** - one table to manage
- ✅ **Flexible** - can add new SKU types easily
- ✅ **JSONB components** - PostgreSQL optimized for JSON queries
- ✅ **Indexed JSONB** - can create GIN indexes for fast component lookups

### Cons
- ❌ **Sparse columns** - some columns only apply to certain types
- ❌ **Less type safety** - need to check `sku_type` in queries
- ❌ **JSONB overhead** - slightly more storage than normalized

### Query Examples
```sql
-- Get all SKUs
SELECT * FROM ref_sku.sku;

-- Get combo with components
SELECT sku_name, title, components 
FROM ref_sku.sku 
WHERE sku_type = 'combo';

-- Find combos containing a specific SKU
SELECT sku_name, title 
FROM ref_sku.sku 
WHERE sku_type = 'combo' 
  AND components @> '[{"sku": "VGOMX"}]'::jsonb;
```

### Migration Impact
- **Medium** - Need to merge 3 tables into 1
- **Data transformation** - Convert combo_bom_long into JSONB arrays

---

## Option 2: Keep Normalized + Add Materialized View

### Structure
Keep current 3-table structure, but add a materialized view for common queries:

```sql
CREATE MATERIALIZED VIEW ref_sku.combo_with_components AS
SELECT 
  c.sku_name,
  c.sku_name_norm,
  c.title,
  c.bundle_usage,
  c.creation_date,
  jsonb_agg(
    jsonb_build_object(
      'component_sku', s.sku_name,
      'component_sku_norm', b.component_sku_norm,
      'qty', b.component_qty
    )
  ) as components
FROM ref_sku.combo_sku c
LEFT JOIN ref_sku.combo_bom_long b ON c.sku_name_norm = b.bundle_sku_norm
LEFT JOIN ref_sku.single_sku s ON b.component_sku_norm = s.sku_name_norm
GROUP BY c.sku_name, c.sku_name_norm, c.title, c.bundle_usage, c.creation_date;

CREATE INDEX ON ref_sku.combo_with_components USING GIN (components);
```

### Pros
- ✅ **Best of both worlds** - normalized for integrity, denormalized for queries
- ✅ **No data migration** - keep existing structure
- ✅ **Fast queries** - materialized view is pre-computed
- ✅ **Data integrity** - foreign keys still enforced

### Cons
- ❌ **Still 3 tables** - more complex structure
- ❌ **Refresh needed** - must refresh view when data changes
- ❌ **Storage overhead** - view duplicates some data

### Query Examples
```sql
-- Simple query (uses materialized view)
SELECT * FROM ref_sku.combo_with_components 
WHERE components @> '[{"component_sku_norm": "VGOMX"}]'::jsonb;

-- Still can use normalized tables for updates
INSERT INTO ref_sku.combo_bom_long VALUES (...);
REFRESH MATERIALIZED VIEW ref_sku.combo_with_components;
```

---

## Option 3: Hybrid - Two Tables (Single + Combo with JSONB)

### Structure
```sql
-- Keep single_sku as-is
CREATE TABLE ref_sku.single_sku (...); -- unchanged

-- Enhance combo_sku with JSONB components
CREATE TABLE ref_sku.combo_sku (
  sku_name TEXT NOT NULL,
  sku_name_norm TEXT NOT NULL PRIMARY KEY,
  title TEXT,
  bundle_usage TEXT,
  creation_date TEXT,
  components JSONB NOT NULL  -- [{"sku_norm": "VGOMX", "qty": 1}, ...]
);
```

### Pros
- ✅ **Simpler than 3 tables** - only 2 tables
- ✅ **Clear separation** - single vs combo are different entities
- ✅ **No junction table** - components stored directly
- ✅ **Fast queries** - JSONB with GIN indexes

### Cons
- ❌ **Lose some normalization** - components in JSONB
- ❌ **Migration needed** - convert combo_bom_long to JSONB
- ❌ **Less flexible** - harder to query individual components

---

## Option 4: Keep Current Structure (Recommended for Data Integrity)

### Why Keep It?

**Current structure is actually optimal because:**
1. ✅ **Properly normalized** - no data duplication
2. ✅ **Small dataset** - 208 kB total (negligible)
3. ✅ **Clear relationships** - foreign keys enforce integrity
4. ✅ **Flexible queries** - can query components independently
5. ✅ **Easy to maintain** - standard relational design
6. ✅ **No refresh needed** - always up-to-date

**The "3 times workload" concern:**
- Most queries only need 1-2 tables
- Only complex queries need all 3 tables
- PostgreSQL handles joins efficiently
- With proper indexes, performance is excellent

### Optimization Tips (if keeping current structure)
```sql
-- Add indexes for common queries
CREATE INDEX idx_combo_bom_bundle ON ref_sku.combo_bom_long(bundle_sku_norm);
CREATE INDEX idx_combo_bom_component ON ref_sku.combo_bom_long(component_sku_norm);
CREATE INDEX idx_single_sku_norm ON ref_sku.single_sku(sku_name_norm);
CREATE INDEX idx_combo_sku_norm ON ref_sku.combo_sku(sku_name_norm);
```

---

## Recommendation

### For Your Use Case: **Option 1 (Unified Table)** or **Option 4 (Keep Current)**

**Choose Option 1 if:**
- You want simpler queries (single table)
- You don't need complex component-level queries
- You prefer JSONB flexibility
- You're okay with sparse columns

**Choose Option 4 if:**
- You value data integrity and normalization
- You need to query components independently
- You want standard relational design
- You don't mind 1-2 extra joins for complex queries

**My Personal Recommendation: Option 1 (Unified Table)**
- Your dataset is small (600 rows total)
- Most queries are simple lookups
- JSONB components are perfect for combo SKUs
- Simpler codebase and maintenance

---

## Migration Script Available

I can create a migration script to convert from current 3-table structure to any of these options. Which would you prefer?

1. **Option 1**: Unified `sku` table with JSONB components
2. **Option 2**: Keep current + add materialized view
3. **Option 3**: Two tables (single_sku + combo_sku with JSONB)
4. **Option 4**: Keep current + add indexes

Let me know which approach you'd like to pursue!

