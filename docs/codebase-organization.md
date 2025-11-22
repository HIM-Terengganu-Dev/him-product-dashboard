# Codebase Organization Documentation

## Overview

This document describes the codebase reorganization completed to improve maintainability and reduce duplication. All changes maintain existing functionality while establishing shared utilities and consistent patterns.

## File Structure

### Shared Infrastructure

```
lib/
├── db.ts                 # Single database connection pool
├── api-helpers.ts        # API utility functions

types/
└── index.ts              # Shared TypeScript types and interfaces

components/
└── common/               # Reusable components
    ├── MultiSelectDropdown.tsx
    ├── KpiCard.tsx
    ├── Pagination.tsx
    ├── SkeletonRow.tsx
    └── ChartSkeleton.tsx
```

## Key Changes

### 1. Shared Database Connection (`lib/db.ts`)

**Before:** Each API route created its own `Pool` instance (8 duplicates)

**After:** Single shared pool instance exported from `lib/db.ts`

**Usage:**
```typescript
import { pool } from '../../lib/db'; // pages/api/route.ts
import { pool } from '../../../lib/db'; // pages/api/subfolder/route.ts

const client = await pool.connect();
try {
  // ... queries
} finally {
  client.release();
}
```

### 2. Shared Types (`types/index.ts`)

**Before:** Types duplicated across API routes and components

**After:** All types centralized in `types/index.ts`

**Key Types:**
- `Contact`, `ContactType`
- `Client`, `ClientStatus`, `ClientSegment`
- `Prospect`, `ProspectStatus`
- `ApiRequest` (extends NextApiRequest)
- `ViewType`, `User`
- Response interfaces for each endpoint

**Usage:**
```typescript
import type { Contact, ContactType, ApiRequest } from '../../types';
```

### 3. API Helpers (`lib/api-helpers.ts`)

Centralized utilities for common API patterns:

#### Error Handling
```typescript
import { sendErrorResponse } from '../../lib/api-helpers';

sendErrorResponse(res, 500, 'Internal Server Error');
```

#### Success Responses
```typescript
import { sendSuccessResponse } from '../../lib/api-helpers';

sendSuccessResponse(res, data); // Adds cache headers automatically
sendSuccessResponse(res, data, 60); // Custom cache duration
```

#### Method Validation
```typescript
import { validateMethod } from '../../lib/api-helpers';

if (!validateMethod(req, res, ['GET'])) {
  return; // Already sent 405 response
}
```

#### Pagination
```typescript
import { parsePagination } from '../../lib/api-helpers';

const { page, limit, offset } = parsePagination(req.query);
```

#### Query Parameters
```typescript
import { getQueryString, parseQueryArray } from '../../lib/api-helpers';

const name = getQueryString(req.query, 'name');
const types = parseQueryArray(req.query, 'type');
```

#### Filter Builders
```typescript
import { buildMarketplaceFilter, buildProductFilter } from '../../lib/api-helpers';

const filter = buildMarketplaceFilter(marketplaceArray, paramIndex, queryParams);
if (filter.clause) {
  whereClauses.push(filter.clause);
  paramIndex = filter.nextParamIndex;
}
```

#### Date Formatting
```typescript
import { formatDate } from '../../lib/api-helpers';

const formattedDate = formatDate(row.last_order_date); // Asia/Kuala_Lumpur timezone
```

### 4. Common Components (`components/common/`)

Reusable UI components extracted to reduce duplication:

#### MultiSelectDropdown
```typescript
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';

<MultiSelectDropdown
  options={options}
  selected={selected}
  onChange={setSelected}
  placeholder="Select items"
  disabled={isLoading}
/>
```

#### KpiCard & KpiCardSkeleton
```typescript
import { KpiCard, KpiCardSkeleton } from '../common/KpiCard';

<KpiCard
  title="Total Contacts"
  value="1,234"
  icon={UserGroupIcon}
  iconColor="bg-blue-500"
  onClick={() => handleClick()}
  isActive={active}
/>

<KpiCardSkeleton />
```

#### Pagination
```typescript
import { Pagination } from '../common/Pagination';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={10}
  onPageChange={setCurrentPage}
  isLoading={isLoading}
/>
```

#### SkeletonRow & ChartSkeleton
```typescript
import { SkeletonRow } from '../common/SkeletonRow';
import { ChartSkeleton } from '../common/ChartSkeleton';

{isLoading && <SkeletonRow columns={6} />}
{isLoading && <ChartSkeleton />}
```

## API Route Patterns

### Standard API Route Structure

```typescript
import type { NextApiResponse } from 'next';
import { pool } from '../../lib/db'; // or '../../../lib/db' for subfolders
import {
  validateMethod,
  parsePagination,
  getQueryString,
  sendErrorResponse,
  sendSuccessResponse,
} from '../../lib/api-helpers';
import type { ApiRequest, Contact, UnifiedResponse } from '../../types';

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<UnifiedResponse | { error: string }>
) {
  // 1. Validate HTTP method
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  // 2. Parse query parameters
  const { page, limit, offset } = parsePagination(req.query);
  const name = getQueryString(req.query, 'name');

  // 3. Connect to database
  const client = await pool.connect();
  try {
    // 4. Build queries and execute
    const result = await client.query(/* ... */);

    // 5. Format response data
    const data = { /* ... */ };

    // 6. Send success response (includes caching)
    sendSuccessResponse(res, data);
  } catch (error) {
    console.error('Error:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  } finally {
    client.release();
  }
}
```

### Import Path Guidelines

- **Files directly in `pages/api/`**: Use `../../` to reach root
  - Example: `pages/api/contacts.ts` → `../../lib/db`
  
- **Files in `pages/api/subfolder/`**: Use `../../../` to reach root
  - Example: `pages/api/auth/check.ts` → `../../../lib/db`
  - Example: `pages/api/clients/status.ts` → `../../../lib/db`

## Updated API Routes

All the following routes were updated to use shared utilities:

- ✅ `pages/api/contacts.ts`
- ✅ `pages/api/contacts/export.ts`
- ✅ `pages/api/contacts/summary.ts`
- ✅ `pages/api/contacts/marketplaceSummary.ts`
- ✅ `pages/api/auth/check.ts`
- ✅ `pages/api/clients/status.ts`
- ✅ `pages/api/clients/segment.ts`
- ✅ `pages/api/prospects/status.ts`

## Benefits

1. **No Duplication**: Single source of truth for database, types, and utilities
2. **Type Safety**: Shared types ensure consistency between frontend and backend
3. **Easier Maintenance**: Update once, use everywhere
4. **Consistent Error Handling**: Standardized error responses
5. **Reusable Components**: Common UI patterns extracted
6. **Better Developer Experience**: Clear patterns and utilities

## Future Improvements

When updating frontend components, they can now use:

- Shared types from `types/index.ts`
- Common components from `components/common/`
- This will further reduce duplication and ensure consistency

## Notes

- All changes maintain existing functionality - no breaking changes
- Database connection pooling is now centralized, preventing connection leaks
- Response caching is standardized (60s default, 300s stale-while-revalidate)
- Date formatting consistently uses Asia/Kuala_Lumpur timezone
- Filter handling for marketplace/product includes `_NONE_` special case handling

