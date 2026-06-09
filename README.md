# 🌿 Aura — India's Localized Carbon Footprint Platform

Aura is a full-stack, AI-powered carbon footprint tracker and ecosystem feed built specifically for India. Designed with rich, cinematic dark-mode aesthetics, Aura empowers Indian households to measure, analyze, and offset their daily emissions—from auto-rickshaws and local trains to regional delicacies like Chicken Biryani versus Dal Rice.

---

## 🎯 Challenge Submission & Alignment

### 1. Chosen Vertical
* **Vertical**: **Challenge 3 — Carbon Footprint Awareness Platform**.
* **Objective**: Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

### 2. Approach and Logic
* **Natural Language Parsing**: Users describe their day naturally. The platform extracts activities and computes carbon metrics.
* **Cascading LLM Fallback Loop**: To guarantee maximum uptime and survive free-tier rate limits, Aura utilizes a 6-stage model cascade (`gemini-3.5-flash` ➡️ `gemini-2.5-flash` ➡️ `gemini-3.1-flash-lite` ➡️ `gemini-2.5-pro` ➡️ `gemini-2.0-flash` ➡️ `gemini-1.5-flash`).
* **Offline Heuristics**: If the SDK loses internet connection or all Gemini API endpoints fail, a local regex-based heuristic parser extracts transport distances, food items, and energy usage.
* **Efficiency Cache Layer**: Implemented a server-side cache map with a 30-minute Time-to-Live (TTL) and eviction limits. Repeated requests are fetched instantly from local memory.
* **Optimized Calculations**: Data arrays are processed using React `useMemo` hooks to compute rolling weekly metrics, preventing main-thread rendering lag.

### 3. How the Solution Works
1. **Onboarding**: Users sign up securely via Firebase Auth (supporting Email/Password, Google OAuth, and GitHub OAuth).
2. **Dashboard Logs**: Users log their actions. The AI parses the input, visualizes the emissions breakdown, and suggests personalized localization tips (e.g. setting AC to 24°C).
3. **Weekly Analytics**: A weekly Recharts area chart visualizes cumulative carbon performance compared to daily targets.
4. **Community Feed**: Users share their carbon-saving actions. Aura's Net Savings Estimator compares the action against a high-carbon alternative (e.g., Chennai Metro vs. Uber Cab) to dynamically calculate the net kg of CO2 saved and details the audit explanation to the community.

### 4. Assumptions Made
* **India GHG Metrics**: Sourced and calibrated emission factor constants directly from the **India GHG Program** (e.g., Auto-rickshaw is 0.08 kg/km, Metro is 0.04 kg/km, Veg Meal is 0.8 kg, Chicken Biryani is 3.2 kg).
* **Per-Capita Safety Limits**: Assumed India's average daily target threshold is **5.2 kg CO2 per person** based on annual averages.
* **Default Baselines**: Assumed a general baseline overhead of 1.2 kg CO2 if zero activities are identified during a tracking day.

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
│       ├── analytics-charts.tsx    # Recharts graph memoized with useMemo hooks
│       ├── animated-counter.tsx    # GSAP numerical display counter
│       ├── floating-particles.tsx  # Canvas-based drifting molecular particles
│       ├── glass-card.tsx          # Awwwards-style glassmorphism cards
│       ├── sparkles.tsx            # Procedural particle sparkle overlays
│       └── tracing-beam.tsx        # Scroll-tracing SVG drawing vertical beam
├── lib/                            # Platform core utilities & integrations
│   ├── __tests__/                  # Vitest testing directory
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
└── vitest.config.ts                # Vitest configuration (jsdom environment)
```

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
