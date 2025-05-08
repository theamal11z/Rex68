# REST Express API

## Overview

This is a TypeScript + Express REST API with Drizzle ORM and PostgreSQL.

## Prerequisites

- Node.js (>= v18)
- npm or yarn
- A PostgreSQL database (local or hosted, e.g., Neon)

## Installation

1. Clone the repo:

   ```bash
   git clone <your-repo-url>
   cd rest-express
   ```
2. Install dependencies:

   ```bash
   npm install
   # or yarn install
   ```

## Environment Variables

Create a `.env` file in the project root with the following:

```env
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>
```

Make sure to replace `<USER>`, `<PASSWORD>`, `<HOST>`, `<PORT>`, and `<DATABASE_NAME>` accordingly.

## Database Setup

### Using Neon (Recommended)

1. Sign up or log in at [Neon](https://neon.tech) and create a new project.
2. Copy the provided connection string.
3. Paste it into your `.env` as `DATABASE_URL`.

### Using Local PostgreSQL

1. Install PostgreSQL on your machine.
2. Create a new database and user:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE rest_express_db;
   CREATE USER rest_user WITH ENCRYPTED PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE rest_express_db TO rest_user;
   \q
   ```
3. Set your `.env`:
   ```env
   DATABASE_URL=postgresql://rest_user:password@localhost:5432/rest_express_db
   ```

## Migrations

This project uses `drizzle-kit` for schema migrations.

- Migration files live under `./migrations`.
- Schema definitions in `./shared/schema.ts`.

To push pending migrations:

```bash
npm run db:push
```

## Development

Start the server in development mode with hot reload:

```bash
npm run dev
```

Visit `http://localhost:3000` (or the port configured).

## Production

Build and start:

```bash
npm run build
npm start
```

---

Happy coding! 🚀
