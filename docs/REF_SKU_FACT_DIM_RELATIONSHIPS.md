# ref_sku Relationships with Fact and Dim Tables

## Analysis Results

### Match Rate: **91.74%** ✅

- **fact.fact_orders**: 211 out of 230 unique SKUs match (19 non-matching)
- **dim.dim_product**: 211 out of 230 unique SKUs match (19 non-matching)
- **Total rows**: 47,070 fact_orders rows with SKU data

### Non-Matching SKUs

The 19 non-matching SKUs are likely:
- New SKUs not yet added to `ref_sku`
- SKU variations (e.g., "COFFEE CUP V1" vs "COFFEECUP-V1")
- Special/one-off products
- Data entry inconsistencies

---

## Recommendation: **YES, Create Relationships** ✅

### Option 1: Foreign Key with NULL Handling (Recommended)

**Pros:**
- ✅ Enforces data integrity for matching SKUs
- ✅ Allows NULL for non-matching SKUs (flexible)
- ✅ Database enforces referential integrity
- ✅ Query optimizer can use FK for better performance

**Cons:**
- ⚠️ Requires normalizing SKU values (case/whitespace)
- ⚠️ Non-matching SKUs will be NULL (need to handle in queries)

**Implementation:**
```sql
-- Normalize SKU values first
UPDATE fact.fact_orders 
SET sku = UPPER(TRIM(sku))
WHERE sku IS NOT NULL;

UPDATE dim.dim_product 
SET sku = UPPER(TRIM(sku))
WHERE sku IS NOT NULL;

-- Add normalized SKU column for FK
ALTER TABLE fact.fact_orders 
ADD COLUMN sku_norm TEXT;

ALTER TABLE dim.dim_product 
ADD COLUMN sku_norm TEXT;

-- Populate normalized columns
UPDATE fact.fact_orders 
SET sku_norm = UPPER(TRIM(sku))
WHERE sku IS NOT NULL;

UPDATE dim.dim_product 
SET sku_norm = UPPER(TRIM(sku))
WHERE sku IS NOT NULL;

-- Create foreign keys
ALTER TABLE fact.fact_orders
ADD CONSTRAINT fk_fact_orders_sku 
FOREIGN KEY (sku_norm) 
REFERENCES ref_sku.sku(sku_name_norm);

ALTER TABLE dim.dim_product
ADD CONSTRAINT fk_dim_product_sku 
FOREIGN KEY (sku_norm) 
REFERENCES ref_sku.sku(sku_name_norm);
```

---

### Option 2: Soft Relationship (No FK Constraint)

**Pros:**
- ✅ No data changes needed
- ✅ Works with existing SKU values
- ✅ No constraint violations

**Cons:**
- ❌ No referential integrity enforcement
- ❌ Query optimizer can't use FK
- ❌ Risk of orphaned references

**Implementation:**
- Just use JOINs in queries
- No DDL changes needed
- Document the relationship in comments

---

### Option 3: Hybrid Approach (Recommended for Production)

**Steps:**
1. **Add normalized columns** (`sku_norm`) to fact and dim tables
2. **Populate** with normalized SKU values
3. **Create foreign keys** on normalized columns
4. **Keep original** `sku` column for backward compatibility
5. **Gradually migrate** queries to use `sku_norm`

**Benefits:**
- ✅ Maintains backward compatibility
- ✅ Enforces integrity on new data
- ✅ Allows gradual migration
- ✅ Can identify and fix non-matching SKUs over time

---

## Implementation Plan

### Phase 1: Data Normalization
1. Add `sku_norm` columns to `fact.fact_orders` and `dim.dim_product`
2. Populate with `UPPER(TRIM(sku))`
3. Create indexes on `sku_norm` columns

### Phase 2: Foreign Key Creation
1. Create FK: `fact.fact_orders.sku_norm -> ref_sku.sku.sku_name_norm`
2. Create FK: `dim.dim_product.sku_norm -> ref_sku.sku.sku_name_norm`
3. Handle non-matching SKUs (set to NULL or add to ref_sku)

### Phase 3: Query Migration
1. Update queries to use `sku_norm` instead of `sku`
2. Add JOINs to `ref_sku.sku` for enriched data
3. Monitor performance

### Phase 4: Cleanup (Optional)
1. After all queries migrated, consider dropping original `sku` column
2. Or keep both for compatibility

---

## Query Examples After Relationship

### Get Order with SKU Details
```sql
SELECT 
  fo.order_no,
  fo.sku_norm,
  s.sku_name,
  s.sku_type,
  s.title,
  s.product_category,
  fo.product_subtotal
FROM fact.fact_orders fo
LEFT JOIN ref_sku.sku s ON fo.sku_norm = s.sku_name_norm
WHERE fo.order_no = 'ORDER123';
```

### Get Combo SKU Components in Orders
```sql
SELECT 
  fo.order_no,
  fo.sku_norm as combo_sku,
  s.title as combo_title,
  component->>'component_sku_norm' as component_sku,
  component->>'qty' as component_qty
FROM fact.fact_orders fo
INNER JOIN ref_sku.sku s ON fo.sku_norm = s.sku_name_norm
CROSS JOIN LATERAL jsonb_array_elements(s.components) as component
WHERE s.sku_type = 'combo'
  AND s.components IS NOT NULL;
```

### Sales by Product Category
```sql
SELECT 
  s.product_category,
  COUNT(DISTINCT fo.order_no) as order_count,
  SUM(fo.product_subtotal) as total_revenue
FROM fact.fact_orders fo
INNER JOIN ref_sku.sku s ON fo.sku_norm = s.sku_name_norm
WHERE s.sku_type = 'single'
  AND s.product_category IS NOT NULL
GROUP BY s.product_category
ORDER BY total_revenue DESC;
```

---

## Benefits of Creating Relationships

1. **Data Integrity**: Database enforces valid SKU references
2. **Query Performance**: Optimizer can use FK for better join plans
3. **Enriched Queries**: Easy to get SKU details (title, category, components)
4. **Combo Analysis**: Can analyze combo SKU components in orders
5. **Data Quality**: Identifies orphaned/non-matching SKUs
6. **Reporting**: Better analytics with SKU metadata

---

## Migration Script

See `database/scripts/create-sku-relationships.js` for automated migration.

---

## Next Steps

1. ✅ Review this analysis
2. ✅ Decide on approach (Option 1, 2, or 3)
3. ✅ Run migration script
4. ✅ Update application queries
5. ✅ Monitor for non-matching SKUs
6. ✅ Add missing SKUs to `ref_sku` as needed

