# ATLAS - Enterprise Document Management Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

## 📋 Description

ATLAS is a comprehensive enterprise document management platform designed to centralize, track, and secure all company documents. It eliminates email chaos and provides complete traceability for document workflows.

## ✨ Features

### Core Functionality
- ✅ **Admin Registration** - Company + admin user creation in single flow
- ✅ **Secure Login** - Email/password authentication with session management
- ✅ **Areas Management** - Full CRUD for departments/areas with user counts
- ✅ **User Management** - Create users, assign roles (admin/user), manage status
- ✅ **Document Upload** - Drag-drop upload with file validation (10MB max)
- ✅ **Document Viewing** - PDF/image preview, metadata display
- ✅ **Document Download** - Secure downloads with history tracking
- ✅ **Document Derivation** - Forward documents with comments and traceability
- ✅ **Document History** - Complete timeline of all document actions
- ✅ **Landing Page** - Professional 9-section marketing page with animations

### Technical Features
- 🔐 **Row-Level Security (RLS)** - Data isolation per company
- 🎨 **Professional UI** - Subtle smooth animations with Framer Motion
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Optimized Performance** - Server components, lazy loading
- 🔒 **Secure File Handling** - MIME type + extension validation

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Animations | Framer Motion |
| Forms | react-hook-form + zod |
| Icons | Lucide React |
| Date Formatting | date-fns |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd atlas-refactor
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-setup.sql`
4. This creates all tables, RLS policies, indexes, and triggers

### 4. Storage Setup

Create a storage bucket in Supabase:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `documents`
3. Set the bucket to **private**
4. Add RLS policies for authenticated access

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
atlas-refactor/
├── app/
│   ├── page.tsx                    # Landing page (9 sections)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── login/page.tsx              # Login page
│   ├── register/page.tsx           # Admin registration
│   ├── auth/callback/route.ts      # OAuth callback handler
│   └── dashboard/
│       ├── layout.tsx              # Dashboard layout wrapper
│       ├── page.tsx                # Dashboard home with stats
│       ├── areas/page.tsx          # Areas management
│       ├── users/page.tsx          # User management
│       ├── upload/page.tsx         # Document upload
│       └── documents/
│           ├── page.tsx            # Documents list
│           └── [id]/page.tsx       # Document detail + history
├── components/
│   ├── ui/                         # shadcn/ui components
│   └── dashboard/
│       └── dashboard-shell.tsx     # Sidebar + header layout
├── hooks/
│   └── use-auth.tsx                # Auth context provider
├── lib/
│   ├── utils.ts                    # Utility functions
│   ├── types.ts                    # TypeScript interfaces
│   ├── validations.ts              # Zod schemas
│   └── supabase/
│       ├── client.ts               # Browser client
│       ├── server.ts               # Server client
│       └── middleware.ts           # Auth middleware helper
├── middleware.ts                   # Route protection
├── supabase-setup.sql              # Complete database schema
└── .env.local                      # Environment variables
```

## 🗄️ Database Schema

### Tables
- **companies** - Company/tenant information
- **users** - User profiles with roles
- **areas** - Departments/areas per company
- **documents** - Document metadata and file references
- **document_history** - Complete action timeline
- **notifications** - User notifications

### RLS Policies
All tables have Row-Level Security policies that:
- Restrict data access to users within the same company
- Use `get_user_company_id()` helper function for efficient lookups
- Allow admins additional management capabilities

## 🔒 Security Features

1. **Company Isolation** - Users only see data from their company
2. **Role-Based Access** - Admin vs regular user permissions
3. **File Validation** - Both extension and MIME type checking
4. **Protected Routes** - Middleware redirects unauthenticated users
5. **Secure Uploads** - Files stored in private Supabase Storage bucket

## 📱 Pages Overview

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Marketing page with 9 sections |
| Login | `/login` | User authentication |
| Register | `/register` | Company + admin registration |
| Dashboard | `/dashboard` | Stats, recent docs, quick actions |
| Areas | `/dashboard/areas` | CRUD for departments |
| Users | `/dashboard/users` | User management |
| Upload | `/dashboard/upload` | Document upload |
| Documents | `/dashboard/documents` | Document list with filters |
| Document | `/dashboard/documents/[id]` | View, download, derive, history |

## 🎨 UI/UX Design

- **Colors**: Blue-600/700 primary, Cyan/Purple accents, Slate grays
- **Typography**: Bold headlines, Inter body text
- **Animations**: Subtle fade-in, slide-up, stagger effects (Framer Motion)
- **Components**: shadcn/ui with custom styling
- **Responsive**: Desktop-first with mobile adaptations

## 📦 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Docker containers
- Self-hosted Node.js servers

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

<div align="center">
  <strong>Built with ❤️ for enterprise document management</strong>
</div>
