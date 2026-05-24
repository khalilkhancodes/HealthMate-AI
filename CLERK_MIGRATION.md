# Clerk Authentication Migration Guide

**Date:** May 15, 2026  
**Project:** HealthMate AI  
**Migration:** Custom Zustand Auth → @clerk/clerk-expo with Google OAuth

---

## Overview

This guide documents the complete migration from a custom Zustand-based authentication system to **Clerk**, a modern authentication platform with built-in support for OAuth providers like Google, GitHub, and more.

### Why Clerk?

- **OAuth 2.0 Support**: Google, GitHub, Apple, and more out-of-the-box
- **Session Management**: Automatic token refresh and secure storage
- **User Profiles**: Built-in user data and metadata management
- **MFA**: Multi-factor authentication ready
- **Zero Configuration**: Works seamlessly with Expo and React Native
- **Compliance**: SOC 2, GDPR, HIPAA-ready infrastructure

---

## What Changed

### Before (Custom Zustand)

```javascript
// Manual email/password handling
const login = (userData) => set({ isAuthenticated: true, user: userData });
const logout = () => set({ isAuthenticated: null, user: null });
```

### After (Clerk)

```javascript
// Clerk handles OAuth and session management
const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
const { signOut } = useAuth();
```

---

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HealthMate AI (Client)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  App.js (ClerkProvider + SignedIn/SignedOut)                        │
│        ↓                                                             │
│  LoginScreen.js                                                     │
│    ├─ Google OAuth via useOAuth({ strategy: 'oauth_google' })     │
│    └─ Guest Mode via setIsGuestMode(true)                          │
│        ↓                                                             │
│  Zustand Store (isGuestMode flag, user sync)                       │
│    ├─ setIsGuestMode(isGuest: boolean)                             │
│    ├─ setUser(userData)  -- syncs Clerk user via useUser()        │
│    └─ clearGuestMode()                                             │
│        ↓                                                             │
│  ProfileScreen.js                                                   │
│    ├─ useAuth() -- check isSignedIn, call signOut()               │
│    ├─ useUser() -- fetch Clerk user data                          │
│    └─ handleLogout() -- calls Clerk signOut() + clearGuestMode()  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
       ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Clerk Authentication Service                   │
│                  (OAuth, Session, Token Management)                 │
└─────────────────────────────────────────────────────────────────────┘
       ↓ OAuth ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          Google OAuth                               │
│                    (user profile, email, avatar)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @clerk/clerk-expo expo-secure-store
```

**Installed Versions:**

- `@clerk/clerk-expo@3.2.10` -- Clerk React Native SDK
- `expo-secure-store@15.0.8` -- Secure token storage

### 2. Environment Variables

Your `.env` file already contains:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Z29sZGVuLWxvY3VzdC04Ni5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_yWzet9NEvLlHDOkb1LiyrgXGm6GTyhaun4M2gfsXA5
```

**Never commit secret keys to version control!**  
For production, use Clerk's Dashboard to manage keys and store them securely.

### 3. Project Files Updated

#### `src/utils/tokenCache.js` (NEW)

Implements Clerk's required token caching interface using `expo-secure-store`:

```javascript
export const tokenCache = {
  getToken: async () => {
    /* retrieve from SecureStore */
  },
  saveToken: async (token) => {
    /* save to SecureStore */
  },
  clearToken: async () => {
    /* delete from SecureStore */
  },
};
```

#### `App.js` (REFACTORED)

Wraps the app with `ClerkProvider` and uses `SignedIn`/`SignedOut` components:

```javascript
<ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
  <MainApp />
</ClerkProvider>
```

#### `src/screens/LoginScreen.js` (REWRITTEN)

Implements Google OAuth and Guest Mode:

```javascript
const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

const handleGoogleSignIn = async () => {
  const { createdSessionId, setActive } = await startOAuthFlow();
  if (createdSessionId) {
    setActive?.({ session: createdSessionId });
  }
};

const handleContinueAsGuest = () => {
  setIsGuestMode(true);
};
```

#### `src/store/useHealthStore.js` (UPDATED)

Removed `login()` and `logout()`, added `isGuestMode` flag:

```javascript
// Removed:
// - isAuthenticated state
// - login(userData) action
// - logout() action

// Added:
// - isGuestMode: boolean
// - setIsGuestMode(isGuest)
// - setUser(userData)  -- for syncing Clerk user
// - clearGuestMode()   -- clears guest flag + resets tracking
```

#### `src/screens/ProfileScreen.js` (UPDATED)

Integrated Clerk hooks for authentication and user data:

```javascript
const { isSignedIn, signOut } = useAuth();
const { user: clerkUser } = useUser();

// Sync Clerk user into Zustand
useEffect(() => {
  if (clerkUser) {
    setUser({
      id: clerkUser.id,
      name: clerkUser.firstName || clerkUser.username,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      avatar: clerkUser.profileImageUrl,
    });
  }
}, [clerkUser]);

// Logout: Clerk signOut + clear guest mode
const handleLogout = async () => {
  if (isSignedIn) await signOut();
  clearGuestMode();
};
```

---

## Authentication States

The app now manages three authentication states:

### State 1: Guest Mode (No Login)

```javascript
{
  isGuestMode: true,
  user: null,
  isSignedIn: false (Clerk),
  AppNavigator is shown,
}
```

### State 2: Signed In (Clerk OAuth)

```javascript
{
  isGuestMode: false,
  user: { id, name, email, avatar }, // from Clerk + synced to Zustand
  isSignedIn: true (Clerk),
  AppNavigator is shown,
}
```

### State 3: Not Signed In & Not Guest (Default)

```javascript
{
  isGuestMode: false,
  user: null,
  isSignedIn: false (Clerk),
  AuthNavigator (LoginScreen) is shown,
}
```

---

## Step-by-Step Testing Guide

### Test 1: Guest Mode Navigation

1. Launch app
2. Tap "Continue as Guest"
3. Verify `AppNavigator` renders (you're in the app)
4. Open Profile Screen
5. Verify "Log Out" button appears
6. Tap "Log Out"
7. Verify navigation back to LoginScreen

### Test 2: Google OAuth Sign-In

1. Launch app
2. Tap "Continue with Google"
3. Android will open browser OAuth consent screen
4. Select Google account
5. Verify session is created and `AppNavigator` renders
6. Verify Profile Screen shows user name/email from Google
7. Tap "Log Out"
8. Verify navigation back to LoginScreen

### Test 3: Premium Feature Access

1. Tap "Dark Mode" toggle (guest mode)
2. Verify PaywallScreen appears (feature locked)
3. Premium unlock (via `togglePremium()` in store or PaywallScreen)
4. Tap "Dark Mode" toggle
5. Verify theme toggles

### Test 4: Session Persistence

1. Sign in with Google
2. Close and reopen app
3. Verify you're still signed in (Clerk cached session)
4. Verify user profile persists

---

## WebBrowser Warmup (Android)

The LoginScreen.js automatically warms up `expo-web-browser` on mount:

```javascript
import * as WebBrowser from "expo-web-browser";

WebBrowser.warmUpAsync();
```

This improves OAuth flow performance on Android by pre-loading the browser context.

---

## Key Hooks & Functions

### Clerk Hooks (in Components)

| Hook           | Purpose                  | Example                                                              |
| -------------- | ------------------------ | -------------------------------------------------------------------- |
| `useAuth()`    | Get auth status, signOut | `const { isSignedIn, signOut } = useAuth();`                         |
| `useUser()`    | Get current user profile | `const { user } = useUser();`                                        |
| `useOAuth()`   | Start OAuth flow         | `const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });` |
| `useSession()` | Get session data         | `const { session } = useSession();`                                  |

### Zustand Actions (in Store)

| Action           | Purpose                           | Signature                 |
| ---------------- | --------------------------------- | ------------------------- |
| `setUser`        | Sync Clerk user into store        | `setUser(userData)`       |
| `setIsGuestMode` | Set guest mode flag               | `setIsGuestMode(boolean)` |
| `clearGuestMode` | Clear guest flag + reset tracking | `clearGuestMode()`        |

---

## Troubleshooting

### Issue: "Missing Publishable Key"

**Solution:** Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env`

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

### Issue: OAuth Flow Hangs

**Solution:** Ensure WebBrowser warmup runs before OAuth:

```javascript
import * as WebBrowser from "expo-web-browser";
WebBrowser.warmUpAsync();
```

### Issue: User Not Syncing to Zustand

**Solution:** Verify `useEffect` in ProfileScreen fires after `useUser()` loads:

```javascript
useEffect(() => {
  if (isLoaded && clerkUser) {
    setUser({
      /* ... */
    });
  }
}, [isLoaded, clerkUser]);
```

### Issue: Token Cache Not Working

**Solution:** Verify `expo-secure-store` permissions in app.json:

```json
{
  "ios": {
    "useFrameworks": "static"
  },
  "android": {
    "permissions": ["android.permission.INTERNET"]
  }
}
```

---

## Production Checklist

- [ ] Move `CLERK_SECRET_KEY` to backend environment only (not .env file)
- [ ] Use Clerk's Production publishable key (pk*live*...)
- [ ] Enable MFA in Clerk Dashboard
- [ ] Set up email/SMS notifications in Clerk
- [ ] Test OAuth flow with production Google Client ID
- [ ] Set up error logging (Sentry) for OAuth failures
- [ ] Test on physical Android device with real network
- [ ] Verify secure token storage on target device
- [ ] Set CORS headers if backend proxy is used
- [ ] Enable rate limiting on auth endpoints

---

## Local Android Build & Testing

### Using Local Gradle with USB Debugger

#### 1. Connect Android Device

```bash
adb devices
# Output: <device-id>  device
```

#### 2. Build Development Build

```bash
eas build --profile development --platform android --local
```

Or use local gradle:

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### 3. Launch App with Debugger

```bash
adb shell am start -n com.healthmate.ai/.MainActivity
```

#### 4. View Logs

```bash
adb logcat | grep -i clerk
```

---

## Next Steps

1. **Test OAuth flow** on development device
2. **Set up Google OAuth credentials** in Clerk Dashboard
3. **Test guest mode** and session persistence
4. **Implement error boundaries** for auth failures
5. **Add logging** for OAuth debugging
6. **Prepare production** Clerk keys and settings

---

## References

- [Clerk Expo Documentation](https://clerk.com/docs/references/expo)
- [Expo Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Navigation Authentication](https://reactnavigation.org/docs/auth-flow)

---

## Summary

The migration from custom Zustand auth to Clerk provides:

- ✅ Production-grade OAuth support
- ✅ Secure token storage with `expo-secure-store`
- ✅ Automatic session management
- ✅ User profile sync with Zustand
- ✅ Guest mode fallback for unauthenticated users
- ✅ Premium feature gating remains intact

All authentication logic is now centralized in Clerk, while HealthMate AI's custom state (`isGuestMode`, premium features, health data) remains in Zustand for app-specific concerns.
