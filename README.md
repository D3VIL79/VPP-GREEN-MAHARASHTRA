# 🌿 VPP Green Maharashtra

**Virtual Plantation Platform** — A full-stack platform for managing institutional tree plantation drives across Maharashtra. Built with AI-powered species recognition, health monitoring, and carbon tracking.

---

## 🏗️ Architecture

```
VPP_GREEN/
├── vpp-green/               # Next.js 15 Frontend (React + TypeScript)
│   ├── src/app/             # App router pages (student, faculty, admin, HOD, CSR, institution)
│   ├── src/components/      # Reusable ShadCN UI components
│   ├── src/lib/             # API client, auth store, Supabase client
│   └── ai-backend/          # FastAPI AI service (species recognition, health analysis)
├── ai-service/              # Standalone AI service (inference engines)
├── models/                  # Trained ML models (.pth, .pkl)
├── data/                    # Training datasets (species images, health data, tabular)
├── supabase/                # Supabase Edge Functions
├── supabase_seeder/         # SQL seed files (schema, users, events, gamification)
├── platform/backend/        # Express.js backend (optional)
└── results/                 # Training reports & visualizations
```

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion |
| **Backend** | Supabase (PostgreSQL + Auth + RLS), FastAPI (AI Service) |
| **AI/ML** | PyTorch (CNN), Scikit-learn (Random Forest, Gradient Boosting) |
| **Auth** | Supabase Auth (Email/Password, Password Reset) |
| **Deployment** | Vercel (Frontend), Any Python host (AI Backend) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase Account

### 1. Frontend Setup
```bash
cd vpp-green
npm install
# Create .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
npm run dev
```

### 2. AI Backend Setup
```bash
cd vpp-green/ai-backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### 3. Database Setup
Run the SQL files in `supabase_seeder/` in order (00 → 06) in the Supabase SQL Editor.

## 👥 User Roles

| Role | Dashboard | Capabilities |
|------|-----------|-------------|
| **Student** | `/student/dashboard` | Plant trees, monitor growth, earn badges, leaderboard |
| **Faculty** | `/faculty/dashboard` | Oversee department plantations, verify trees |
| **HOD** | `/hod/dashboard` | Department-level analytics and reports |
| **Institution Admin** | `/institution/dashboard` | Institution-wide management, faculty/student oversight |
| **Super Admin** | `/admin/dashboard` | Full platform management, all institutions |
| **CSR Partner** | `/csr/dashboard` | Sponsorship tracking, impact reports |

## 🤖 AI Features

- **Species Recognition** — CNN-based tree species identification from images (33 species)
- **Health Analysis** — Leaf/bark health classification (Healthy, Moderate, Unhealthy)
- **Carbon Estimation** — Random Forest model for carbon sequestration estimates
- **Growth Prediction** — Gradient Boosting model for tree growth forecasting
- **Survival Analysis** — Random Forest classifier for tree survival probability

## 📊 Training Data

Training datasets are in `/data/`:
- `species_prepared/` — 2,467 species images across 33 classes
- `health_generated/` — 600 health classification images
- `tabular/` — Structured growth, carbon, and survival data
- `geo/` — Geospatial data

## 🔒 Security

- Row Level Security (RLS) on all Supabase tables
- Role-based access control (RBAC)
- Supabase Auth with email/password
- Password reset via email

## 📄 License

This project is part of the VPP Green Maharashtra initiative.
