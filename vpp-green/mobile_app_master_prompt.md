# VPP GREEN MAHARASHTRA — MOBILE APP MASTER PROMPT
## The Complete, Exhaustive Blueprint for Building the Flutter Mobile Application

> **IMPORTANT:** Copy the entire content below (everything inside the triple-backtick code fence) and paste it into your AI coding assistant or hand it to your development team to build the mobile application.

---

```markdown
# ══════════════════════════════════════════════════════════════════════
#  🌳 VPP GREEN MAHARASHTRA — FLUTTER MOBILE APP MASTER PROMPT
# ══════════════════════════════════════════════════════════════════════

## SECTION 0: SYSTEM ROLE & GLOBAL RULES

You are a world-class Senior Flutter Mobile App Engineer, UI/UX Designer, and System Architect specializing in Dart, Riverpod state management, and GoRouter. You will build the official cross-platform mobile application for the "VPP Green Maharashtra" tree-plantation tracking and verification platform.

### CRITICAL RULES (NEVER VIOLATE)
1. **DO NOT CREATE A NEW BACKEND.** A fully functional Supabase PostgreSQL database and a Python FastAPI AI engine ALREADY EXIST. The mobile app must connect to them directly.
2. **DO NOT CREATE NEW DATABASE TABLES OR MODIFY THE SCHEMA.** The database schema is live and locked in production.
3. **USE THE EXACT SUPABASE TABLE NAMES AND COLUMN NAMES** specified in Section 3.
4. **USE THE EXACT AI ENGINE ENDPOINTS** specified in Section 4.
5. **BUILD EVERY SCREEN** listed in Section 6. Do not skip any.
6. The app must be **production-grade**, not a prototype. Premium aesthetics, proper error handling, loading states, and offline resilience.

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
Every student and every staff member plants exactly one tree. The app tracks that tree's lifecycle: from plantation to monitoring at 3/6/9/12-month intervals. Seven AI engines verify the photo, detect the species, check GPS coordinates, score carbon absorption, predict survival, and detect duplicate/fraudulent submissions.

---

## SECTION 2: TECHNOLOGY STACK

### 2.1 Mobile App Stack
| Layer | Technology | Details / Packages |
|---|---|---|
| Framework | **Flutter (Dart)** | Cross-platform iOS + Android from a single Dart codebase. |
| State Management | **Riverpod (`flutter_riverpod`)** | For decoupled, type-safe, reactive state tracking and dependency injection. |
| Routing | **GoRouter (`go_router`)** | Declarative routing system with support for deep links and nested shell routes. |
| Network Client | **Dio (`dio`)** | For robust HTTP requests, interceptors, and timeout handling for AI backends. |
| Database Client | **Supabase Flutter (`supabase_flutter`)** | Direct connection to the existing Supabase PostgreSQL instance for auth and PostgREST. |
| Authentication | **Supabase Auth** (Phone OTP/Password) | Logging in with a registered phone number. |
| Camera & Image Picker | **`image_picker`** | To capture plantation photos and select from the gallery. |
| GPS Location | **`geolocator`** | For high-accuracy GPS coordinates for tree geotagging. |
| Geocoding | **`geocoding`** | To convert coordinates into physical human-readable addresses. |
| Permissions | **`permission_handler`** | To manage runtime camera and location permission requests. |
| Maps | **`google_maps_flutter`** | To render interactive plantation map views and marker overlays. |
| Local Storage | **`flutter_secure_storage`** & **`shared_preferences`** | To persist JWT tokens, credentials, themes, and offline database cache. |
| PDF Generation | **`pdf`** & **`printing`** | To render plantation certificates and open native print/share sheets. |
| Push Notifications | **`firebase_core`** & **`firebase_auth`** | Custom push alerts for scheduled reminders and status updates. |
| Typography | **Google Fonts: Inter or Poppins** | Premium, clean layout typography. |
| Assets | **Branding Logo** | Render the asset `assets/images/company_logo.png` (or `company_logo.png` fetched from network) as the main branding logo for headers and landing page. |

### 2.2 Existing Backend Stack (DO NOT REBUILD)
- **Supabase** database and storage.
- **FastAPI AI Engine** on port 8001.

### 2.3 Environment Variables
```
SUPABASE_URL=https://vbyvllrfsqjbxurgcsos.supabase.co
SUPABASE_ANON_KEY=<anon-key>
AI_SERVICE_URL=http://<server-ip>:8001
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

### 3.2 Tables
Conforms to: `institutions`, `users` (references `auth.users`), `campaigns`, `tree_species`, `plantations`, `monitoring_records`, `monitoring_schedules`, `certificates`, `notifications`, `leaderboard_points` (+30 for verified plantation, +50 for verified monitoring), `badges`, `user_badges`, `qr_codes`, `csr_partners`, `csr_projects`, `audit_logs`.

---

## SECTION 4: AI ENGINE API SPECIFICATION (FASTAPI, PORT 8001)

The mobile app calls these endpoints on port 8001:
- `POST /api/v1/ai/tree-health` -> ResNet-18 model predicting stress.
- `POST /api/v1/ai/species-recognition` -> ResNet-18 model verifying species.
- `POST /api/v1/ai/predict/image` with `engine_id = "duplicate_detection"` -> Perceptual Hashing (pHash) fraud checker.
- `POST /api/v1/ai/predict/image` with `engine_id = "geotag_verification"` -> DBSCAN anomalies geofence verification.

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
- `student` / `staff` → Student Dashboard Screen
- `faculty` → Faculty Dashboard Screen
- `department_hod` → Department HOD Dashboard Screen
- `institution_admin` → Institution Dashboard Screen
- `super_admin` → Admin Dashboard Screen
- `csr_user` → CSR Sponsor Dashboard Screen

---

## SECTION 6: COMPLETE SCREEN-BY-SCREEN SPECIFICATION

### 6.1 SPLASH SCREEN
- Animated fade-in displaying the company logo. Checks active session and routes user by role.

### 6.2 LOGIN & REGISTRATION SCREENS
- Displays login and registration fields, showing the company logo at the top header card.

### 6.3 STUDENT DASHBOARD
- Stats widgets (Trees Planted, Verified Trees, Green Points, CO2 Offset), recent activity feed, quick actions panel, and bottom navigation.

### 6.4 FACULTY DASHBOARD
- Overview stats of assigned mentee students, verification counts, and access to verify student sapling and monitoring logs.

### 6.5 DEPARTMENT HOD DASHBOARD
- **Stats:** Scoped strictly to their department. Shows total department students, verified department trees, survival rate %, and department verifications queue.
- **Manage Faculty Coordinator:** Track and view departmental faculty coordinator trees and points.
- **Verify Faculty trees:** Review and verify trees planted directly by faculty in their department.

### 6.6 INSTITUTION DASHBOARD (Principal / Campus Admin)
- Comparative charts and total institution stats (Principal view). Manage all departments and HOD allocations.

### 6.7 GLOBAL GAMIFIED LEADERBOARD SCREEN
This screen is accessible to all logged-in profiles and contains a three-tab view:
1. **Personal Leaderboard (Free-for-All):** Ranks all students and faculty coordinators across the entire platform based on total Green Points. Shows name, points, department, and role badge (Faculty vs. Student).
2. **Department-Level Leaderboard:** Filtered rankings of individual students/faculty within a selected department. A dropdown toggles between departments.
3. **Department Teams Leaderboard:** Team-based rankings comparing department point aggregates.
- **Administration Actions:** If logged-in as `SUPER_ADMIN` or `INSTITUTION_ADMIN`, displays buttons to issue departmental bonuses (+50 points).
- **CSR view:** Read-only access to view all leaderboard tabs.

### 6.8 ADD TREE SCREEN (Multi-Step Wizard)
Wizard steps: Photo Capture (EXIF coords extraction) $\rightarrow$ Species Dropdown (with fallback) $\rightarrow$ FastAPI AI check $\rightarrow$ Google Map confirmation (draggable pin) $\rightarrow$ Save with pending verification status.

### 6.9 TREE DETAILS & MONITORING SUBMISSION SCREENS
- Zoomable photo, timeline for cycles 1-8. If due, HOD/Faculty can verify monitoring updates.

### 6.10 VERIFICATION SCREEN (Faculty & HOD Only)
- Tinder-style swipe cards containing student submissions matching HOD's department or Faculty's mentees.

---

## SECTION 7: UI/UX DESIGN SYSTEM

### 7.1 Color Palette
- Primary HSL(142, 64%, 32%) Deep Green.
- Accent/Lime HSL(82, 85%, 55%) CTA color.
- Custom Company Logo image asset.

---

## SECTION 8: FLUTTER FOLDER STRUCTURE (RIVERPOD)

Feature-first layer structure:
```
lib/
├── core/
│   ├── constants/        # company_logo path
│   ├── theme/
│   └── network/
├── models/
├── services/
├── repositories/
├── providers/
├── routes/               # Routes mapping DEPARTMENT_HOD -> hod_dashboard
├── screens/
│   ├── splash/
│   ├── auth/
│   ├── dashboard/
│   │   ├── student_dashboard.dart
│   │   ├── faculty_dashboard.dart
│   │   ├── hod_dashboard.dart
│   │   └── institution_dashboard.dart
│   ├── leaderboard/
│   │   └── leaderboard_screen.dart   # Shared leaderboard screen
│   ├── plantation/
│   ├── profile/
│   ├── verification/
│   └── shared/
└── main.dart
```

---

## SECTION 9: BUSINESS & OFFLINE LOGIC

- Verified plantations reward **+30 Points**. Verified monitoring rewards **+50 Points**.
- Draggable pins and EXIF parsing fallback. Offline queueing with automatic network sync.
- Validation bounding box constraint: Lat 15.6°–22.1°, Lon 72.6°–80.9° (Maharashtra).

Generate clean, compilation-ready Flutter code following this specification.
```
