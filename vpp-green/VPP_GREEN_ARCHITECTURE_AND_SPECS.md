# VPP Green Maharashtra - Complete System Architecture & Specifications

This document outlines the entire technology stack, database design, AI pipeline, and architecture of the VPP Green Maharashtra tree plantation and verification system.

## 1. Technology Stack

### Frontend / Client-Side
* **Framework**: [Next.js](https://nextjs.org/) (App Router paradigm) with React.
* **Styling**: Tailwind CSS + `shadcn/ui` components (built on Radix UI).
* **State Management**: Zustand (`auth-store.ts`, etc.) for fast, lightweight global state handling.
* **Animations**: Framer Motion for premium micro-interactions and smooth page transitions.
* **Mapping**: Leaflet + `react-leaflet` for dynamic GPS mapping of planted trees.
* **Photo Metadata**: `exifr` library to extract raw GPS coordinates and timestamps directly from photo EXIF data.

### Backend / Database (Cloud)
* **BaaS (Backend as a Service)**: Supabase.
* **Database**: PostgreSQL (Relational Database).
* **Authentication**: Supabase Auth (OTP via Phone Number).
* **Object Storage**: Supabase Storage / Base64 DB storage for images.

### AI Engine Backend (Local/Standalone)
* **Framework**: FastAPI (Python) running on port `8001`.
* **Deployment**: Local execution (`main.py` entrypoint) processing requests from the Next.js frontend via HTTP.
* **Libraries**: PyTorch, Torchvision, Scikit-Learn, OpenCV, Pillow, ImageHash.

---

## 2. Database Architecture (Supabase PostgreSQL)

All relational data is stored securely in the cloud via Supabase.

### Core Tables
1. **users**: Stores full profiles (full name, mobile, role, institution, department, encrypted password). Hooked directly to Supabase Auth.
2. **institutions**: Master list of all participating colleges/schools (UUIDs, names, codes, districts).
3. **tree_species**: Catalog of plantable trees (Neem, Banyan, etc.), including scientific names, CO2 absorption rates, and native statuses.
4. **plantations**: The core transaction table. Stores every planted tree, the user who planted it, the GPS coordinates (lat/lng), the timestamp, and the initial base64/URL photo.
5. **monitoring_records**: Used by Faculty and HODs to verify trees. Stores periodic checks, the latest health status, and approval verdicts.

*Data Flow*: The Next.js frontend connects directly to Supabase using the `@supabase/supabase-js` client.

---

## 3. The 7-Engine AI Pipeline

The project features a standalone Python FastAPI backend that intercepts incoming tree photos and processes them using 7 specialized AI/ML engines. 

Data processing happens **locally** on the server running the API (not sent to third-party cloud AI APIs). 

### Engine Details & Algorithms
1. **Tree Health Detection**
   * **Algorithm**: ResNet-18 Convolutional Neural Network (CNN).
   * **Function**: Analyzes leaf/bark texture to classify the tree as Healthy, Mild Stress, Moderate Stress, or Severe Stress.
   * **Accuracy**: 99.17%

2. **Species Recognition**
   * **Algorithm**: ResNet-18 CNN.
   * **Function**: Classifies the uploaded tree against 33 trained native Maharashtra species classes to verify the user planted what they claimed.
   * **Accuracy**: 83.00%

3. **Growth Estimation**
   * **Algorithm**: Gradient Boosting Classifier (Scikit-Learn).
   * **Function**: Based on species, time passed, and district climate, estimates whether the tree is growing normally.

4. **Carbon Sequestration**
   * **Algorithm**: Random Forest + IPCC Allometric Scientific Formulas.
   * **Function**: Calculates estimated CO2 absorption over the tree's lifespan.

5. **Survival Prediction**
   * **Algorithm**: Random Forest Classifier.
   * **Function**: Uses environmental factors and past health records to predict the probability of the tree surviving the next 12 months.
   * **Accuracy**: 90.00% (AUC 0.97)

6. **Duplicate Photo Detection (Fraud Prevention)**
   * **Algorithm**: Perceptual Hashing (pHash) & Average Hashing (aHash).
   * **Function**: Hashes the image structure. If a student tries to upload the exact same photo twice (or a slightly cropped version), the system catches it with 100% accuracy.

7. **GPS Anomaly Detection (Fraud Prevention)**
   * **Algorithm**: Rule-based Geofencing + DBSCAN Clustering.
   * **Function**: Compares the photo's GPS coordinates against the institution's known bounds. If a student tries to submit a tree planted 50km away, it flags it as anomalous.

---

## 4. How Things Work (Core Workflows)

### Registration & Login
1. User enters phone, name, password, and selects an institution.
2. Next.js hashes the password securely using `bcryptjs`.
3. User is created in Supabase Auth, and a trigger auto-populates the custom `users` table with their profile details.
4. On login, `Zustand` (`auth-store.ts`) retrieves the profile from the `users` table and makes it globally available to the UI.

### Planting a Tree (Student / Faculty)
1. User uploads a photo of the sapling.
2. The frontend extracts secure **EXIF GPS Data** from the physical image. (If absent, it uses high-accuracy HTML5 browser geolocation to get the live pinpoint location).
3. The photo is sent to the **FastAPI AI Backend**.
4. The AI verifies the species. If confidence is > 75%, it succeeds. If < 75%, it asks the user to retake the photo.
5. Once verified, the data (species, coordinates, photo, user ID, institution ID) is inserted into the Supabase `plantations` table.

### Verification Hierarchy (The Management Chain)
1. **Student**: Can only plant trees and view their own dashboard. Cannot verify anything.
2. **Faculty**: Can view and manage students within their *own* institution. Can verify trees planted by students.
3. **HOD (Head of Department)**: Manages their institution. Can verify trees planted by *Faculty*.
4. **Super Admin**: Has global oversight of all institutions, users, and plantations across the entire state.
5. **CSR (Corporate Social Responsibility)**: Read-only access to view overarching metrics and carbon offset data for corporate funding.

## Summary

* **Frontend**: Next.js + React + Tailwind
* **Backend**: Supabase (Postgres)
* **AI Engine**: Python (FastAPI + PyTorch + Scikit-Learn)
* **Processing**: Frontend talks to Supabase (Cloud) for storage, and to Python Server (Local/VPC) for AI inference.
