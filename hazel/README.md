## Hazel Inventory System

Hazel is a **fashion-focused inventory, order, and product lifecycle system**.  
The backend is a NestJS + Prisma API, and the frontend is a paid React UI wired to those APIs.

### Monorepo layout

- **Backend** (`apps/backend`): NestJS REST API, Prisma, PostgreSQL/SQLite
- **Frontend** (`apps/frontend/Default`): React + TypeScript business UI (only this variant is wired to Hazel APIs)
- **Shared packages**
  - `packages/shared-types`: shared enums/DTOs used by backend and frontend
  - `packages/api-client`: typed API client used by the frontend

### Tech stack

- **Backend**: NestJS, Prisma, PostgreSQL (prod) / SQLite (local), TypeScript
- **Frontend**: React, TypeScript, Vite, Redux Toolkit

### Running the backend

From `hazel/apps/backend`:

```bash
cp .env.example .env        # if present, or create .env with DATABASE_URL
npm install
npx prisma migrate deploy   # or `prisma migrate dev` in local dev
npx prisma generate
npm run start:dev
```

The API will default to `http://localhost:3000`.

### Running the frontend (Default theme)

From `hazel/apps/frontend/Default`:

```bash
cp .env.example .env    # create and set REACT_APP_API_URL=http://localhost:3000
npm install
npm run dev
```

Only the `Default` app is connected to the Hazel backend; the other theme folders are design templates.

### Database setup

- **Local development**: SQLite via `DATABASE_URL="file:./prisma/dev.db"` in `apps/backend/.env`
- **Production / Render**:
  - Set `DATABASE_URL` to your PostgreSQL connection string
  - Run `npx prisma migrate deploy` during deploy
  - Point the frontend `REACT_APP_API_URL` at your deployed backend URL

