# HRIS — Modern PeopleOps Dashboard

A production-ready Human Resource Information System (HRIS) with a clean, modern interface and comprehensive backend functionality.

## Features

### Core Modules

- **Employee Management**: Complete CRUD operations for managing employee profiles
- **Leave Management**: Request, approve/reject leave applications with full tracking
- **Attendance Tracking**: Mark daily attendance with check-in/check-out functionality
- **Dashboard**: Real-time metrics and activity feed
- **User Profile**: Personal information management

### Authentication & Authorization

- Email/password authentication
- Role-based access control (Admin/Employee)
- Secure session management
- Protected routes

### Design & UI

- Clean, modern, card-based layout
- Teal accent color with light neutral palette
- Dark mode support with toggle
- Responsive mobile-friendly design
- Left sidebar navigation with collapsible menu
- Toast notifications for user feedback
- Loading states with skeletons

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **State Management**: TanStack Query

## Demo Accounts

Create these accounts after setup:

1. **Admin Account**
   - Email: admin@example.com
   - Password: Admin123!
   - Role: admin

2. **Employee 1**
   - Email: alice@example.com
   - Password: Employee123!
   - Role: employee

3. **Employee 2**
   - Email: bob@example.com
   - Password: Employee123!
   - Role: employee

## Database Schema

### Tables

- **profiles**: Employee information (name, email, position, department, hire_date)
- **user_roles**: Role assignments (admin/employee)
- **leaves**: Leave requests with approval workflow
- **attendance**: Daily check-in/check-out records
- **activity_logs**: System activity feed

### Security Features

- Row Level Security (RLS) policies on all tables
- Role-based access with security definer functions
- Automatic profile creation on user signup
- Foreign key constraints and data integrity

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Lovable account with Cloud enabled

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd hris-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. The app will be available at `http://localhost:8080`

### Backend Configuration

The backend is automatically configured through Lovable Cloud. All database tables, authentication, and security policies are pre-configured.

### Creating Demo Accounts

1. Navigate to `/auth` in your browser
2. Click on the "Sign Up" tab
3. Create accounts using the demo credentials above
4. After creating the admin account, manually grant admin role in the backend:
   - Open the Cloud tab in Lovable
   - Navigate to Database → user_roles
   - Add a record with the admin user's ID and role 'admin'

## API Endpoints (via Edge Functions)

The application uses Supabase client methods for all backend operations. Here are the main operations:

### Authentication
- Sign Up: `supabase.auth.signUp()`
- Sign In: `supabase.auth.signInWithPassword()`
- Sign Out: `supabase.auth.signOut()`
- Get Session: `supabase.auth.getSession()`

### Employees
- List: `supabase.from('profiles').select()`
- Get by ID: `supabase.from('profiles').select().eq('id', id)`
- Update: `supabase.from('profiles').update(data).eq('id', id)`

### Leaves
- Create: `supabase.from('leaves').insert(data)`
- List: `supabase.from('leaves').select()`
- Update Status: `supabase.from('leaves').update({ status }).eq('id', id)`

### Attendance
- Mark: `supabase.from('attendance').insert(data)`
- List: `supabase.from('attendance').select()`
- Update: `supabase.from('attendance').update(data).eq('id', id)`

## Role-Based Access Control

### Admin Permissions
- View all employees, leaves, and attendance
- Approve/reject leave requests
- Manage employee records
- Access all system features

### Employee Permissions
- View their own profile and edit personal details
- Request leave
- Mark their own attendance
- View their own leave and attendance history

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AppSidebar.tsx  # Navigation sidebar
│   └── DashboardLayout.tsx
├── pages/              # Route pages
│   ├── Auth.tsx        # Login/Signup
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Employees.tsx   # Employee management
│   ├── Leaves.tsx      # Leave management
│   ├── Attendance.tsx  # Attendance tracking
│   └── Profile.tsx     # User profile
├── lib/                # Utilities
│   └── auth.tsx        # Authentication context
└── App.tsx             # Main app component
```

### Environment Variables

Environment variables are automatically configured by Lovable Cloud:
- `VITE_SUPABASE_URL`: Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public API key
- `VITE_SUPABASE_PROJECT_ID`: Project identifier

## QA Testing Checklist

### Authentication
- [ ] Sign up new account
- [ ] Sign in with credentials
- [ ] Sign out
- [ ] Protected routes redirect to login
- [ ] Auto-redirect after login

### Employee Management (Admin Only)
- [ ] View all employees
- [ ] Search/filter employees
- [ ] View employee details
- [ ] Update employee information

### Leave Management
- [ ] Submit leave request (Employee)
- [ ] View own leave history (Employee)
- [ ] Approve leave request (Admin)
- [ ] Reject leave request (Admin)
- [ ] View all leave requests (Admin)

### Attendance Tracking
- [ ] Check in for the day
- [ ] Check out for the day
- [ ] View attendance history
- [ ] View all attendance (Admin)
- [ ] Calculate work hours

### Dashboard
- [ ] View summary metrics
- [ ] View recent activity feed
- [ ] Stats update in real-time

### UI/UX
- [ ] Dark mode toggle works
- [ ] Responsive on mobile
- [ ] Loading states display
- [ ] Toast notifications appear
- [ ] Forms validate input

## Deployment

To deploy the application:

1. Click the "Publish" button in Lovable
2. Your app will be deployed to a Lovable subdomain
3. For custom domains, navigate to Settings → Domains

## Support

For issues or questions:
- Check the Lovable documentation: https://docs.lovable.dev
- Visit the Cloud tab for backend management
- Review console logs for debugging

## License

MIT License - feel free to use this project as a template for your HRIS needs.
