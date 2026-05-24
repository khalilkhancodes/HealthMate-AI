# HealthMate AI

> AI-powered health companion for symptom insights, habit tracking, personalized wellness guidance, and secure patient-facing interactions.

![Status](https://img.shields.io/badge/status-production-success)
![Platform](https://img.shields.io/badge/platform-React%20Native%20%2B%20Expo-blue)
![Auth](https://img.shields.io/badge/auth-Clerk%20%2B%20Google%20OAuth-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Authentication System](#authentication-system)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Build & Deployment](#build--deployment)
- [API Reference](#api-reference)
- [Security & Compliance](#security--compliance)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Contact](#contact)

---

## Overview

**HealthMate AI** is a full-stack healthcare assistant application designed to help users:

- Track daily health metrics and wellness habits
- Get AI-assisted symptom triage guidance
- Receive personalized recommendations
- Manage appointments and reminders
- View health trends through intuitive dashboards

The system is built for scalability, privacy, and clinical safety boundaries.

---

## Core Features

### Authentication & Onboarding

- **Native Google OAuth** via Clerk (Android Credential Manager)
- **Guest Mode** for frictionless onboarding
- **Biometric Login** (Fingerprint/Face ID)
- **Secure Session Management** with automatic token refresh

### Health Tracking

- **Step Counter** (real-time pedometer via expo-sensors)
- **Daily Goals** (hydration, sleep, steps, workouts)
- **Streak System** with achievements and badges
- **Completion Calendar** (monthly view with progress history)

### AI-Powered Features

- **AI Chat Assistant** (NVIDIA Gemma 4 31B IT)
- **Health Insights** based on logged metrics
- **Symptom Guidance** with contextual recommendations
- **Natural Language Interface** for wellness Q&A

### User Experience

- **Animated Splash Screen** with radial breathing effect
- **Health Dashboard** with weekly progress
- **Achievement Badges** for milestone streaks
- **Premium Paywall** for advanced features
- **Dark/Light Mode** support

---

## Authentication System

### Google OAuth Native Implementation ✅ **COMPLETE**

HealthMate AI now uses **native Google OAuth** with the Android Credential Manager:

**Key Achievements:**

- ✅ Custom Google Cloud OAuth credentials configured
- ✅ Native Android authentication (in-app bottom sheet, no browser redirect)
- ✅ Biometric verification support (Fingerprint/Face ID)
- ✅ Clerk integration for session management
- ✅ Package signature validation (SHA-1 & SHA-256)
- ✅ End-to-end tested on physical Android device

**Architecture:**

```
Login → Android Credential Manager → Google OAuth Server
  ↓           ↓                           ↓
User     Biometric      Token Exchange    ↓
Account   Verification                    ↓
Selector  (optional)    ← Clerk Backend ←
  ↓
Session Creation
  ↓
Authenticated Navigation
```

**Environment Setup Required:**

```bash
# .env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[key]
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=[WEB_CLIENT_ID].apps.googleusercontent.com
```

**For Detailed Implementation Guide:**
→ See [GOOGLE_OAUTH_NATIVE_IMPLEMENTATION.md](./GOOGLE_OAUTH_NATIVE_IMPLEMENTATION.md)

---

## AI Features

- Conversational health assistant with structured prompts
- Personalization based on profile, preferences, and health history
- Safety filters for high-risk outputs
- Escalation prompts for urgent symptoms
- Context-aware responses with medical disclaimers

---

## Tech Stack

### Frontend (Mobile)

- **React Native** 0.81.5 + Expo SDK 54
- **React** 19.1.0
- **Zustand** 5.0.12 (state management)
- **React Navigation** 6.x (routing & navigation)
- **Reanimated** 4.1.1 (animations)
- **date-fns** 4.1.0 (date utilities)

### Authentication & Backend

- **Clerk** (v3.2.10 for Expo) - OAuth & session management
- **Google Cloud OAuth** - Native Google Sign-In
- **NVIDIA API** - LLM integration (Gemma 4 31B IT)

### Sensors & Device APIs

- **expo-sensors** (Pedometer)
- **expo-notifications**
- **expo-linking**
- **expo-splash-screen**

### UI & Design

- **React Native Paper** / **NativeBase** (UI components)
- **expo-linear-gradient** (gradients)
- **@expo/vector-icons** (Ionicons)
- **TailwindCSS** (responsive styling)

### Data & Storage

- **AsyncStorage** (local persistence)
- **SecureStore** (credential storage via Clerk)

### DevOps & Build

- **Expo CLI** (local development)
- **Android Gradle** (native builds)
- **EAS Build** (cloud builds)

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│          HealthMate AI Mobile (React Native)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SplashScreen (Animated)                               │
│       ↓                                                 │
│  LoginScreen (Clerk + Google OAuth + Guest Mode)      │
│       ↓                                                 │
│  AppNavigator (13+ screens)                           │
│  ├─ HomeScreen (Dashboard + Streaks)                 │
│  ├─ StreakDetailsScreen (Calendar + Achievements)   │
│  ├─ AIChatScreen (NVIDIA API integration)           │
│  ├─ StepScreen (Pedometer tracking)                 │
│  ├─ ProfileScreen (User management + Logout)       │
│  └─ [Other feature screens]                         │
│       ↓                                                 │
│  Zustand Store (useHealthStore)                      │
│  ├─ User state + isGuestMode                        │
│  ├─ Daily metrics + streaks                         │
│  ├─ Achievements + completion history              │
│  └─ AsyncStorage persistence                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
        ↓ HTTPS ↓              ↓ OAuth ↓
┌─────────────────────────────────────────────────────────┐
│              External Services                          │
│  ├─ Clerk (Session Management & OAuth)               │
│  ├─ Google OAuth Provider (Native Credential Mgr)   │
│  ├─ NVIDIA API (LLM: Gemma 4 31B IT)               │
│  ├─ Android Credential Manager (Biometric)         │
│  └─ Expo Notifications Service                      │
└─────────────────────────────────────────────────────────┘
```

### Native Integration

**Android Credential Manager Flow:**

```
User Tap → Credential Manager opens
  ↓
User selects Google account
  ↓
Biometric verification (if enabled)
  ↓
Token generated with Web Client ID
  ↓
Sent to Clerk backend
  ↓
Session created & returned
  ↓
setActive() → Navigation to HomeScreen
```

---

---

## Project Structure

```
HealthMate AI/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.js ..................... Animated intro (radial breathing)
│   │   ├── LoginScreen.js ..................... Clerk + Google OAuth + Guest Mode
│   │   ├── HomeScreen.js ..................... Dashboard + health metrics + streak badge
│   │   ├── StreakDetailsScreen.js ............ Monthly calendar + achievements
│   │   ├── AIChatScreen.js .................. NVIDIA LLM chat interface
│   │   ├── StepScreen.js ................... Pedometer tracking + daily steps
│   │   ├── ProfileScreen.js ................ User profile + logout + settings
│   │   └── [11+ other feature screens]
│   │
│   ├── store/
│   │   └── useHealthStore.js ................ Zustand state management
│   │       ├─ User authentication state
│   │       ├─ Daily goals & metrics
│   │       ├─ Streak & achievements
│   │       ├─ Completion history (YYYY-MM-DD)
│   │       └─ AsyncStorage persistence
│   │
│   ├── navigation/
│   │   ├── AuthNavigator.js ............... Stack (LoginScreen)
│   │   ├── AppNavigator.js ............... Stack (13+ screens)
│   │   └── RootNavigator.js ............. Navigation entry point
│   │
│   ├── theme/
│   │   └── theme.js ..................... Colors, fonts, dark/light mode
│   │
│   ├── utils/
│   │   ├── tokenCache.js ............... Clerk token management
│   │   ├── pedometer.js ............... Step tracking utilities
│   │   └── notifications.js .......... Push notification helpers
│   │
│   └── hooks/
│       └── useTheme.js ................ Theme context hook
│
├── App.js ............................ ClerkProvider wrapper + Navigation
├── app.json ......................... Expo config (Google OAuth plugin)
├── .env ............................ Environment variables (Clerk keys)
└── android/
    ├── app/
    │   └── build.gradle ............ Package name: com.anonymous.healthmateaitemp
    └── debug.keystore ............ SHA-1 & SHA-256 fingerprints
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Android SDK** 31+ (for native builds)
- **Java JDK** 11+ (for Android compilation)

### Step 1: Clone & Install

```bash
cd "d:\Websites\Toolify Lab\HealthMate AI"
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your-publishable-key]
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=[WEB-CLIENT-ID].apps.googleusercontent.com

# Other APIs
GEMINI_API_KEY=Bearer [your-nvidia-api-key]
CLERK_SECRET_KEY=sk_test_[your-secret-key]
```

### Step 3: Start Development

**Option A: Using Expo Go (Quick Testing)**

```bash
npx expo start
# Scan QR code with Expo Go app on your phone
```

**Option B: Native Android Build (Recommended)**

```bash
npx expo run:android
# Requires Android SDK + Java JDK configured
# Uses your local debug.keystore for signing
```

### Step 4: Test Google OAuth

1. Tap **"Continue with Google"** on LoginScreen
2. Android Credential Manager opens (in-app bottom sheet)
3. Select a Google account from your device
4. Optionally verify with biometric
5. Session created automatically
6. Navigate to HomeScreen

**Or test Guest Mode:**

1. Tap **"Continue as Guest"**
2. Skip authentication
3. Access core features without sign-in

---

## Environment Variables

| Variable                                 | Required    | Description                                    |
| ---------------------------------------- | ----------- | ---------------------------------------------- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`      | ✅ Yes      | Clerk frontend API key                         |
| `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID` | ✅ Yes      | Google OAuth Web Client ID (from Google Cloud) |
| `GEMINI_API_KEY`                         | ✅ Yes      | NVIDIA API key for LLM integration             |
| `CLERK_SECRET_KEY`                       | ⚠️ Optional | Clerk backend secret (for server-side calls)   |

**Obtaining Values:**

1. **Clerk Keys:**
   - Dashboard: [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - API Keys section

2. **Google OAuth Web Client ID:**
   - Google Cloud Console: [https://console.cloud.google.com](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - OAuth 2.0 Web Application

3. **NVIDIA API Key:**
   - [https://api.nvidia.com](https://api.nvidia.com)
   - Create account → Generate API key

---

## Build & Deployment

### Local Testing on Android Device

```bash
# USB debug your Android device
npx expo run:android
```

### Production Build (EAS)

```bash
# Requires EAS account
npx eas build --platform android

# Configure in eas.json:
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Manual Release Build

```bash
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

For more details, see [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)

---

## Testing Google OAuth Locally

### Test Users in Google Cloud Console

1. Go to Google Cloud Console → OAuth consent screen
2. Add test user emails
3. These accounts can authenticate while app is in "Testing" status

### Debug Logging

```javascript
// LoginScreen.js
const handleGoogleSignIn = async () => {
  console.log("➡️ Native Google sign-in initiated");
  // ... authentication code ...
  console.log("Session ID Returned:", createdSessionId);
};
```

Check logs:

```bash
npx expo start
# Or
adb logcat | grep "HealthMate\|Clerk\|Google"
```

---

## Security & Compliance

### Data Protection

- ✅ **TLS 1.3 HTTPS** for all API communication
- ✅ **OAuth 2.0** for authentication (never store passwords)
- ✅ **SecureStore** for sensitive token storage (via Clerk)
- ✅ **No hardcoded credentials** in code

### Environment Variables

```bash
# ✅ SAFE: Store in .env (local only, never commit)
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=...

# ✅ SAFE: Store in .env.example (replace values)
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=[YOUR_WEB_CLIENT_ID]

# ❌ UNSAFE: Hardcode in code
const CLIENT_ID = '880483315482-gtirrlq81ksscs7dfldbup100d38phsa.apps.googleusercontent.com';
```

### Clerk Security Features

- Automatic token refresh
- Session validation on every request
- CORS protection
- Rate limiting
- SOC 2 compliance

### Biometric Verification

Enabled automatically via Android Credential Manager:

- Fingerprint recognition
- Face recognition (Android 10+)
- Device PIN/pattern fallback

---

## Troubleshooting

### "Package Name Mismatch" Error

```
Error: com.anonymous.healthmateaitemp is not registered
```

**Solution:**

```bash
# Verify package name
grep "^package=" android/app/build.gradle

# Rebuild
npx expo run:android --clear
```

### "SHA-1 Fingerprint Mismatch"

```
Error: The package does not correspond to any configured SHA1s
```

**Solution:**

```bash
cd android
./gradlew signingReport
# Copy SHA-1 (remove colons) and update Google Cloud Console
```

### "Invalid Web Client ID"

```
Error: INVALID_CLIENT in Credential Manager
```

**Solution:**

1. Verify `.env` has `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID` set
2. Ensure it's the **Web** client, not Android client
3. Format: `[ID].apps.googleusercontent.com`
4. Restart Expo: `npx expo start --clear`

### "No Session Created"

```
createdSessionId is null
```

**Debug Steps:**

```javascript
const { createdSessionId, setActive } = await startGoogleAuthenticationFlow();
console.log("Session:", createdSessionId);
console.log("setActive:", typeof setActive);
```

For more troubleshooting, see [GOOGLE_OAUTH_NATIVE_IMPLEMENTATION.md](./GOOGLE_OAUTH_NATIVE_IMPLEMENTATION.md#troubleshooting)

---

## API Reference

### Zustand Store (useHealthStore)

```javascript
import { useHealthStore } from "./src/store/useHealthStore";

// Authentication
const isGuestMode = useHealthStore((state) => state.isGuestMode);
const setIsGuestMode = useHealthStore((state) => state.setIsGuestMode);

// Daily Goals
const dailyGoals = useHealthStore((state) => state.dailyGoals);
const processDailyGoalCompletion = useHealthStore(
  (state) => state.processDailyGoalCompletion,
);

// Streaks & Achievements
const currentStreak = useHealthStore((state) => state.currentStreak);
const achievements = useHealthStore((state) => state.achievements);
const completionHistory = useHealthStore((state) => state.completionHistory);

// Pedometer
const dailySteps = useHealthStore((state) => state.dailySteps);
const setDailySteps = useHealthStore((state) => state.setDailySteps);
```

### Clerk Authentication

```javascript
import { useAuth, useUser, useSignInWithGoogle } from "@clerk/expo";

// Check auth status
const { isSignedIn, sessionId } = useAuth();

// Get user data
const { user, isLoaded } = useUser();

// Trigger Google OAuth
const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
const { createdSessionId, setActive } = await startGoogleAuthenticationFlow();

// Sign out
const { signOut } = useAuth();
await signOut();
```

---

## Roadmap

### Completed ✅

- [x] Google OAuth native authentication
- [x] Guest mode onboarding
- [x] Streak tracking with calendar
- [x] Achievement system
- [x] Animated splash screen
- [x] Health metrics dashboard
- [x] Pedometer integration

### In Progress 🚧

- [ ] AI chat history persistence
- [ ] Premium subscription system
- [ ] Health report generation
- [ ] Medication reminders
- [ ] Social sharing features

### Planned 📋

- [ ] Apple OAuth
- [ ] Web dashboard
- [ ] Backend API
- [ ] Health provider integration (FHIR)
- [ ] Wearable device sync (Fitbit, Apple Watch)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Disclaimer

⚠️ **Medical Disclaimer**

HealthMate AI is an informational application and **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional before making medical decisions.

- Do not use HealthMate AI for emergencies
- Call emergency services (911 in US) for urgent health issues
- This app provides general health guidance only
- All health data should be verified with medical professionals

---

## Support

### Documentation

- [Google OAuth Implementation Guide](./GOOGLE_OAUTH_NATIVE_IMPLEMENTATION.md)
- [Android Build Guide](./ANDROID_BUILD_GUIDE.md)
- [Clerk Migration Guide](./CLERK_MIGRATION.md)
- [Project Summary](./PROJECT_SUMMARY.md)

### Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Google Cloud Console](https://console.cloud.google.com)

### Contact

For questions or support:

- 📧 Email: support@healthmateai.dev
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/healthmate-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/healthmate-ai/discussions)

---

**Last Updated:** May 17, 2026  
**Version:** 1.0.0 (Production Release)  
**Status:** ✅ Production-Ready
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), Pydantic, Uvicorn |
| AI/LLM | OpenAI API / Azure OpenAI, LangChain (optional) |
| Database | PostgreSQL |
| Cache/Queue | Redis, Celery |
| Auth | JWT + Refresh Tokens, OAuth (optional) |
| File Storage | AWS S3 / Azure Blob |
| Notifications | Firebase Cloud Messaging / Twilio / SendGrid |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Observability | Prometheus, Grafana, Sentry |
| Testing | Pytest, Jest, React Testing Library, Playwright |

---

## Architecture

```text
Client (Next.js)
      ↓ HTTPS
API Gateway / Backend (FastAPI)
      ├── Auth Service (JWT/OAuth)
      ├── Health Data Service
      ├── AI Orchestration Service (LLM + prompts + guardrails)
      ├── Notification Service
      └── Report Service
             ↓
PostgreSQL + Redis + Object Storage
```

---

## Project Structure

```bash
healthmate-ai/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── packages/
│   ├── ui/                  # shared UI components
│   ├── config/              # shared configs (eslint, tsconfig)
│   └── types/               # shared types/interfaces
├── infra/
│   ├── docker/              # Dockerfiles and compose
│   ├── k8s/                 # Kubernetes manifests (optional)
│   └── terraform/           # IaC (optional)
├── docs/
│   ├── api/                 # OpenAPI docs snapshots
│   └── architecture/        # diagrams and specs
├── .github/workflows/       # CI/CD pipelines
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (recommended)

### 1) Clone

```bash
git clone https://github.com/your-org/healthmate-ai.git
cd healthmate-ai
```

### 2) Configure environment

```bash
cp .env.example .env
```

Update required values in `.env`.

### 3) Run with Docker (recommended)

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### 4) Run locally (without Docker)

```bash
# Frontend
cd apps/web
npm install
npm run dev

# Backend (new terminal)
cd apps/api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Local Environment Configuration (NVIDIA & Auth keys)

Sensitive keys such as the NVIDIA API key and any auth client IDs have been moved out of source files and should be provided via environment variables.

- Copy `.env.example` to `.env` at the project root and fill in the real values.
- The mobile app reads NVIDIA values from `src/config/env.js` which sources `process.env`.
- Do NOT commit your `.env` to version control. The project `.gitignore` already ignores `.env` files.

Example variables (see `.env.example`):

```
NVIDIA_INVOKE_URL=...
NVIDIA_API_KEY=...
NVIDIA_MODEL=...
```

After updating `.env`, restart the Metro bundler or native build so the environment values are picked up.

---

## Environment Variables

```env
# App
NODE_ENV=development
APP_NAME=HealthMate AI
APP_URL=http://localhost:3000
API_URL=http://localhost:8000

# Auth
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthmate

# Cache
REDIS_URL=redis://localhost:6379

# AI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Notifications
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Storage
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Observability
SENTRY_DSN=
```

---

## Available Scripts

### Frontend (`apps/web`)

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # start production server
npm run lint       # lint code
npm run test       # unit tests
```

### Backend (`apps/api`)

```bash
pytest             # run tests
alembic upgrade head  # apply migrations
uvicorn app.main:app --reload
celery -A app.worker worker --loglevel=info
```

---

## API Reference

Base URL: `/api/v1`

| Method | Endpoint          | Description             |
| ------ | ----------------- | ----------------------- |
| POST   | `/auth/register`  | Register user           |
| POST   | `/auth/login`     | Login and obtain JWT    |
| GET    | `/users/me`       | Get profile             |
| POST   | `/health/vitals`  | Save vitals             |
| GET    | `/health/vitals`  | Retrieve vitals history |
| POST   | `/symptoms/check` | AI symptom analysis     |
| POST   | `/chat/message`   | AI assistant message    |
| POST   | `/medications`    | Add medication          |
| GET    | `/reports/weekly` | Generate weekly report  |

OpenAPI docs available at `/docs`.

---

## Security & Compliance

- TLS in transit and encrypted storage at rest
- Password hashing with Argon2/Bcrypt
- JWT rotation + refresh token revocation
- Rate limiting and abuse protection
- Input validation and prompt-injection defenses
- Audit logs for sensitive actions
- HIPAA/GDPR alignment patterns (implementation depends on deployment and legal review)

---

## Testing

- **Unit tests:** business logic and utility methods
- **Integration tests:** API + DB + cache flow
- **E2E tests:** onboarding, chat, vitals, reminders
- **Performance tests:** API latency and concurrency

Run all tests in CI on every pull request.

---

## Deployment

### Recommended

- Frontend: Vercel / Azure Static Web Apps
- Backend: Azure App Service / AWS ECS / Render
- Database: Managed PostgreSQL
- Redis: Managed Redis
- Storage: S3/Blob

### CI/CD

- Lint + test on PR
- Build and publish Docker images on merge
- Deploy to staging then production with approvals

---

## Monitoring & Logging

- **Metrics:** Prometheus + Grafana
- **Errors:** Sentry
- **Logs:** Structured JSON logs shipped to ELK/Datadog
- **Alerts:** PagerDuty/Slack for critical incidents

---

## Roadmap

- [ ] Wearable integration (Apple Health, Google Fit, Fitbit)
- [ ] Multi-language support
- [ ] Voice assistant mode
- [ ] Clinician dashboard
- [ ] Fine-tuned clinical guidance models

---

## Contributing

1. Fork repository
2. Create branch: `feature/your-feature-name`
3. Commit changes using conventional commits
4. Open pull request with clear description and tests

---

## License

This project is licensed under the **MIT License**.  
See `LICENSE` for details.

---

## Support

For issues and feature requests, use GitHub Issues.  
For security concerns, contact: `security@yourdomain.com`
