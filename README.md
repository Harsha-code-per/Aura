# 🌿 Aura — India's Localized Carbon Footprint Platform

Aura is a full-stack, AI-powered carbon footprint tracker and ecosystem feed built specifically for India. Designed with rich, cinematic dark-mode aesthetics, Aura empowers Indian households to measure, analyze, and offset their daily emissions—from auto-rickshaws and local trains to regional delicacies like Chicken Biryani versus Dal Rice.

---

## ✨ Features

### 🤖 1. AI-Powered Natural Language Parser
* **Intuitive Inputs**: Simply type what you did (e.g., *"Drove my bike for 8km, ran the 1.5 ton AC for 2 hours, and had vegetarian thali for dinner"*).
* **Cascading LLM Model Loop**: To ensure high availability and bypass API rate limits on the free tier, Aura queries a 6-stage model cascade:
  1. `gemini-3.5-flash`
  2. `gemini-2.5-flash`
  3. `gemini-3.1-flash-lite`
  4. `gemini-2.5-pro`
  5. `gemini-2.0-flash`
  6. `gemini-1.5-flash`
* **Offline Heuristic Fallback**: Includes a robust regex-based local fallback parser that extracts distances and meals to execute local calculations if all API models fail.

### 🚇 2. Community Net Savings Estimator
* **Milestone Sharing**: An ecosystem feed where users can share their daily environmental victories.
* **AI Carbon Audit**: Replaces manual inputs with a smart parser (`parseCommunitySaving`) that calculates net CO2 savings comparing eco-actions against high-carbon alternatives (e.g., taking Chennai Metro instead of an Ola cab).
* **Interactive Chips**: Pre-populates actions with interactive suggestion chips like:
  * *Metro instead of Cab*
  * *Dal Rice instead of Biryani*
  * *AC off for 3 hours*
* **Modification Warnings**: Real-time warnings prompt users to recalculate metrics if they edit custom action text after running an audit.

### 📊 3. Weekly Analytics Dashboard
* **Dynamic Scorecards**: Interactive Recharts visualize your carbon score over the last 7 days.
* **Targets & Dials**: Compares your daily totals against standard thresholds (Indian daily per-capita target is ~5.2 kg CO2).
* **Historical Logs**: Live list of historical inputs and component breakdowns.

### 🔒 4. Production Security & Sanitization
* **Authentication**: Multi-method login (Email/Password, Google OAuth, GitHub OAuth) powered by Firebase Auth.
* **Firestore Database**: Highly indexed, real-time Cloud Firestore listener feeds.
* **Recursive Data Sanitization**: Form data is sanitized to recursively remove `undefined`/`null` fields, preventing Firebase SDK write failures.

### 🎨 5. Premium Awwwards-Level Interface
* **Glassmorphism**: Elegant glass cards with emerald box-shadow glows.
* **Procedural Sparkles & Particles**: Canvas-based background animations representing drifting CO2 particles.
* **SVG Tracing Beam**: Responsive scrolling indicator.

---

## 🏗️ Tech Stack

* **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
* **Styling**: Tailwind CSS v4, HSL/OKLCH CSS Custom Properties
* **Animations**: GSAP (`@gsap/react`), Framer Motion
* **Database & Auth**: Firebase SDK (V9+ modular APIs)
* **AI Engine**: Google Generative AI (Gemini SDK)
* **Graphs**: Recharts

---

## 🇮🇳 Indian Emission Factors Context

Aura is calibrated using standards aligned with the **India GHG Program** and localized average benchmarks:

### Transport Factors (kg CO2/km)
* **Auto-rickshaw**: `0.08`
* **Metro Rail**: `0.04`
* **City Bus**: `0.03`
* **Local/Suburban Train**: `0.014`
* **Two-wheeler (Bike)**: `0.05`
* **Car (Petrol)**: `0.15`
* **Car (Diesel)**: `0.17`
* **Ola/Uber Cab**: `0.15`

### Food Factors (kg CO2e/serving)
* **Chicken Biryani**: `3.2`
* **Mutton Biryani**: `5.5`
* **Veg Biryani / Veg Thali**: `0.8` - `0.9`
* **Dal Rice / Roti Sabzi**: `0.5` - `0.6`
* **Chai / Coffee**: `0.1` - `0.15`

### Energy Factors
* **Grid Electricity (India Avg)**: `0.82 kg CO2/kWh`
* **AC (1.5 Ton)**: `1.5 kg CO2/hour`

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have Node.js 18+ and an active Firebase Project + Gemini API key.

### 2. Environment Variables Configuration
Create a `.env.local` file in the root directory:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Configuration (Server-side)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Start local server with Turbopack compilation
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Firestore Composite Indexes
To ensure Dashboard analytics load correctly, create the following composite indexes in your Firebase console:
1. Collection `carbonEntries`: `userId` (Ascending), `createdAt` (Descending)
2. Collection `carbonEntries`: `userId` (Ascending), `date` (Ascending)

---

## 🚀 Production Build & Deployment

Aura is completely optimized for production build pipelines.

### Build Verification
```bash
npm run build
```

### Vercel Deployment
1. Link your repository in Vercel.
2. Inject the contents of `.env.local` into the **Environment Variables** panel in Vercel settings.
3. Click **Deploy**. Vercel automatically builds, optimizes, and serves Aura globally.
