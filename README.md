# PF_V2.0

MERN stack application with Matrix / BluePill theming.

## Project Structure

```
PF_V2.0/
├── public/         React + Vite — public-facing portfolio site (port 5173)
├── admin/          React + Vite — admin panel (port 5174)
└── server/         Express + MongoDB backend (port 5000)
```

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

## Getting Started

### 1. Install dependencies (run once in each directory)

```bash
cd public && npm install
cd ../admin && npm install
cd ../server && npm install
```

### 2. Configure environment

Each directory has a `.env.example` showing required variables. Copy and fill them:

```bash
cp public/.env.example public/.env
cp admin/.env.example  admin/.env
cp server/.env.example server/.env
```

### 3. Run in development (three separate terminals)

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Public site
cd public && npm run dev

# Terminal 3 — Admin panel
cd admin && npm run dev
```

### Endpoints

| Service  | URL                    |
|----------|------------------------|
| Public   | http://localhost:5173   |
| Admin    | http://localhost:5174   |
| API      | http://localhost:5000   |
| Health   | GET /api/health        |
