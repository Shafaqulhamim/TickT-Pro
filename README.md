# TKT Pro — HVAC Service Ticket Management (Full‑Stack)

A role‑based ticketing system for HVAC service operations. Built with **React + Vite + TypeScript** on the client and **Node.js + Express + PostgreSQL + Socket.IO** on the server. Includes authentication/authorization, customer/equipment management, ticket lifecycle with comments and history, and real‑time updates.

> Repo name: `TickT-Pro` (monorepo: client + server)

---

## ✨ Features

- **Role-based access:** admin, manager, engineer, and customer with scoped permissions.
- **Auth:** JWT login, protected routes, and profile endpoint.
- **Ticketing:** create, assign, update status/progress/deadline, view history.
- **Comments:** discussion on each ticket.
- **Customers & Equipment:** manage customers, equipment, and user-equipment assignments.
- **Equipment Requests:** engineers can request equipment for a ticket.
- **Seed data:** one‑command Postgres initialization with sample users, locations, equipment, and tickets.

---

## 🧱 Tech Stack

**Frontend**
- React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Axios API client (base URL: `http://localhost:3001/api`)

**Backend**
- Node.js, Express, PostgreSQL (`pg` pool)
- JWT auth, Helmet, CORS, Rate limiting, Joi validation
- DB seed/init scripts

---

## 🗂️ Project Structure

```
TKT-Pro-main/
├─ src/                      # React app (components, contexts, services)
│  ├─ components/            # Pages: Admin, Manager, Engineer, Customer, Tickets
│  ├─ contexts/              # AuthContext, SocketContext
│  └─ services/api.ts        # Axios instance (baseURL → http://localhost:3001/api)
├─ server/
│  ├─ index.js               # Express app + Socket.IO + routes
│  ├─ middleware/auth.js     # JWT auth & RBAC helpers
│  ├─ database/
│  │  ├─ pg.js               # Postgres pool (edit credentials here)
│  │  └─ init_pg.js          # Create tables + seed demo data
│  └─ routes/
│     ├─ auth.js             # /api/auth (login, register, profile)
│     ├─ tickets.js          # /api/tickets (CRUD, assign, status, history)
│     ├─ comments.js         # /api/comments
│     ├─ users.js            # /api/users
│     ├─ customers.js        # /api/customers
│     ├─ engineers.js        # /api/engineers
│     ├─ equipment.js        # /api/equipment
│     ├─ user_equipments.js  # /api/user_equipments
│     ├─ notifications.js    # /api/notifications
│     └─ equipment_requests.js # /api/equipment_requests
├─ package.json              # scripts for client+server dev/build
└─ ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local instance running)
- npm (or pnpm/yarn)

### 1) Install dependencies
```bash
npm install
```

### 2) Configure database & secrets
Edit Postgres credentials in **`server/database/pg.js`** (defaults):
```js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hvac',
  password: 'your_pg_password',
  port: 5432,
});
```
Optional: set `JWT_SECRET` (otherwise a default string is used):
```bash
# bash (dev)
export JWT_SECRET="replace-with-a-long-random-secret"
```

### 3) Initialize & seed the database
```bash
node server/database/init_pg.js
```
This will create the schema and insert demo data.

### 4) Run in development (client + server)
```bash
npm run dev
```
- API: `http://localhost:3001/api`
- Vite dev server: `http://localhost:5173`

> The frontend axios client points to `http://localhost:3001/api` (see `src/services/api.ts`). For production, change this value or use an env‑based config.

---

## 🔐 Demo Accounts (seeded)

All seeded users share the password **`password123`**.

| Role     | Email                   |
|----------|-------------------------|
| admin    | `admin@hvac.com`        |
| manager  | `manager@hvac.com`      |
| engineer | `engineer1@hvac.com`    |
| engineer | `engineer2@hvac.com`    |
| customer | `customer1@hvac.com`    |
| customer | `customer2@hvac.com`    |

> You can change or add users in `server/database/init_pg.js` before seeding.

---

## 🔒 Roles & Permissions (at a glance)

- **Admin**
  - Full access to all entities and actions.
  - Manage users (create/update/delete), view all tickets.
- **Manager**
  - Everything except creating managers.
  - Assign engineers to tickets, update ticket status, view reports.
- **Engineer**
  - View tickets assigned to them, post updates/responses, request equipment.
- **Customer**
  - Create tickets, view only their own tickets and comments.

(Authorization is enforced via middleware in `server/middleware/auth.js` and per‑route checks.)

---

## 📡 API Overview

Base URL: `http://localhost:3001/api`

- **Auth** (`/auth`): `POST /login`, `POST /register`, `GET /profile`
- **Tickets** (`/tickets`):
  - `GET /` (list), `POST /create`
  - `PATCH /:id/assign` (manager/admin)
  - `PATCH /:id/respond` (engineer)
  - `PUT /:id` (update), `PUT /:id/status`
  - `GET /:id/history`, `GET /active`
  - `GET /engineer` (mine), `GET /customer` (mine)
  - `POST /:id/equipment-request`
- **Comments** (`/comments`): ticket discussion
- **Users** (`/users`): list/create/delete (scoped)
- **Customers** (`/customers`): CRUD
- **Engineers** (`/engineers`): list engineers
- **Equipment** (`/equipment`): CRUD
- **User Equipments** (`/user_equipments`): assign/remove equipment for a user
- **Notifications** (`/notifications`): list
- **Equipment Requests** (`/equipment_requests`): list

See the route files under `server/routes/` for exact payloads and validation.

---

## 🧪 Testing the API quickly

```bash
# health check
curl http://localhost:3001/api/health

# login (example: admin)
curl -X POST http://localhost:3001/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@hvac.com","password":"password123"}'
```

Use the returned `token` as a Bearer token for protected endpoints.

---

## 🛠️ Scripts

```bash
npm run dev       # run server (3001) + client (5173)
npm run server    # server only (nodemon)
npm run client    # client only (vite)
npm run build     # build frontend
npm run preview   # preview frontend build
npm run lint      # eslint
```

---

## 🧰 Notes & Tips

- Change the axios base URL in `src/services/api.ts` for non‑localhost deployments.
- For production, move DB config to env vars and add `dotenv` or similar.
- Socket.IO is initialized in `server/index.js` (exported `io` for emitting events in routes).
- Rate limiting and Helmet are enabled; tweak their config as needed.

---

## 📄 License

This project is provided as‑is for educational and portfolio purposes. Add your preferred license (e.g., MIT) if you intend to open‑source it.
