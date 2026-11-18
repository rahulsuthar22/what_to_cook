# Smart "What to Cook" Recommendation System & Mobile Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-5432-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.8.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1.0-6BA539?logo=openapi-initiative)](https://spec.openapis.org/oas/v3.1.0)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-4.24-green)](https://next-auth.js.org/)

---

## 📖 Project Overview

The **Smart "What to Cook" Recommendation System** is a full-stack, mobile-first culinary management platform designed to combat household food waste and streamline daily meal planning. 

The platform combines a rich desktop and tablet management portal with an **immersive, touch-first mobile application experience**. Users can discover what to cook based on items already sitting in their pantry, scroll through short-form **Food Reels** with interactive video controls, schedule weekly meal plans across breakfast, lunch, dinner, and snacks, automatically generate consolidated shopping checklists, and track nutritional macros. 

For cross-platform and mobile application clients (such as Android, iOS, React Native, and Flutter), the system provides **native OAuth verification endpoints**, **Firebase profile synchronization**, and a comprehensive **OpenAPI 3.1.0 REST API specification** with a built-in interactive **Scalar API documentation portal**.

---

## 🛠️ Tech Stack & System Architecture

### Frontend & Mobile Web Experience
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Design System:** Bespoke Vanilla CSS design system with glassmorphism, responsive drawer transitions, custom media players, and fluid mobile breakpoints (`480px`, `600px`, `768px`, `992px`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Video & Media:** YouTube Iframe Player API with synchronized audio, loop handling, touch scrubber, and HUD gesture controls

### Backend & API
- **Runtime:** Node.js 20 (Next.js Route Handlers)
- **Authentication:** 
  - [NextAuth.js (Auth.js v4)](https://next-auth.js.org/) Credentials & Google OAuth Provider
  - Native Mobile Google Sign-In SDK Token Verification (`POST /api/auth/google-native`)
  - Firebase Auth Mobile Profile Synchronization (`POST /api/auth/sync`)
- **Password Security:** `bcryptjs` salted hashing
- **API Specification:** OpenAPI 3.1.0 with interactive [Scalar](https://scalar.com/) documentation portal

### Database & Persistence
- **Engine:** [PostgreSQL](https://www.postgresql.org/) (Port 5432)
- **ORM:** [Prisma ORM 7.8](https://www.prisma.io/) with multi-file schema architecture (`prisma/schema/*.prisma`)
- **Driver:** `@prisma/adapter-pg` & `pg` connection pool

```
what_to_cook/
├── prisma/
│   ├── schema/                      # Modular Multi-File Prisma Schemas
│   │   ├── base.prisma              # Client generator & datasource configurations
│   │   ├── enums.prisma             # System enums (RecipeStatus, MealType, Difficulty, etc.)
│   │   ├── user.prisma              # Users, diets, allergens, disliked ingredients, preferences
│   │   ├── admin.prisma             # Administrative roles and portal accounts
│   │   ├── recipe.prisma            # Recipes, steps, nutrition, ingredients, diets, categories
│   │   ├── ingredient.prisma        # Master ingredients catalog and measurement units
│   │   ├── taxonomy.prisma          # Categories, cuisines, tags, diets, and allergens
│   │   ├── interaction.prisma       # Behavioural analytics, favorites/likes, and reviews
│   │   └── planner.prisma           # Meal calendar schedules and grocery checklist items
│   ├── migrations/                  # Historical SQL migration versions
│   └── seed.ts                      # Multi-entity programmatic seeding script
├── public/
│   ├── app_icon.png                 # Mobile icon and Apple touch web clip
│   └── openapi.json                 # Static OpenAPI 3.1.0 JSON specification
├── scripts/
│   └── create-superadmin.ts         # Interactive CLI script for SuperAdmin provisioning
├── src/
│   ├── app/
│   │   ├── (portal)/                # Authenticated Application Portal
│   │   │   ├── dashboard/           # Main user landing metrics and quick shortcuts
│   │   │   ├── recommendations/     # "What to Cook?" pantry matcher & context engine
│   │   │   ├── reels/               # Touch-first Food Reels short video stream
│   │   │   ├── recipes/[id]/        # Interactive recipe detail, cooking checklist, & macros
│   │   │   ├── planner/             # Monday-Sunday weekly meal planner calendar
│   │   │   ├── grocery/             # Smart shopping list compiler with recipe references
│   │   │   ├── reports/             # System reports, analytics charts, and ingredient stats
│   │   │   ├── profile/             # User profile, dietary matrices, and contact details
│   │   │   ├── admin/               # Admin dashboard, recipe creation studio, and metrics
│   │   │   ├── future/              # Interactive prototypes (Voice, AI Chef, OCR, Delivery)
│   │   │   └── layout.tsx           # Responsive portal layout with mobile drawer
│   │   ├── api/                     # Backend REST API Endpoints
│   │   │   ├── admin/stats/         # Aggregate system statistics and counts
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/   # NextAuth credentials & OAuth handlers
│   │   │   │   ├── google-native/   # Mobile SDK Google ID token verification
│   │   │   │   └── sync/            # Firebase mobile client profile sync
│   │   │   ├── grocery/             # Grocery item CRUD & clear actions
│   │   │   │   └── generate/        # Auto-compile ingredients from scheduled meals
│   │   │   ├── planner/             # Meal plan slot management (GET, POST, DELETE)
│   │   │   └── recipes/             # Recipe catalog, pagination, search, creation
│   │   │       ├── [id]/            # Individual recipe fetch & admin deletion
│   │   │       │   ├── comments/    # User review and comment threads
│   │   │       │   └── likes/       # Real-time like toggle and counters
│   │   │       └── recommend/       # Weighted ingredient matching calculation
│   │   ├── docs/                    # Scalar Interactive OpenAPI 3.1 Documentation Portal
│   │   ├── login/                   # User sign-in page with Google OAuth
│   │   ├── register/                # User onboarding with preference setup
│   │   ├── globals.css              # Custom styling, mobile navbar, & animations
│   │   ├── layout.tsx               # Root application layout and providers
│   │   └── page.tsx                 # Academic landing page
│   ├── components/
│   │   ├── Providers.tsx            # SessionProvider & Context wrappers
│   │   └── Sidebar.tsx              # Adaptive navigation (Desktop sidebar + Mobile drawer)
│   ├── config/
│   │   ├── db.ts                    # Singleton PrismaClient initialization
│   │   └── firebase.ts              # Firebase Web / Mobile SDK config initialization
│   └── context/
│       └── AuthContext.tsx          # Client-side authentication context and profile state
├── openapi.json                     # Repository root copy of OpenAPI specification
├── package.json                     # Project manifest and scripts
└── tsconfig.json                    # TypeScript compiler options
```

---

## 📱 Mobile Application Architecture & Features

The platform is engineered with a mobile-first philosophy, delivering specialized mobile user experiences alongside dedicated native mobile backend integration endpoints.

### 1. Food Reels: Short-Form Mobile Video Feed
- **File:** [src/app/(portal)/reels/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/reels/page.tsx)
- **Mobile Experience & Interactions:**
  - **Vertical Snap-Scrolling:** Implemented with CSS scroll-snapping (`scroll-snap-type: y mandatory`) mimicking mobile feed experiences (TikTok, Instagram Reels, YouTube Shorts).
  - **Synchronized Video Playback:** Uses the YouTube Iframe Player API to automatically play the reel currently centered in viewport, automatically pausing off-screen videos and restarting them seamlessly on loop completion.
  - **Audio Toggle with Feedback:** Global mute/unmute control that persists across reels, featuring an animated floating volume HUD indicator.
  - **Interactive Scrubber Bar:** Live playback scrubber with elapsed time counter, current duration, and quick seek controls (10-second rewind and 10-second forward skip).
  - **Mobile HUD Auto-Hide:** Dynamic timer auto-hides overlay details after 3 seconds of inactivity on desktop for cinematic viewing, while remaining accessible on touch devices.
  - **In-Reel Quick Meal Planner:** Direct "Add to Meal Planner" popup allowing users to immediately schedule dishes from video reels into their weekly calendar without leaving the feed.
  - **Social Engagement Drawer:**
    - Optimistic like toggle with live counter updates synced to PostgreSQL via `POST /api/recipes/[id]/likes`.
    - Sliding comments drawer with real-time review submissions and timeago timestamps.
    - One-click clipboard share button with animated toast confirmation.

### 2. Mobile-Adaptive Navigation & Drawer System
- **Files:** [src/components/Sidebar.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/components/Sidebar.tsx) & [src/app/globals.css](file:///home/avesh/WorkSpace/what_to_cook/src/app/globals.css)
- **Details:**
  - **Fixed Mobile Topbar:** On mobile viewports (`max-width: 992px`), the desktop sidebar collapses and reveals a sticky mobile navbar (`.mobile-navbar`) displaying the branded logo and an animated hamburger menu button (`Menu` / `X`).
  - **Off-Canvas Sliding Drawer:** Toggling the mobile menu slides out an off-canvas navigation drawer accompanied by a blurred backdrop overlay (`.sidebar-overlay` with `backdrop-filter: blur(4px)`).
  - **Touch Target Optimization:** Navigation links, search inputs, and modal action buttons feature generous padding (`> 44px` height) optimized for thumbs and touch input.
  - **Fluid Breakpoint Grid:**
    - `max-width: 992px`: Switches multi-column desktop grids into stacked single-column layouts for recipe details, reels, and admin consoles.
    - `max-width: 768px`: Adapts dashboard analytics and grocery planner grids to full-width mobile cards.
    - `max-width: 480px`: Optimizes typography, reduces reels padding, and refines nutrition badges for ultra-compact phone displays.

### 3. Native Mobile Client Authentication & Endpoints
- **Google Native OAuth Verification:**
  - **Endpoint:** `POST /api/auth/google-native` ([src/app/api/auth/google-native/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/auth/google-native/route.ts))
  - **Purpose:** Enables native Android and iOS apps (built with Flutter, React Native, Kotlin, or Swift) to authenticate users using the official Google Sign-In SDK.
  - **Mechanism:** The mobile client submits its Google `idToken`. The backend validates the token directly with Google's OAuth2 `tokeninfo` API, verifies the audience (`aud`) against either the Web Client ID or Android Client ID, auto-provisions the user in PostgreSQL via Prisma, generates an encrypted NextAuth JWT, and returns an authenticated session with HTTP-only cookies.
- **Firebase Mobile SDK Profile Sync:**
  - **Endpoint:** `POST /api/auth/sync` ([src/app/api/auth/sync/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/auth/sync/route.ts))
  - **Purpose:** Synchronizes user accounts created via Firebase Mobile SDKs directly into the core PostgreSQL database, preserving user profile metadata (`full_name`, `email`, `mobile_number`, `avatar_url`, and `dietary_preference`).
- **Mobile Phone Number Support:**
  - Standardized user schema includes `mobile_number` with regex format validation (`/^\+?[0-9\s\-]{7,15}$/`), allowing cross-referencing user contacts and SMS notifications.

---

## 💡 Core Platform Modules & Features

### 1. Context-Aware Ingredient Matching Engine
- **Location:** [src/app/(portal)/recommendations/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/recommendations/page.tsx) & [src/app/api/recipes/recommend/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/recommend/route.ts)
- **Features:** 
  - Select ingredients from quick-pick chips or add custom pantry items.
  - Backend runs a weighted calculation comparing available ingredients against recipe requirements, computing match percentages and sorting results accordingly.
  - Contextual awareness factors in **Time of Day** (Breakfast, Lunch, Dinner, Late Snack), **Mood** (Comfort, Healthy, Lazy, Fancy, Sweet), and **Season/Weather** (Sunny, Rainy, Chilly) to curate smart recommendations.

### 2. Interactive Recipe Cooking Experience & Nutrition
- **Location:** [src/app/(portal)/recipes/[id]/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/recipes/[id]/page.tsx)
- **Features:**
  - **Pantry Cross-Reference:** Automatically compares required ingredients against active pantry items, visually marking items as "In Pantry" vs "Missing".
  - **One-Click Grocery Addition:** Missing items can be dispatched directly to the user's grocery list with a single tap.
  - **Step-by-Step Cooking Mode:** Interactive instructions checklist where users can tap each step as they cook with live visual progress feedback.
  - **Nutritional Macro Breakdown:** Displays calories, protein, carbs, fat, fiber, and vitamins in stylized badges.

### 3. Weekly Meal Planner
- **Location:** [src/app/(portal)/planner/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/planner/page.tsx) & [src/app/api/planner/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/planner/route.ts)
- **Features:**
  - Displays a Monday-Sunday calendar grid organized into Breakfast, Lunch, Dinner, and Snack slots.
  - Allows quick scheduling, slot deletion, and direct integration with the automated grocery list generator.

### 4. Automatic Grocery List Compiler
- **Location:** [src/app/(portal)/grocery/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/grocery/page.tsx) & [src/app/api/grocery/generate/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/grocery/generate/route.ts)
- **Features:**
  - Specify a custom date range to scan planned meals and auto-compile all required ingredients.
  - Intelligent aggregation combines quantities across multiple recipes and lists which recipes require each item.
  - Interactive shopping checklist with check-off states, custom item creation, item editing, and list clearing.

### 5. Administrative Control Center & System Reports
- **Location:** [src/app/(portal)/admin/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/admin/page.tsx) & [src/app/(portal)/reports/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/reports/page.tsx)
- **Features:**
  - Platform statistics showing total registered users, active recipes, scheduled meal plans, and grocery items.
  - Analytics on most popular recipes and frequently utilized pantry ingredients.
  - Full recipe publishing studio allowing administrators to create recipes with instructions, categories, cooking times, and nutritional specs.

### 6. Interactive Future Innovation Prototypes
- **Location:** [src/app/(portal)/future/page.tsx](file:///home/avesh/WorkSpace/what_to_cook/src/app/(portal)/future/page.tsx)
- **Features:**
  - **AI Chef Assistant:** Conversational chatbot suggesting customized preparation steps.
  - **Voice Assistant:** Speech-to-text simulation for hands-free pantry additions while cooking.
  - **Smart Camera Ingredient Recognition:** Computer vision mock scanning ingredients from camera photos.
  - **Instant Grocery Delivery:** Mock cart dispatching to rapid delivery fulfillment services.

---

## 🗄️ Database Schema Architecture (Multi-File Prisma)

The database schema is organized into domain-driven modular Prisma files under [prisma/schema/](file:///home/avesh/WorkSpace/what_to_cook/prisma/schema):

| Schema File | Models & Enums Included | Domain Responsibility |
| :--- | :--- | :--- |
| **base.prisma** | `generator client`, `datasource db` | Core database provider connection and Prisma client generation configuration. |
| **enums.prisma** | `RecipeStatus`, `RecipeDifficulty`, `RecipeInteractionType`, `InteractionSource`, `MealType`, `GroceryItemStatus` | Centralized enumeration types enforcing data integrity. |
| **user.prisma** | `User`, `UserDiet`, `UserAllergen`, `UserDislikedIngredient`, `UserPreferredCuisine`, `UserPreferredCategory` | User accounts, credentials, phone numbers, and dietary preference matrices. |
| **admin.prisma** | `Admin` | Administrative credentials, security hashes, and role-based access control. |
| **recipe.prisma** | `Recipe`, `RecipeStep`, `RecipeNutrition`, `RecipeIngredient`, `RecipeCategory`, `RecipeCuisine`, `RecipeTag`, `RecipeDiet` | Comprehensive recipe definitions, nutritional macros, cooking steps, and relation join tables. |
| **ingredient.prisma** | `Ingredient`, `IngredientAllergen`, `Unit` | Master ingredient catalog, measurement units (g, ml, tbsp, cup, etc.), and allergen tagging. |
| **taxonomy.prisma** | `Category`, `Cuisine`, `Tag`, `Diet`, `Allergen` | Taxonomies, meal categories, regional cuisines, and classification labels. |
| **interaction.prisma** | `RecipeInteraction`, `RecipeFavourite`, `RecipeReview` | User behavioural analytics, likes/favorites counters, and review comment threads. |
| **planner.prisma** | `MealPlan`, `GroceryListItem` | Weekly calendar meal schedules and pantry/grocery shopping checklist items. |

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
- **Node.js** v20.x is required. Switch versions using [NVM](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 20
  nvm use 20
  ```
- **PostgreSQL** running locally on port `5432` with password authentication configured.

### 2. Configure Environment Variables
Create a `.env` file in the project root directory:

```env
# Database Configuration
PGUSER=postgres
PGHOST=localhost
PGDATABASE=what_to_cook
PGPASSWORD=postgres
PGPORT=5432

# Prisma & NextAuth configurations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/what_to_cook?schema=public"
NEXTAUTH_SECRET="your_secure_random_nextauth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Credentials (Web & Mobile SDK Client)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Firebase Client Configuration (Web & Mobile Sync)
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 3. Database Initialization & Seeding
Push the modular Prisma schema to your PostgreSQL database and populate the initial dataset:

```bash
# 1. Sync modular schema to PostgreSQL
npx prisma db push

# 2. Seed initial ingredients, units, taxonomies, and recipes
npx prisma db seed

# 3. (Optional) Create the system SuperAdmin account via CLI (singleton)
npm run create:superadmin -- --email superadmin@whattocook.com --password supersecret123
```

### 4. Install Dependencies & Launch Application

```bash
# Install NPM dependencies
npm install

# Start Next.js development server
npm run dev
```

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser or connect your mobile testing device/emulator to `http://<your-local-ip>:3000`.

---

## 📚 Backend API Documentation & OpenAPI Specification

The backend provides a complete **OpenAPI 3.1.0** specification covering all 11 route handlers and 18 HTTP operations, accompanied by a built-in **Scalar** interactive API portal.

### 🌐 Accessing the API Documentation

When the development server is running (`npm run dev`):

| Resource | URL / Path | Description |
| :--- | :--- | :--- |
| **Interactive Scalar Portal** | [`http://localhost:3000/docs`](http://localhost:3000/docs) | Modern interactive API documentation with dark mode, live "Test Request" console, and client SDK code generation. |
| **Raw OpenAPI 3.1.0 JSON** | [`http://localhost:3000/openapi.json`](http://localhost:3000/openapi.json) | Static OpenAPI specification served over HTTP. |
| **Local File (Public)** | [public/openapi.json](file:///home/avesh/WorkSpace/what_to_cook/public/openapi.json) | Static specification served under the public web root. |
| **Local File (Repository Root)** | [openapi.json](file:///home/avesh/WorkSpace/what_to_cook/openapi.json) | Root copy for IDE extensions, CI/CD pipelines, and SDK generation tools. |

---

### 🚀 Importing `openapi.json` into Mobile & API Tools

You can import `openapi.json` directly into your mobile API development toolchain:

#### 1. Postman
1. Open **Postman** and click **Import**.
2. Drag and drop [openapi.json](file:///home/avesh/WorkSpace/what_to_cook/openapi.json) or enter `http://localhost:3000/openapi.json`.
3. Postman generates a structured collection grouped by tags (`Recipes`, `Meal Planner`, `Grocery List`, `Recommendations`, `Recipe Social`, `Authentication`, `Admin`).

#### 2. Mobile Client SDK Generation (OpenAPI Generator)
You can generate strongly typed client libraries for mobile applications:
```bash
# Generate TypeScript SDK for React Native
npx @openapitools/openapi-generator-cli generate -i openapi.json -g typescript-fetch -o ./mobile-client-sdk

# Generate Dart/Flutter SDK
npx @openapitools/openapi-generator-cli generate -i openapi.json -g dart -o ./flutter-api-sdk

# Generate Swift SDK for iOS
npx @openapitools/openapi-generator-cli generate -i openapi.json -g swift5 -o ./ios-sdk
```

#### 3. Bruno / Insomnia / Swagger Editor
- Import [openapi.json](file:///home/avesh/WorkSpace/what_to_cook/openapi.json) into **Bruno** or **Insomnia** to run integration tests.
- View and edit schemas directly in [editor.swagger.io](https://editor.swagger.io/).

---

### 📋 Complete Endpoints Summary

| Tag | Route Handler | Methods | Summary |
| :--- | :--- | :--- | :--- |
| **Recipes** | [src/app/api/recipes/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/route.ts) | `GET`, `POST` | List recipes with category/difficulty filters and pagination; publish new recipe. |
| **Recipes** | [src/app/api/recipes/[id]/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/[id]/route.ts) | `GET`, `DELETE` | Retrieve recipe details by UUID; delete recipe (Admin). |
| **Recommendations** | [src/app/api/recipes/recommend/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/recommend/route.ts) | `POST` | Smart pantry-based matching algorithm with score rankings. |
| **Recipe Social** | [src/app/api/recipes/[id]/likes/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/[id]/likes/route.ts) | `GET`, `POST` | Retrieve recipe like count & user like status; toggle like. |
| **Recipe Social** | [src/app/api/recipes/[id]/comments/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/recipes/[id]/comments/route.ts) | `GET`, `POST` | List recipe reviews and comments; post new user review. |
| **Meal Planner** | [src/app/api/planner/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/planner/route.ts) | `GET`, `POST`, `DELETE` | Fetch user meal schedules; add recipe to slot; delete plan entry. |
| **Grocery List** | [src/app/api/grocery/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/grocery/route.ts) | `GET`, `POST`, `PUT`, `DELETE` | Manage grocery items with recipe references; update status; clear list. |
| **Grocery List** | [src/app/api/grocery/generate/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/grocery/generate/route.ts) | `POST` | Auto-generate missing grocery items from scheduled meal plans in date range. |
| **Admin & Analytics** | [src/app/api/admin/stats/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/admin/stats/route.ts) | `GET` | System aggregate totals, popular recipes, top ingredients, and recent users. |
| **Authentication** | [src/app/api/auth/google-native/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/auth/google-native/route.ts) | `POST` | Verify Google Native OAuth ID token from Android/iOS SDK and issue NextAuth session. |
| **Authentication** | [src/app/api/auth/sync/route.ts](file:///home/avesh/WorkSpace/what_to_cook/src/app/api/auth/sync/route.ts) | `POST` | Synchronize Firebase Auth mobile/web user account into PostgreSQL. |
