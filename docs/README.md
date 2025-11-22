# Documentation

This folder contains documentation for the codebase.

## Available Documentation

- **[codebase-organization.md](./codebase-organization.md)** - Complete guide to the codebase reorganization, shared utilities, and patterns
- **[project-config.md](./project-config.md)** - Project-specific configuration, environment variables, and context

## Quick Reference

### Import Paths

**From API routes in `pages/api/`:**
- `import { pool } from '../../lib/db'`
- `import { ... } from '../../lib/api-helpers'`
- `import type { ... } from '../../types'`

**From API routes in `pages/api/subfolder/`:**
- `import { pool } from '../../../lib/db'`
- `import { ... } from '../../../lib/api-helpers'`
- `import type { ... } from '../../../types'`

### Common Patterns

```typescript
// Standard API route
if (!validateMethod(req, res, ['GET'])) return;
const { page, limit, offset } = parsePagination(req.query);
const client = await pool.connect();
try {
  // ... queries
  sendSuccessResponse(res, data);
} catch (error) {
  sendErrorResponse(res, 500, 'Internal Server Error');
} finally {
  client.release();
}
```

