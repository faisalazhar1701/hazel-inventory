## Hazel Frontend (React)

This folder contains the paid **React + TypeScript** UI used by Hazel.

### Structure

- `Default/` – main Hazel app, wired to the NestJS backend
- Other folders (`Saas/`, `Modern/`, `Minimal/`, etc.) – design templates and demo themes, not used in production

### UI design lock

- **Design is paid and locked**:
  - No layout or visual redesigns
  - Only data wiring and required fields should be changed

### Running the main frontend

From `apps/frontend/Default`:

```bash
npm install

# create .env and point to backend API
echo 'REACT_APP_API_URL=http://localhost:3000' > .env

npm run dev
```

The app will start on the port configured by Vite (usually `5173`).

