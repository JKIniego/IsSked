# IsSked

A web-based class schedule maker that prompts the user to manually input their courses in a semester, which will be displayed as a table. It also integrates a task/assignment list for each course.

## Deployment

This project is deployed on https://is-sked.vercel.app/

## Project Repository Structure

This README provides an overview of the repository layout to help contributors navigate quickly.

### Directory Tree
- **is-sked/**
  - **.vercel/** - Linking directory to Vercel
  - **dist/** - Root file for Vercel
  - **node_modules/** - npm dependencies
  - **public/** - Static assets served by Vite
  - **src/**
    - **assets/** - Images, icons, illustrations
    - **components/** - Reusable React components
      - **NavigationBar.jsx** - Navigation bar component
    - **css/** - CSS modules & global styles
    - **lib/** - Supabase client & utility functions
    - **pages/** - Application pages/routes
      - **AccountProfile.jsx** - Page for profile module
      - **AuthCallback.jsx** - Page for email confirmation
      - **ClassSchedule.jsx** - Page for course module
      - **LoginPage.jsx** - Root page for login to website
      - **MainDashboard.jsx** - Page after logging in and for class schedule module
      - **Notifications.jsx (WIP)** - Page for notification module
      - **ResetPassword.jsx (WIP)** - Page for reset password
      - **SetProfile.jsx** - Page for profile set up after email confirmation
      - **TaskDashboard.jsx** - Page for task module
    - **App.jsx** - Page router
    - **index.css** - Global CSS
    - **main.jsx** - Root file

## Installation

**Step 0:** Make sure you have [Node.js](https://nodejs.org/) installed.

**Step 1:** Go to is-sked/ folder.

**Step 2:** Install dependencies:
```bash
npm install
```

**Step 3:** Start the development server:
```bash
npm run dev
```

**Step 4:** After running, open your browser and go to:
```bash
http://localhost:5173/
```

## Technologies
- React
- Vite
- Supabase
