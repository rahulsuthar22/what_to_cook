# Smart "What to Cook" Recommendation System

**Academic Project Submission**  
**Submitted By:** Rahul Suthar  
**Enrollment No:** VGU24ONS3MCA0031  
**Course:** Master of Computer Applications (MCA)  
**Institution:** Centre of Distance & Online Education (CDOE), Vivekanand Global University (VGU), Jaipur  
**Academic Year:** 2025-26  
**Project Guide:** Mr. Pankaj Kulkarni, Assistant Professor

---

## 📖 Project Overview

The **Smart "What to Cook" Recommendation System** is a full-stack web application designed to reduce household food waste and simplify meal planning. Users input available ingredients in their pantry, and the system recommends matching recipes using an advanced database-scoring algorithm. The application also supports weekly meal planning across different meal categories, automated grocery shopping list generation compiled directly from scheduled meals, and an administrative analytics dashboard.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework:** Next.js 16 (App Router)
- **Programming Language:** TypeScript
- **Database & ORM:** PostgreSQL with **Prisma ORM** (fully typed queries and schema migrations)
- **Styling:** Vanilla CSS (custom design system with glassmorphism panels and micro-animations)
- **Icons:** Lucide React
- **Authentication:** **NextAuth.js** Credentials Provider (industry-standard session and token JWT management)

```
└── frontend-web/
    ├── prisma/
    │   ├── schema.prisma    # Prisma Schema Model Definitions
    │   └── seed.ts          # Programmatic Recipe, Ingredient, and Admin Seeds
    ├── src/
    │   ├── app/             # Next.js App Router (Pages & API Routes)
    │   │   ├── api/         # Backend REST API endpoints (Prisma-backed)
    │   │   ├── (portal)/    # Logged-in dashboard layout and pages
    │   │   └── page.tsx     # Landing page
    │   ├── components/      # Reusable UI components (Sidebar, Providers)
    │   ├── config/          # DB connection configuration (PrismaClient)
    │   └── context/         # NextAuth-backed Preferences Auth Context
    └── package.json
```

---

## 🚀 Local Installation & Setup

Follow these steps to run the application locally:

### 1. Prerequisites
- **Node.js** (v20 is required. If your default shell uses an older Node version, please use NVM to switch).
- **PostgreSQL** (running locally on port 5432 with password authentication configured).

### 2. Configure Environment Variables
Create a `.env` file in the `frontend-web/` directory with the following variables:

```env
# Database Configuration
PGUSER=postgres
PGHOST=localhost
PGDATABASE=what_to_cook
PGPASSWORD=postgres       # Default local PostgreSQL password
PGPORT=5432

# Firebase Config (Placeholders for local runtime)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Prisma & NextAuth configurations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/what_to_cook?schema=public"
NEXTAUTH_SECRET="7a6c6d7a363738396c6d6e6f707172737475767778797a313233343536373839"
NEXTAUTH_URL="http://localhost:3000"
```

### 2.1 Firebase Setup Guide
To get your own Firebase credentials, follow these steps:
1. **Go to Firebase Console:** Visit [https://console.firebase.google.com/](https://console.firebase.google.com/) and log in with your Google account.
2. **Create a New Project:** Click **Add Project** (or **Create Project**). Enter a name (e.g. `WhatToCook`), accept the terms, and click **Continue**. Configure Google Analytics (optional) and create the project.
3. **Register a Web App:** 
   - Once in the project overview dashboard, click the **Web icon ( `</>` )** to register a new application.
   - Enter an app nickname (e.g. `WhatToCookWeb`) and click **Register App**.
4. **Copy SDK Config Parameters:** 
   - Firebase will generate a configuration code block containing keys inside a `firebaseConfig` object.
   - Map those values to the variables in your `.env` file as shown:
     - `apiKey` &rarr; `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `authDomain` &rarr; `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `projectId` &rarr; `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `storageBucket` &rarr; `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `messagingSenderId` &rarr; `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `appId` &rarr; `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Database Initialization
Verify that your PostgreSQL credentials in `frontend-web/.env` are correct. Then run the following terminal commands to create the database, build tables, and seed initial data:

```bash
# Run these commands from the frontend-web/ directory:

# 1. Create the database (if missing) and sync the Prisma schema
npx prisma db push

# 2. Seed default ingredients, recipes, and admin account
npx prisma db seed
```

### 4. Install Dependencies & Start Server
Since Next.js 16 requires Node 20, load `nvm` and switch versions before running the server commands inside the `frontend-web/` directory:

```bash
# 1. Load NVM and switch to Node 20
source ~/.nvm/nvm.sh
nvm use 20

# 2. Install npm dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Start the local development server
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 💡 Key Modules & Workflow

### 1. Authentication & Profile Sync
- **Location:** `src/app/api/auth/[...nextauth]/route.ts` & `src/context/AuthContext.tsx`
- **Details:** The app leverages **NextAuth.js (Auth.js)** for credentials login and registration. Auth sessions and JWT tokens are managed securely in cookie storage, while the profile details (Full Name, Phone Number, Dietary Preference) are stored and fetched from the PostgreSQL `users` table via Prisma ORM.

### 2. Ingredient-Matching Engine
- **Location:** `src/app/api/recipes/recommend/route.ts`
- **Details:** Select or search for ingredients on the "What to Cook?" page. The backend runs a weighted SQL query that calculates the number of matching items vs. total ingredients required for each recipe, sorting suggestions by match percentage.

### 3. Weekly Meal Planner
- **Location:** `src/app/(portal)/planner/page.tsx`
- **Details:** Displays a Monday-Sunday calendar grid divided into Breakfast, Lunch, Dinner, and Snacks. Users can schedule recipes to specific days.

### 4. Automatic Grocery List Compiler
- **Location:** `src/app/api/grocery/generate/route.ts`
- **Details:** From the Planner page, specify a date range to automatically compile a shopping list. The system identifies all ingredients required for planned meals, skips items already on the checklist, and creates pending checklist entries.

### 5. Admin Control Center
- **Location:** `src/app/(portal)/admin/page.tsx`
- **Details:** Shows database summary statistics (Total Users, Recipes, Meal Plans), identifies the most popular recipes and frequently used ingredients, and features a recipe creation form to add new meals directly to the system.
