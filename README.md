# IsSked

IsSked is a web app for organizing class schedules, tracking course tasks, and managing a student profile in one place. Users can create an account, complete their initial profile setup, view their class schedule, and manage task lists for each course.

## Features

- Student sign up and login flow
- First-time profile setup after registration
- Degree program selection during onboarding
- Course schedule builder and layout visualization
- Per-course task dashboard
- Download schedule as PNG
- Dashboard navigation for main app views
- Supabase-powered authentication and database storage

## Current App Flow

1. User signs up or logs in.
2. New users are directed to the profile setup page.
3. User selects a degree program and continues.
4. The app redirects to the dashboard.
5. From the dashboard, the user can access schedule, profile, notifications, and course tasks.

## Deployment

This project is currently deployed at:
https://is-sked.vercel.app/

## Project Structure

```text
is-sked/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images and static media
│   ├── components/          # Reusable React components
│   │   ├── NavigationBar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── css/                 # CSS modules and component styling
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── pages/
│   │   ├── AccountProfile.jsx
│   │   ├── AuthCallback.jsx
│   │   ├── ClassSchedule.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MainDashboard.jsx
│   │   ├── Notifications.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── SetProfile.jsx
│   │   └── TaskDashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── Test.jsx
├── .vercel/                 # Vercel deployment metadata
├── dist/                    # Production build output
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── public/
```

## Installation

### Prerequisites

- Node.js 18+
- npm
- A Supabase project with the required auth and database tables configured

### Steps

1. Open the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser:

```text
http://localhost:5173/
```

## Technologies

- React
- Vite
- JavaScript
- Supabase
- CSS Modules

## Notes

- Some features such as notifications and password reset are still marked as WIP.
- The profile setup page is required for first-time users after registration.
- The app uses localStorage for session-related values and route protection checks, so authentication flow should be maintained consistently.
