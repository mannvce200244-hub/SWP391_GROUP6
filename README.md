# M4N — Vietnamese Traditional Musical Instruments E-Commerce

**M4N** is an e-commerce web platform for exploring and purchasing authentic Vietnamese traditional musical instruments (Đàn Tranh, Đàn Bầu, Đàn Nguyệt, Sáo Trúc, Trống...), connecting artisans, craft villages, and customers in a unified modern system.

The system serves online customers, showroom sales staff (POS), and back-office administrators within one integrated application.

---

## Technology Stack

### Backend
- **Java**: 21 (LTS)
- **Framework**: Spring Boot 4.1.1
- **Persistence**: Spring Data JPA / Hibernate 7
- **Validation**: Jakarta Bean Validation
- **Security**: Spring Security (Role-based access control)
- **Database**: PostgreSQL (`m4n_db`)
- **API Documentation**: OpenAPI 3 & Swagger UI via `springdoc-openapi` (v2.8.5)
- **Build Tool**: Maven with checked-in wrapper (`mvnw`)

### Frontend
- **Framework**: React 19
- **Build & Dev Tool**: Vite 8
- **Code Quality**: ESLint 10
- **HTTP Client**: Centralized native `fetch` client (`apiClient`)
- **Styling**: Modern Vanilla CSS Design System with editorial typography

---

## Repository Structure

```text
M4N/
├── docs/                           # Architecture, business rules & development guides
│   ├── PROJECT_SCOPE.md            # Approved scope boundary
│   ├── BUSINESS_RULES.md           # Authoritative business behavior
│   ├── CODE_QUALITY_RULES.md       # Engineering quality rules
│   ├── BACKEND_ARCHITECTURE.md     # Backend layer & package rules
│   ├── FRONTEND_ARCHITECTURE.md    # Frontend structure & state rules
│   ├── API_CONTRACT_RULES.md       # HTTP REST API contract guidelines
│   ├── DESIGN_SYSTEM.md            # Color tokens, typography & spacing
│   └── DEVELOPMENT_GUIDE.md        # Local environment & verification guide
├── m4n-backend/                    # Spring Boot application
│   ├── src/main/java/com/m4n/backend/
│   │   ├── config/                 # OpenAPI & CORS configuration
│   │   ├── controller/             # REST controllers (HTTP transport only)
│   │   ├── dto/                    # Request and response DTOs
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── entity/                 # JPA domain entities
│   │   ├── exception/              # GlobalExceptionHandler & ApiErrorResponse
│   │   ├── mapper/                 # Entity-to-DTO and DTO-to-Entity mappers
│   │   ├── repository/             # Spring Data JPA repositories
│   │   ├── security/               # SecurityFilterChain & PasswordEncoder
│   │   ├── service/                # Business service interfaces
│   │   ├── serviceImpl/            # Service implementations & transactions
│   │   ├── util/                   # Stateless generic utilities
│   │   └── validation/             # Custom validator constraints
│   ├── src/main/resources/
│   │   └── application.properties  # Datasource, JPA, OpenAPI & CORS config
│   └── pom.xml                     # Maven dependencies
├── m4n-frontend/                   # React + Vite application
│   ├── src/
│   │   ├── api/                    # Centralized API client (apiClient.js)
│   │   ├── assets/                 # Photography & brand assets
│   │   ├── components/             # Reusable UI primitives & common layouts
│   │   │   ├── common/             # Header, Footer, BrandLogo
│   │   │   └── ui/                 # Button, Input, Select, FormField, States
│   │   ├── constants/              # Category & product group constants
│   │   ├── features/               # Feature components (catalog, cart, etc.)
│   │   ├── layouts/                # CustomerLayout, AdminLayout, PosLayout
│   │   ├── pages/                  # Route-level pages (HomePage, Catalog, etc.)
│   │   ├── routes/                 # AppRouter & route link navigation
│   │   ├── services/               # Feature API services
│   │   └── styles/                 # Global styles & design system CSS
│   ├── .env.example                # Environment variables template
│   └── package.json                # npm scripts & dependencies
├── AGENTS.md                       # AI instruction router
└── README.md                       # Project overview & quickstart
```

---

## Prerequisites

- **Java Development Kit (JDK)**: 21
- **Node.js**: 20 LTS or newer (with npm)
- **PostgreSQL**: 14+ running on `localhost:5432`

---

## Getting Started

### 1. Database Setup

Create the PostgreSQL database before starting the backend:

```sql
CREATE DATABASE m4n_db;
```

### 2. Backend Setup

Configure environment variables if your PostgreSQL credentials differ from the defaults (`postgres`/`postgres`):

| Variable | Description | Default |
| --- | --- | --- |
| `DB_URL` | JDBC Connection URL | `jdbc:postgresql://localhost:5432/m4n_db` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173` |

Run tests and start the Spring Boot application:

```powershell
# Windows PowerShell
cd m4n-backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

```bash
# macOS / Linux
cd m4n-backend
./mvnw test
./mvnw spring-boot:run
```

Backend will start on `http://localhost:8080`.

### 3. API Documentation & Swagger UI

Once the backend is running, access Swagger UI and OpenAPI specifications at:
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI 3 JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
- **Health Check**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

### 4. Frontend Setup

```powershell
cd m4n-frontend
npm install
npm run dev
```

Frontend development server will start on `http://localhost:5173`.

---

## Authentication & User Management

The system implements a stateless JWT-based authentication mechanism adhering strictly to the 4 approved roles: `CUSTOMER`, `ONLINE_STAFF`, `POS_STAFF`, and `ADMIN`.

### API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Customer registration only (assigns `CUSTOMER` role) |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns Bearer JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieves current authenticated user identity |
| `GET` | `/api/v1/profile` | Authenticated | Retrieves current user's profile |
| `PUT` | `/api/v1/profile` | Authenticated | Updates current user's full name, phone, and address |

### JWT & Token Handling
- Access tokens are HMAC-SHA256 signed JWTs with configurable expiration (`JWT_EXPIRATION_MINUTES=30`).
- Token payload contains `sub` (user id), `email`, and `role`. No passwords, hashes, or sensitive PII are included.
- On the frontend, tokens are stored securely in `sessionStorage` (`m4n_access_token`) and attached automatically via `Authorization: Bearer <token>` through the centralized `apiClient`.
- Stateless logout clears `sessionStorage` and cleans up frontend state immediately.

### Swagger Bearer Authentication
1. Open Swagger UI at [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html).
2. Call `POST /api/v1/auth/login` with your credentials.
3. Copy the returned `accessToken`.
4. Click the green **Authorize** button at the top right of the Swagger UI.
5. Paste the token in the `bearerAuth` field and click **Authorize**.
6. All protected endpoints can now be tested directly.

### Development Accounts
Pre-seeded in development environment for immediate testing (password: `Password123!`):
- **Admin**: `admin@m4n.vn`
- **Online Staff**: `staff@m4n.vn`
- **POS Staff**: `pos@m4n.vn`
- **Customer**: `customer@m4n.vn`

### Frontend Role Redirect & Protection
- Upon login, users are automatically routed based on authenticated role:
  - `CUSTOMER` $\rightarrow$ `/` (Home / Storefront)
  - `ONLINE_STAFF` $\rightarrow$ `/staff` (Online Staff Workspace)
  - `POS_STAFF` $\rightarrow$ `/pos` (POS Point of Sale Workspace)
  - `ADMIN` $\rightarrow$ `/admin` (System Administration Dashboard)
- Attempting to access an unauthorized route displays `/403` Forbidden with clear guidance.
- Public catalog browsing (`/`, `/products`, `/products/:id`) remains fully accessible to unauthenticated guests.

---

## Verification & Quality Gates

### Backend Verification
```powershell
cd m4n-backend
.\mvnw.cmd clean test
```

### Frontend Verification
```powershell
cd m4n-frontend
npm run lint
npm run build
```

---

## Documentation Index

- [Approved Project Scope](docs/PROJECT_SCOPE.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Code Quality Rules](docs/CODE_QUALITY_RULES.md)
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [API Contract Rules](docs/API_CONTRACT_RULES.md)
- [Database Guide](docs/DATABASE_GUIDE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
