# 📚 MangaStore

**MangaStore** is your destination for manga, Korean manhwas, and Chinese donghuas — browse curated genres, fill your cart, place orders, and manage the whole storefront from a built-in admin dashboard.

🌐 **Live**: deployed on [Render](https://render.com) as a single Docker image.

![Stack](https://img.shields.io/badge/frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?logo=react)
![Stack](https://img.shields.io/badge/backend-Spring%20Boot%203%20(Java%2017)-6DB33F?logo=springboot)
![Stack](https://img.shields.io/badge/database-PostgreSQL%20(Neon)-4479A1?logo=postgresql)
![Stack](https://img.shields.io/badge/images-Neon%20Object%20Storage-F6821F)

## ✨ Features

- 🔍 **Storefront** — genre browsing, title search, filters & pagination, product details
- 🛒 **Cart & checkout** — quantity controls, COD/online orders, order history with status tracking and cancellation
- 👤 **Accounts** — register (with avatar), session login, forgot/reset password via email
- 🛠 **Admin dashboard** — stats overview, product/category CRUD with image uploads, order status management, user enable/disable, add administrators
- 🖼 Images hosted on Neon Object Storage (S3-compatible); UI served as a React SPA from inside the Spring Boot jar

## 🧱 Architecture

```
frontend/          React 19 + Vite + TypeScript + Tailwind CSS v4 SPA
src/main/java/…    Spring Boot REST API (/api/**) + SPA forward controller
Neon Postgres      application data
Neon Object Store  product/category/profile images (public bucket)
Firebase           ❌ removed — migrated off in Phase 1 of the UI overhaul
Thymeleaf          ❌ removed — replaced entirely by the React SPA
```

The frontend build output is packaged *into* the Spring Boot jar, so production runs as one service: pages come from the SPA, data from `/api/**`, auth from session cookies.

## 🚀 Run locally

Requirements: Java 17+ (`JAVA_HOME` set to the JDK root), Node.js 18+.

```powershell
# 1. configure credentials (never committed)
#    create .env in the project root:
#    DATASOURCE_URL=jdbc:postgresql://<host>/<db>
#    DB_USER=...            DB_PASSWORD=...
#    SENDER_EMAIL=...       APP_PASSWORD=...        # gmail app password for reset mails
#    AWS_ENDPOINT_URL_S3=   AWS_ACCESS_KEY_ID=      # Neon Object Storage credentials
#    AWS_SECRET_ACCESS_KEY= AWS_REGION=us-east-2
#    NEON_BUCKET=media-storage

# 2. backend + packaged UI on http://localhost:8080
.\mvnw.cmd clean package -DskipTests
java -jar target\shoppingdotcom-0.0.1-SNAPSHOT.jar

# 3. or live-reload UI development on http://localhost:5173
cd frontend
npm install
npm run dev        # proxies /api to :8080
```

Default seeded logins (if present in your DB): `vi@admin.com` (admin), `mai@user.com` (customer).

## 🛡 Security notes

- Secrets live only in `.env` / Render environment variables — never in git
- Session-cookie auth; CSRF is intentionally disabled (same-origin SPA + JSON APIs)
- `/api/admin/**` requires `ROLE_ADMIN`; `/api/users/**` requires any authenticated role

## 📬 Contact

- **Developer**: Abhinav Ratna
- **Email**: abhinavratna1984@gmail.com

---

Made with 💻 and ☕ by [Abhinav Ratna](https://github.com/ratna-abhinav)
