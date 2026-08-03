# AgencyOS

A full-stack multi-tenant B2B SaaS platform for digital agencies to manage their operations, including projects, tasks, time tracking, invoicing, and client management.

## Tech Stack

### Frontend
- **Framework**: Angular
- **Styling**: Tailwind CSS, DaisyUI
- **State Management**: Signal-based stores
- **Icons**: FontAwesome

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB Atlas
- **Cache/Queue**: Redis (BullMQ)
- **Authentication**: JWT with RBAC
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: WebSocket (Socket.IO)

### Infrastructure
- **Monorepo**: Nx
- **Email**: SendGrid

## Project Structure

```
agency-os/
├── web-server/                 # NestJS backend (REST API + WebSocket)
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
├── web-ui/                     # Angular frontend application
│   └── src/app/
│       ├── core/              # Guards, interceptors, services
│       ├── features/          # Feature modules (auth, dashboard, projects, tasks, time, invoices)
│       ├── layout/            # Header, sidebar, main layout
│       ├── shared/            # Reusable components and models
│       └── stores/            # Signal-based state management
├── docker-compose.yml         # Redis + Mongo Express
├── .env                       # Environment variables
└── .env.example               # Example environment file
```

## Key Features

- **Multi-Tenancy**: Every document is scoped by `tenantId` with automatic data isolation via a global interceptor
- **Role-Based Access Control**: Admin, Manager, Member, and Client roles with granular permissions
- **Real-Time Time Tracking**: Live timer synchronization via WebSocket
- **Project & Task Management**: Full CRUD with status workflows
- **Notifications**: Email and in-app notification system powered by BullMQ queues
- **Dashboard**: At-a-glance view of agency metrics, recent activity, and team members
