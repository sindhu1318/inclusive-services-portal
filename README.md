# Inclusive Services Portal — Saved Requests (React + Express + MySQL)

This is a runnable starter project that adds login and a **My Saved Requests** table.
It connects to your existing MySQL database `inclusive_portal` and `service_requests` table.

## Requirements
- Node.js 18+ and npm
- MySQL Server / MySQL Workbench
- Your existing MySQL database and table

## 1. Configure the database
Open `backend/.env.example`, copy it to `backend/.env`, then edit the values:
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET` (use a long random secret)
- `FRONTEND_URL=http://localhost:5173`

The application expects the existing `service_requests` columns:
`id`, `full_name`, `email`, `service`, `details`, `status`, `created_at`.

If your table differs, compare it with `backend/schema.sql`. Do not drop your existing table.

## 2. Install and start the backend
Open a terminal in this folder:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure it. Then run:

```bash
npm start
```

The API runs at http://localhost:3001.

## 3. Install and start the frontend
Open a second terminal in the project folder:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).

## 4. Create your login
This starter uses a `portal_users` table to securely associate logins with email addresses.
On the first backend start, the table is created automatically.

Create an account from the **Create account** option on the page. Use the same email address stored in your existing `service_requests` rows to see those rows. For example, if a saved request uses `sindhu.maringanti@gmail.com`, register with that email address.

If an email already has saved requests, registering with that email lets the account view those matching records. This starter does not verify email ownership, so use it only for a local student demo with test data. For a real deployment, add email verification and stronger account provisioning before allowing access to existing records.

## 5. Test
1. Register an account.
2. Log in.
3. Your matching saved requests should appear in **My Saved Requests**.
4. Use **Submit a test request** to create a new request.
5. Click **Refresh** to reload records from MySQL.

## Notes
- Never share your `.env` file or upload it to GitHub.
- The backend never exposes database credentials to React.
- SQL queries are parameterized.
- The JWT secret must be identical for the backend that signs and verifies tokens.
- This is a local educational starter, not a production-ready identity system.
