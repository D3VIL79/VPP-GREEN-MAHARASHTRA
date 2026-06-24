# VPP GREEN MAHARASHTRA — WEBSITE MASTER PROMPT
## The Complete, Exhaustive Blueprint for Building the Next.js Web Application & Admin Portals

> **IMPORTANT:** Copy the entire content below (everything inside the triple-backtick code fence) and paste it into your AI coding assistant or hand it to your development team to build the website.

---

```markdown
# ══════════════════════════════════════════════════════════════════════
#  🌳 VPP GREEN MAHARASHTRA — WEBSITE MASTER PROMPT
# ══════════════════════════════════════════════════════════════════════

## SECTION 0: SYSTEM ROLE & GLOBAL RULES

You are a world-class Senior Full-Stack Engineer, Creative UI/UX Designer, and System Architect specializing in Next.js (App Router), React, Tailwind CSS, shadcn/ui, and Zustand. You will build the official web application, dashboard portals, and administrative systems for the "VPP Green Maharashtra" tree-plantation tracking and verification platform.

### CRITICAL RULES (NEVER VIOLATE)
1. **DO NOT CREATE A NEW BACKEND.** A fully functional Supabase PostgreSQL database and a Python FastAPI AI engine ALREADY EXIST. The web app must connect to them directly.
2. **DO NOT CREATE NEW DATABASE TABLES OR MODIFY THE SCHEMA.** The database schema is live and locked in production.
3. **USE THE EXACT SUPABASE TABLE NAMES AND COLUMN NAMES** specified in Section 3.
4. **USE THE EXACT AI ENGINE ENDPOINTS** specified in Section 4.
5. **BUILD EVERY WEB PORTAL & SCREEN** listed in Section 6. Do not skip any.
6. The app must be **production-grade**, not a prototype. Premium aesthetics, responsive layouts, skeleton loaders, and deep security integrations.

---

## SECTION 1: PROJECT CONTEXT

### 1.1 Project Overview
- **Project Name:** VPP Green Maharashtra
- **Tagline:** "One Student – One Tree | One Staff – One Tree"
- **Organization:** Vasantdada Patil Pratishthan (VPP), Mumbai, Maharashtra
- **Leadership:** Sr. Adv. Appasaheb Desai
- **Campaign Period:** 8th June – 15th July 2026 | Plantation: 1st – 15th July 2026

### 1.2 Participating Institutions
| Institution | Scale |
|---|---|
| VPP College of Engineering & Visual Arts | 1990 Students + 208 Staff |
| VPP's Law College | 390 Students + 15 Staff |
| VPP's M.P. College of Architecture | 111 Students + 14 Staff |
| **Total** | **2,728 participants** |

### 1.3 Core Mission
Every student and every staff member plants exactly one tree. The system tracks that tree's lifecycle: from plantation to monitoring at 3/6/9/12-month intervals. Seven AI engines verify the photo, detect the species, check GPS coordinates, score carbon absorption, predict survival, and detect duplicate/fraudulent submissions.

---

## SECTION 2: TECHNOLOGY STACK

### 2.1 Web App Stack
| Layer | Technology | Details / Libraries |
|---|---|---|
| Framework | **Next.js 15+ (App Router)** | Using React 19 for rendering pages, API routes, and Server Actions. |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid styling with custom harmonious themes, using Radix UI for accessible primitives. |
| State Management | **Zustand** | Lightweight client-side stores for auth session (`auth-store.ts`) and global app states. |
| Database Client | **@supabase/supabase-js** | Direct PostgreSQL queries via PostgREST and realtime event listeners. |
| Authentication | **Supabase Auth** | JWT-based auth utilizing Phone OTP/Password credentials. |
| GIS Mapping | **Leaflet & React-Leaflet** | For interactive high-performance tree plot maps and cluster overlays. |
| Charts / Analytics | **Recharts** | To render responsive species distribution, growth trend, and department rankings. |
| Geotag Parsing | **`exifr`** | To extract raw coordinates (latitude, longitude) and timestamps from uploaded JPEG EXIF data. |
| PDF Export | **`pdf-lib`** or HTML-to-PDF APIs | For generating plantation and survival certificates with embedded QR codes. |
| Icons | **Lucide React** | Sleek, modern icon catalog. |
| Animations | **Framer Motion** | For page transitions, slide-outs, modal glows, and hover micro-animations. |

### 2.2 Existing Backend Stack (DO NOT REBUILD)
- **Supabase PostgreSQL** with PostGIS extension.
- **Python FastAPI AI Engine** running on port `8001` with pre-trained ResNet-18 CNNs and Scikit-Learn models.

### 2.3 Assets
- **Main Logo:** Render `public/company_logo.png` as the main branding logo for the website across all navigation headers, sidebars, and authentication screens.

### 2.4 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://vbyvllrfsqjbxurgcsos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001
```

---

## SECTION 3: COMPLETE DATABASE SCHEMA (SUPABASE POSTGRESQL)

### 3.1 Enum Types
```sql
user_role: 'super_admin' | 'institution_admin' | 'department_hod' | 'faculty' | 'student' | 'staff' | 'csr_user'
institution_type: 'engineering_college' | 'law_college' | 'architecture_college' | 'school' | 'university' | 'ngo' | 'csr_partner'
verification_status: 'pending' | 'verified' | 'rejected'
health_status: 'healthy' | 'average' | 'needs_attention' | 'dead'
certificate_type: 'plantation' | 'survival_12m' | 'survival_24m' | 'green_warrior' | 'green_ambassador'
notification_type: 'monitoring_reminder' | 'monitoring_overdue' | 'plantation_approved' | 'plantation_rejected' | 'certificate_ready' | 'new_campaign' | 'general'
campaign_status: 'upcoming' | 'active' | 'completed' | 'cancelled'
```

### 3.2 Core Tables (Refer directly in Next.js code)
- **`institutions`**: Participating colleges/schools details.
- **`users`**: Profiles extending `auth.users` via trigger.
- **`campaigns`**: Plantation campaign metadata.
- **`tree_species`**: Catalog of trees (pre-seeded with 34 species).
- **`plantations`**: Core transaction records.
- **`monitoring_records`**: Tree updates at periodic cycles.
- **`monitoring_schedules`**: Auto-generated due dates for monitoring cycles.
- **`certificates`**: Issued certificates with PDF URLs.
- **`notifications`**: Logs of status alerts and updates.
- **`leaderboard_points`**: Points ledger (+30 for verified plantation, +50 for verified monitoring).
- **`badges`**: Badges (Green Warrior, Tree Protector, etc.) and mappings in `user_badges`.
- **`qr_codes`**: Unique tracking QR codes mapped to plantations.
- **`csr_partners`** / **`csr_projects`**: CSR Sponsorship structures.
- **`audit_logs`**: System audit logs.

---

## SECTION 4: AI ENGINE API SPECIFICATION (FASTAPI, PORT 8001)

The FastAPI engine processes incoming image streams locally.
- `GET /api/v1/ai/health` -> System health status.
- `POST /api/v1/ai/tree-health` -> ResNet-18 model predicting stress levels.
- `POST /api/v1/ai/species-recognition` -> ResNet-18 model verifying species matches.
- `POST /api/v1/ai/growth-estimation` -> Gradient Boosting predicting growth curves.
- `POST /api/v1/ai/carbon-score` -> Random Forest IPCC-based sequestration calculation.
- `POST /api/v1/ai/survival-prediction` -> Random Forest model projecting survival.
- `POST /api/v1/ai/predict/image` with `engine_id = "duplicate_detection"` -> Hashing model verifying image uniqueness.
- `POST /api/v1/ai/predict/image` with `engine_id = "geotag_verification"` -> Rules/DBSCAN model flags coordinates.

---

## SECTION 5: USER ROLES & PERMISSION HIERARCHY

### 5.1 System Hierarchy
```
Super Admin (VPP Head Office)
  └── Institution Admin (Principal / Campus Admin - College Level)
        └── Department HOD (Head of Department - Dept Level)
              └── Faculty Coordinator (Mentor Level)
                    └── Students & Staff (Lowest Level)
```
- **CSR Partners:** Completely independent and parallel to the institutional hierarchy. They have read-only access to view environmental metrics, GIS mapping, and leaderboards, but have no management or verification rights.

### 5.2 Scoped Managerial Access
- **Principal / Institution Admin:** Full college-level control. Can manage departmental HODs, faculty coordinators, and students across the *entire* institution. Can generate institution-wide reports.
- **Departmental HOD:** Scoped strictly to their registered department (e.g. "Computer Engineering"). HODs can *only* manage students and faculty coordinators belonging to their department.
- **Verification Rule:** Tree plantations uploaded by Faculty members under the "One Staff - One Tree" campaign **can only be verified and approved by their respective Department HODs**. HODs can also verify student plantations and monitoring updates in their department.
- **Faculty Coordinator:** Scoped strictly to their assigned group of student mentees. Can verify student plantations and monitoring logs before HOD final approval.

### 5.3 Post-Login Routing
- `student` / `staff` -> Student Portal (`/student/dashboard`)
- `faculty` -> Faculty Portal (`/faculty/dashboard`)
- `department_hod` -> HOD Portal (`/hod/dashboard`)
- `institution_admin` -> Institution Dashboard Portal (`/institution/dashboard`)
- `super_admin` -> Super Admin Portal (`/admin/dashboard`)
- `csr_user` -> CSR Sponsor Portal (`/csr/dashboard`)

---

## SECTION 6: COMPLETE SCREEN-BY-SCREEN SPECIFICATION

The web application contains a Public Portal, an authentication section, and five tailored administration directories under Next.js routes.

### 6.1 PUBLIC LANDING PAGE & GIS MAP (`/`)
- **Hero Banner:** Premium dark green nature styling presenting VPP's campaign numbers, carbon offsets, and the brand **company logo** (`company_logo.png`).
- **Interactive GIS Map:** Leaflet container plotting all verified plantations as leaf icons. Clicking a pin displays a custom tooltip showing species, planter, institution, and date.
- **Live Leaderboards:** Displays the global gamified Leaderboard page.

### 6.2 LOGIN & REGISTRATION (`/login`, `/register`)
- **Login:** Card layout displaying company logo. Authenticates using Supabase, loads profile state in Zustand, and redirects by role.
- **Register:** Step-by-step form capturing name, phone, password, role toggle, department string, and institution UUID from active dropdown list.

### 6.3 STUDENT DASHBOARD PORTAL (`/student/...`)
- **Dashboard (`/student/dashboard`):** Personal dashboard displaying cards showing own tree status, points earned, badges unlocked, and carbon offset.
- **Plant a Tree (`/student/add-tree`):** Image upload drag-and-drop.
  - Automatically parses EXIF geo metadata using `exifr`. Falls back to browser HTML5 geopositioning if missing.
  - Submits photo to FastAPI species and duplicate recognition endpoints in real-time.
  - If species confidence is < 75%, blocks submission and prompts a retake.
  - Saves coordinates and metadata to `plantations` table.
- **My Trees (`/student/trees`):** Grid of own plantations displaying thumbnail and verification states. Clicking a card opens details and a cycle timeline showing upcoming monitoring milestones.
- **Certificates (`/student/certificates`):** Earned certificates available to print or download as PDFs.

### 6.4 FACULTY DASHBOARD PORTAL (`/faculty/...`)
- **Dashboard (`/faculty/dashboard`):** Group progress overview, list of assigned mentees, and verification count.
- **Verification Queue (`/faculty/verifications`):** Dashboard to review pending submissions. Displays student photo, expected coordinates, AI confidence, and geotag validity. Buttons: Approve (awards points, updates DB status) or Reject (prompts modal to enter reasons).
- **Students List (`/faculty/students`):** Data table showing assigned student metrics, last check-in date, and monitoring schedules.

### 6.5 DEPARTMENT HOD DASHBOARD PORTAL (`/hod/...`)
- **Dashboard (`/hod/dashboard`):** A portal restricted specifically to the HOD's registered department (e.g. "Computer Engineering").
- **Stats Cards:** Total students in department, department plantation counts, department survival rate %, and pending department verifications.
- **Faculty Management (`/hod/faculty`):** Manage faculty coordinators assigned within their department. Also lists plantations uploaded by Faculty members in their department, showing Approve/Reject controls (HODs have sole verification rights over faculty trees).
- **Verifications (`/hod/verifications`):** Review and verify student submissions and monitoring updates belonging to their department.
- **Reports (`/hod/reports`):** Excel/PDF exporter for detailed departmental plantation audits, student listings, and verified survival summaries.

### 6.6 INSTITUTION ADMIN PORTAL (`/institution/...`)
- **Dashboard (`/institution/dashboard`):** Principal's overview containing comparative department charts (plantation numbers, points comparisons, and survival indexes).
- **Campaigns Planner (`/institution/campaigns`):** Creates and edits college-specific green campaigns.
- **Verifications Queue (`/institution/verifications`):** Review and verify plantations submitted by HODs/Faculty members.
- **Staff Directory (`/institution/faculty` & `/institution/students`):** Institutional control panel letting admins activate/deactivate user accounts.

### 6.7 GLOBAL GAMIFIED LEADERBOARD (`/leaderboard`)
This page is accessible by **each and every profile** and contains a clean, three-tab layout:
1. **Personal Leaderboard (Free-for-All):** An absolute ranking of all individual participants (students and faculty combined) based on total accumulated Green Points. Displays name, avatar, role badge (Faculty vs. Student), department name, and total points.
2. **Department-Level Leaderboard:** Filtered view displaying individual participants (students and faculty) ranking within a selected department. A dropdown lets users toggle between departments.
3. **Department Teams Leaderboard:** A team-based leaderboard comparing departments against each other. Departments are ranked based on their cumulative points and total verified trees.
- **Management Capabilities:** When accessed by a `SUPER_ADMIN` or `INSTITUTION_ADMIN`, they see control buttons to issue departmental bonuses (+50 points to all active members of a department team) and adjust leaderboard settings.
- **CSR Partners:** Can view the complete leaderboard tabs in read-only mode to evaluate top performers and departments for corporate awards.

### 6.8 SUPER ADMIN PORTAL (`/admin/...`)
- **System Dashboard (`/admin/dashboard`):** High-level view showing system telemetry, API latency, PostgreSQL storage, and system-wide plantation metrics.
- **Institution Management (`/admin/institutions`):** Add, modify, or disable participating colleges.
- **AI Service Telemetry (`/admin/ai`):** Control parameters for AI confidence bounds, check engine models, and evaluate neural network accuracy scores.
- **Duplicate & Fraud Control (`/admin/plantations`):** Reviews flagged photos caught by Perceptual Hashing or GPS Anomaly geofences.
- **Audit Logs (`/admin/settings`):** Review user activity trails recorded in `audit_logs`.

### 6.9 CSR SPONSOR PORTAL (`/csr/...`)
- **Dashboard (`/csr/dashboard`):** Displays sponsored campaign listings, carbon offset counts mapped to ESG metrics, and a corporate contribution map.
- **ESG Reports (`/csr/reports`):** Download customized sustainability and compliance reports.

---

## SECTION 7: UI/UX DESIGN SYSTEM

### 7.1 Styling Variables
Use these HSL variables for the CSS variables theme:
```css
--primary: 142 64% 32%;      /* Forest Green */
--primary-light: 142 40% 45%;/* Leaf Green */
--accent: 82 85% 55%;        /* Lime Green for CTA */
--background: 140 10% 96%;   /* Gray-Green Soft background */
--card: 0 0% 100%;           /* White card base */
--text-primary: 0 0% 12%;    /* Near black text */
--text-secondary: 0 0% 45%;  /* Slate text */
--radius: 1rem;              /* Rounded corners (16px) */
```

### 7.2 Core UX Directives
- **Micro-Animations:** Apply scale transitions on hover and active click states using Framer Motion.
- **Skeleton States:** Avoid screen-sized loaders. Show gray pulsing skeleton boxes matching component outlines during client-side data fetching.
- **Branding logo:** Use `public/company_logo.png` (height 32px or 40px) inside all navigation headers and sidebars.

---

## SECTION 8: STATE MANAGEMENT (ZUSTAND STORE)

Create two client-side stores in React to share sessions and options.
- **`authStore` (`stores/auth-store.ts`):** Unpacks the JWT payload, holds the current user object (role, name, phone, institutionId, department), and handles logout.
- **`appStore` (`stores/app-store.ts`):** Caches static lists such as pre-seeded species lists, campaign configurations, and pending notification badge counts.

---

## SECTION 9: NEXT.JS PROJECT FOLDER STRUCTURE

Organize the React codebase using Next.js App Router folders:

```
vpp-green-web/
├── public/                       # Static files (logos, illustrations)
│   └── company_logo.png          # Main website brand logo
├── src/
│   ├── app/                      # Next.js App Router paths
│   │   ├── page.tsx              # Public Landing GIS Map
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration wizard
│   │   ├── leaderboard/
│   │   │   └── page.tsx          # Global Gamified Leaderboard Page
│   │   ├── student/              # Student Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── add-tree/page.tsx
│   │   │   ├── trees/page.tsx
│   │   │   └── certificates/page.tsx
│   │   ├── faculty/              # Faculty Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── verifications/page.tsx
│   │   │   └── students/page.tsx
│   │   ├── hod/                  # Departmental HOD Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── faculty/page.tsx
│   │   │   ├── verifications/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── institution/          # Institution Admin (Principal) Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── campaigns/page.tsx
│   │   │   └── verifications/page.tsx
│   │   ├── admin/                # Super Admin Routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── institutions/page.tsx
│   │   │   └── ai/page.tsx
│   │   ├── csr/                  # CSR Sponsor Routes
│   │   │   └── dashboard/page.tsx
│   │   ├── layout.tsx            # Global layout wrapper
│   │   └── globals.css           /* Tailwind theme rules */
│   ├── components/               # React Components
│   │   ├── ui/                   # shadcn/ui components (button, card, etc.)
│   │   ├── map/                  # Leaflet Map components
│   │   ├── charts/               # Recharts component wrappers
│   │   └── shared/               # Header, Sidebar, layouts
│   ├── lib/                      # Helper libraries
│   │   ├── supabase.ts           # Supabase client instance
│   │   └── api.ts                # API client module
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts
│   │   └── app-store.ts
│   └── utils/                    # Geotag extractor & formatters
│       └── exif.ts
├── package.json
└── tsconfig.json
```

---

## SECTION 10: IMPLEMENTATION CHECKLIST

Ensure files are coded completely:
1. **Supabase client connection** (`lib/supabase.ts`) parsing headers and sessions correctly.
2. **exifr interface wrapper** (`utils/exif.ts`) extracting JPEG metadata.
3. **Zustand store** managing roles (super_admin, institution_admin, department_hod, faculty, student, staff, csr_user).
4. **HOD and Principal dashboards** including active verifications lists.
5. **FastAPI interface connector** utilizing fetch parameters.
```
```

Create compilation-ready, detailed Next.js code following these guidelines.
