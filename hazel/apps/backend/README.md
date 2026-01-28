## Hazel Backend (NestJS + Prisma)

This app is the **backend API** for the Hazel inventory and order management system.

### Purpose

- Manage **fashion products as styles + color/size variants**
- Track **inventory by variant + warehouse** with a full audit ledger
- Support **orders, customers, finance, forecasting, replenishment, and integrations**

### Tech stack

- NestJS (REST API)
- Prisma ORM
- PostgreSQL (production) / SQLite (local)
- TypeScript

### Environment

Create `.env` in `apps/backend`:

```env
DATABASE_URL="file:./prisma/dev.db"   # or a PostgreSQL URL in production
PORT=3000
```

### Install & database

```bash
cd apps/backend
npm install

# Local dev DB (SQLite) – creates dev.db if it doesn't exist
npx prisma migrate dev -n "init"
npx prisma generate
```

For production/PostgreSQL, use:

```bash
npx prisma migrate deploy
```

### Running the backend

```bash
# development watch
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

The API will listen on `http://localhost:${PORT}` (default `3000`).

### Key modules

- `products`, `styles`, `collections`, `drops`
- `inventory`, `warehouses`
- `orders`, `customers`, `customer-users`
- `forecast`, `replenishment`
- `finance`, `analytics`, `dashboard`
- `assets`, `integrations`

