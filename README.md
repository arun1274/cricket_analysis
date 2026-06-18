# Railway Monorepo Deployment Guide

This project is configured as a **monorepo**, housing both the Spring Boot backend and the Next.js frontend within the same GitHub repository. It has been optimized for automatic dual-service deployment on the **Railway** cloud platform.

## 📂 Folder Structure

```text
/
├── backend/          # Spring Boot 3 + PostgreSQL API
│   ├── pom.xml       # Maven dependencies
│   ├── src/          # Java source code
│   └── railway.json  # Railway build/start configs for backend
│
├── frontend/         # Next.js 15 UI
│   ├── package.json  # NPM dependencies
│   ├── src/          # React/Next.js source code
│   └── railway.json  # Railway build/start configs for frontend
│
└── README.md         # Deployment Guide
```

## 🚀 Deployment Flow
This architecture ensures:
- **Git Push triggers auto-deploy**: Pushing to the `main` branch immediately notifies Railway.
- **Independent builds**: The backend and frontend are built in completely separate isolated containers.
- **No manual code changes**: Environment variables dynamically route the frontend to the backend domain.

## ⚙️ Railway Service Setup

To deploy this correctly, you must create **THREE** distinct services in your Railway Project.

### 1. Database Provisioning
1. Click **New** -> **Database** -> **Add PostgreSQL**.
2. Railway will instantly provision a PostgreSQL cluster and generate connection credentials automatically.

### 2. Backend Service (Spring Boot)
1. Click **New** -> **GitHub Repo** -> Select `Cricket_Analysis`.
2. Go to the new service's **Settings** tab.
3. Under the **Build** section, set the **Root Directory** to `/backend`. 
   *(Railway will now read `/backend/pom.xml` and `/backend/railway.json` to build the app using Nixpacks).*
4. Go to the **Variables** tab and add the following:
   ```env
   SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.POSTGRES_USER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.POSTGRES_PASSWORD}}
   JWT_SECRET=your_secure_random_64_character_string_here
   ```
5. Go to the **Settings** tab, scroll to **Environment**, and click **Generate Domain** to get a public URL (e.g., `https://cpi-backend-production.up.railway.app`).

### 3. Frontend Service (Next.js)
1. Click **New** -> **GitHub Repo** -> Select `Cricket_Analysis` again.
2. Go to the new service's **Settings** tab.
3. Under the **Build** section, set the **Root Directory** to `/frontend`.
   *(Railway will now read `/frontend/package.json` and `/frontend/railway.json` to build the app using Nixpacks).*
4. Go to the **Variables** tab and add the connection string to the backend:
   ```env
   NEXT_PUBLIC_API_URL=https://<your-backend-public-domain-from-step-2>/api
   ```
   *(Ensure there is no trailing slash).*
5. Go to the **Settings** tab, scroll to **Environment**, and click **Generate Domain** to get your live public UI URL.

That's it! When you push to `main`, Railway will detect the changes. If you only changed files in `/frontend`, Railway's smart path detection will only rebuild the frontend service, saving build time.
