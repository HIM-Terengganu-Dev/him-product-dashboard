# Project Configuration & Context

This document contains project-specific information to help maintain continuity and reduce friction in future development sessions.

## Repository Information

- **GitHub Repo URL**: https://github.com/HIM-Terengganu-Dev/him-product-dashboard
- **Project Name**: HIM Wellness BI Dashboard
- **Description**: Business Intelligence dashboard for managing contacts, clients, prospects, and leads
- **Default Branch**: `main`
- **Team**: Solo developer with Cursor AI assistance

## Environment Variables

The following environment variables are required:

- `POSTGRES_URL` - PostgreSQL connection string (Neon database)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID for authentication
- `GEMINI_API_KEY` - (Mentioned in README, verify if still needed)

**Note**: User has all environment variables available. Add actual values to `.env.local` (not committed to git).

## Database Information

- **Database Type**: PostgreSQL (Neon)
- **Database Name**: `cursormade_him_db`
- **Schema Pattern**: Star Schema (denormalized dimensions for speed)
- **Schemas**: 
  - `fact` - Fact tables (e.g., `fact.fact_orders`)
  - `dim` - Dimension tables (denormalized)
  - `ref` - Reference/lookup tables
- **Connection**: Via `POSTGRES_URL` environment variable (read-only for queries)
- **Owner Access**: Via `POSTGRES_URL_DDL` in `database/.env` for DDL operations
- **DDL Management**: All database files in `database/` folder (keeps root clean)
- **Main Tables**:
  - `fact.fact_orders` - Order line items fact table (47,070 rows initial ingest)
  - `dim.dim_customer`, `dim.dim_location`, `dim.dim_product`, etc. - Dimension tables
  - `ref.authorized_users` - Authorized user emails for access control

### Database Folder Structure
- **Schema files**: `database/schema/` - DDL scripts
- **Data sources**: `database/data-sources/` - CSV files (core/facts and reference tables)
- **Scripts**: `database/scripts/` - Utility scripts (export, validation, etc.)
- **Migrations**: `database/migrations/` - Migration scripts (if using)
- **Documentation**: `database/docs/` - Schema design docs
- See `database/README.md` for complete details

### Key Database Fields

From `crm_main_table`:
- `name`, `phone_number`
- `type` - 'client' | 'prospect' | 'lead'
- `status` - 'new' | 'active' | 'churned'
- `segment` - 'high-spender' | 'repeat' | 'one-time'
- `last_order_date`, `last_order_product`, `last_marketplace`
- `aov`, `total_orders`

## Development Setup

### Prerequisites
- Node.js (version: check `package.json` engines)
- PostgreSQL access (via Neon)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Environment Setup
1. Copy `.env.example` to `.env.local` (if exists)
2. Add required environment variables
3. Run `npm run dev`

## Deployment

- **Platform**: Vercel (connected to GitHub)
- **Production URL**: https://him-product-dashboard.vercel.app
- **Deployment Branch**: `main`
- **Auto-deploy**: Yes (connected to GitHub repo)

## Project Conventions

### Code Style
- TypeScript with strict mode off (see `tsconfig.json`)
- Tailwind CSS for styling
- React functional components with hooks
- Next.js App Router for pages, Pages Router for API routes

### Branching Strategy
- **Main branch**: `main` (production)
- **Workflow**: Solo dev, working directly on `main` or feature branches as needed
- **Deployment**: Automatic via Vercel on push to `main`

### Commit Conventions
- Standard commits (no specific convention enforced)
- Descriptive commit messages recommended

## API Endpoints

### Authentication
- `POST /api/auth/check` - Check if email is authorized

### Contacts
- `GET /api/contacts` - Get paginated contacts with filters
- `GET /api/contacts/summary` - Get contacts summary
- `GET /api/contacts/marketplaceSummary` - Get marketplace breakdown
- `GET /api/contacts/export` - Export contacts as CSV

### Clients
- `GET /api/clients/status` - Get client status distribution
- `GET /api/clients/segment` - Get client segment analysis

### Prospects
- `GET /api/prospects/status` - Get prospect status distribution

## Important Notes

- **Time Zone**: Asia/Kuala_Lumpur (used for date formatting)
- **Authentication**: Google Sign-In with email-based authorization
- **User Storage**: Currently using localStorage (to be migrated to secure sessions)
- **Pagination**: Default 10 items per page
- **Cache**: API responses cached for 60s with 300s stale-while-revalidate

## Known Technical Debt / Future Improvements

1. Replace localStorage auth with secure sessions/cookies
2. Enable TypeScript strict mode
3. Add React Query/SWR for data fetching
4. Extract common components to use shared versions (some still duplicated)
5. Add comprehensive testing
6. Improve error handling and logging

## Team / Contact

- **Primary Developer**: Solo developer
- **Development Tool**: Cursor AI
- **Workflow**: Direct development with AI assistance

## Additional Resources

- [Add links to external docs, design files, etc.]

