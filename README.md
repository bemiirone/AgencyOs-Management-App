# AgencyOS - Backend API

A multi-tenant B2B SaaS platform for digital agencies to manage their operations.

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB Atlas
- **Cache/Queue**: Redis (BullMQ)
- **Authentication**: JWT with RBAC
- **API Documentation**: Swagger/OpenAPI
- **Monorepo**: Nx
- **Payments**: Stripe (mock mode for development)
- **Email**: SendGrid (placeholder for development)

## Project Structure

```
agency-os/
├── web-server/                 # NestJS backend application
│   └── src/
│       ├── modules/
│       │   ├── auth/          # JWT authentication, RBAC
│       │   ├── tenant/        # Workspace management
│       │   ├── project/       # Projects & tasks
│       │   ├── time/          # Time tracking + WebSocket
│       │   ├── billing/       # Invoicing + Stripe
│       │   └── notification/  # Email + notifications
│       ├── common/
│       │   ├── decorators/    # Custom decorators
│       │   ├── guards/        # JWT & RBAC guards
│       │   ├── filters/       # Exception filters
│       │   └── interceptors/  # Tenant interceptor
│       ├── config/            # Configuration modules
│       └── main.ts
├── docker-compose.yml         # Redis + Mongo Express
├── .env                       # Environment variables
└── .env.example               # Example environment file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Docker (for Redis)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agency-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB Atlas URI and other configuration.

4. **Start Redis (via Docker)**
   ```bash
   docker-compose up -d
   ```

5. **Start the development server**
   ```bash
   npx nx serve web-server
   ```

The API will be available at `http://localhost:3000`

## API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api/docs
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Tenants
- `POST /api/tenants` - Create workspace (Admin)
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `PATCH /api/tenants/:id` - Update tenant (Admin)
- `DELETE /api/tenants/:id` - Delete tenant (Admin)

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `GET /api/tasks/:id` - Get task by ID
- `PATCH /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### Time Entries
- `POST /api/time-entries` - Start timer
- `POST /api/time-entries/:id/stop` - Stop timer
- `GET /api/time-entries` - Get all time entries
- `GET /api/time-entries/running` - Get running entry
- `GET /api/time-entries/:id` - Get time entry by ID
- `PATCH /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `PATCH /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/send` - Send invoice
- `POST /api/invoices/:id/pay` - Process payment
- `DELETE /api/invoices/:id` - Delete invoice

### Notifications
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/:id/read` - Mark as read

## WebSocket Events

Connect to `ws://localhost:3000` for real-time timer updates:

- `startTimer` - Start timer tick emissions
- `stopTimer` - Stop timer and finalize duration
- `timerTick` - Received every second with elapsed time
- `timerStopped` - Received when timer stops with final duration

## User Roles

- **Admin**: Full access to workspace settings, billing, and all data
- **Manager**: Can create/manage projects, assign tasks, approve timesheets
- **Member**: Can view assigned tasks, log time, update task statuses
- **Client**: External user restricted to Client Portal

## Multi-Tenancy

Every document in MongoDB includes a `tenantId` field. A global interceptor automatically extracts the `tenantId` from the JWT and ensures strict data isolation between tenants.

## Testing

```bash
# Unit tests
npx nx test web-server

# E2E tests
npx nx test web-server-e2e
```

## Build

```bash
npx nx build web-server
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `REDIS_HOST` - Redis host (default: localhost)
- `STRIPE_SECRET_KEY` - Stripe API key (placeholder for mock mode)
- `SENDGRID_API_KEY` - SendGrid API key (placeholder for mock mode)

## Development

### Code Style

This project uses ESLint and Prettier for code formatting.

```bash
# Lint
npx nx lint web-server

# Format
npx nx format:write
```

### Adding New Modules

1. Create module directory in `web-server/src/modules/`
2. Create schema, DTOs, service, controller, and module files
3. Import module in `app.module.ts`
4. Add Swagger decorators to controller endpoints

## License

MIT
