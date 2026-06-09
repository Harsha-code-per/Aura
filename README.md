# 🌿 Aura — India's Localized Carbon Footprint Platform

Aura is a full-stack, AI-powered carbon footprint tracker and ecosystem feed built specifically for India. Designed with rich, cinematic dark-mode aesthetics, Aura empowers Indian households to measure, analyze, and offset their daily emissions—from auto-rickshaws and local trains to regional delicacies like Chicken Biryani versus Dal Rice.

---

## 📂 Project Structure

```
aura/
├── app/                            # Next.js App Router Pages & Layouts
│   ├── auth/                       # Authentication gateway (Email, Google, GitHub OAuth)
│   ├── community/                  # Real-time ecosystem savings post feed & estimator
│   ├── dashboard/                  # Main analytics console & input tracker logger
│   ├── globals.css                 # Custom HSL/OKLCH variables & tailwind directives
│   ├── layout.tsx                  # App layout wrapping Auth, Themes & Navbar/Footer
│   └── page.tsx                    # Landing Page with GSAP/Awwwards scroll animations
├── components/                     # Reusable React components
│   ├── layout/                     # Global layout structures (Navbar, Footer, Auth Provider)
│   └── ui/                         # Custom design system components
│       ├── analytics-charts.tsx    # [NEW] Recharts graph memoized with useMemo hooks
│       ├── animated-counter.tsx    # GSAP numerical display counter
│       ├── floating-particles.tsx  # Canvas-based drifting molecular particles
│       ├── glass-card.tsx          # Awwwards-style glassmorphism cards
│       ├── sparkles.tsx            # Procedural particle sparkle overlays
│       └── tracing-beam.tsx        # Scroll-tracing SVG drawing vertical beam
├── lib/                            # Platform core utilities & integrations
│   ├── __tests__/                  # [NEW] Vitest testing directory
│   │   └── carbon-engine.test.ts   # Unit tests covering fallbacks, diets & caching
│   ├── actions/                    # Next.js Server Actions
│   │   └── gemini-parser.ts        # AI Cascading Parser with in-memory caching
│   ├── data/                       # Carbon multipliers data layer
│   │   └── emission-factors.ts     # Localized transport, food & AC emission constants
│   ├── firebase/                   # Cloud database integration
│   │   ├── config.ts               # Modular Firebase config init
│   │   ├── auth.ts                 # Email, Google, GitHub OAuth auth helpers
│   │   └── firestore.ts            # CRUD operations with auto-sanitization for undefined fields
│   └── utils.ts                    # Classnames utility helpers
├── LICENSE                         # MIT License (Harshavardhan K copyright)
├── package.json                    # Configuration, scripts, and dependencies
├── tsconfig.json                   # Path mappings & TS specifications
└── vitest.config.ts                # [NEW] Vitest configuration (jsdom environment)
```

---

## ✨ Features

### 🤖 1. AI-Powered Activity Parser
* **Intuitive Inputs**: Type what you did (e.g., *"Drove my bike for 8km, ran the 1.5 ton AC for 2 hours, and had vegetarian thali for dinner"*).
* **Cascading LLM Core**: To bypass API rate limits on the free tier, Aura queries a 6-stage model cascade (Gemini 3.5 Flash ➡️ Gemini 2.5 Flash ➡️ Gemini 3.1 Flash-Lite ➡️ Gemini 2.5 Pro ➡️ Gemini 2.0 Flash ➡️ Gemini 1.5 Flash).
* **Offline Heuristic Fallback**: A local parser extracts distances and meals to execute local calculations if all API models fail.

### 💾 2. In-Memory Server-Side Caching
* **Response Caching**: Incorporates a fast caching system equipped with a 30-minute Time-to-Live (TTL) and eviction limits.
* **Instant Resolving**: Duplicate activity entries or carbon savings lookups resolve instantly from cache, bypassing network roundtrips to the Google Generative AI SDK.

### 🚇 3. Community Net Savings Estimator
* **Milestone Sharing**: An ecosystem feed where users can share their daily environmental victories.
* **AI Carbon Audit**: Automatically calculates net CO2 savings comparing green choices against high-carbon alternatives (e.g., Metro instead of an Ola cab).
* **Modification Warnings**: Real-time warnings prompt users to recalculate metrics if they edit custom action text after running an audit.
* **Auto-Sanitization**: Form data is recursively sanitized to remove `undefined`/`null` fields, preventing Firebase SDK write failures.

### 📊 4. Weekly Analytics Dashboard
* **Memoized Computations**: Applied React `useMemo` hooks to rolling 7-day cumulative totals, daily average scores, and safety target deviations, ensuring rendering performance does not block the UI main thread.
* **Dynamic Scorecards**: Responsive Area Charts visualize your carbon score over the last 7 days compared to India's daily safety target threshold (~5.2 kg CO2 per person).

### 🧪 5. Automated Vitest Suite
* **Testing Setup**: Vitest framework configured with the `jsdom` test environment and TypeScript module alias resolution.
* **Comprehensive Coverage**: Unit tests assert calculations for transport modes, regional diets, offline fallback logic, and cache layer optimizations.

---

## 🏗/🇮🇳 Indian Emission Factors Context

Aura is calibrated using standards aligned with the **India GHG Program** and localized average benchmarks:

* **Auto-rickshaw**: `0.08 kg CO2/km`
* **Metro Rail**: `0.04 kg CO2/km`
* **Two-wheeler (Bike)**: `0.05 kg CO2/km`
* **Car (Petrol)**: `0.15 kg CO2/km`
* **Chicken Biryani**: `3.2 kg CO2e/serving`
* **Dal Rice**: `0.5 kg CO2e/serving`
* **Grid Electricity**: `0.82 kg CO2/kWh`
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
NEXT_PUBLIC_FIREBASE_App_Id=your_app_id

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

### 4. Running Tests
To run the automated Vitest test runner:
```bash
npm run test
```

### 5. Firestore Composite Indexes
To ensure Dashboard analytics load correctly, create the following composite indexes in your Firebase console:
1. Collection `carbonEntries`: `userId` (Ascending), `createdAt` (Descending)
2. Collection `carbonEntries`: `userId` (Ascending), `date` (Ascending)

---

## 🚀 Production Build & Deployment

Aura is completely optimized for production build pipelines.

```bash
# Verify build passes
npm run build
```

### Vercel Deployment
1. Link your repository in Vercel.
2. Inject the contents of `.env.local` into the **Environment Variables** panel in Vercel settings.
3. Click **Deploy**. Vercel automatically builds, tests, and serves Aura globally.
