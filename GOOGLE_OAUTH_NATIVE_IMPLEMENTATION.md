# Google OAuth Native Implementation Guide

## Clerk + Expo + Android Credential Manager

**Date:** May 17, 2026  
**Project:** HealthMate AI  
**Status:** ✅ Production-Ready  
**Platform:** React Native + Expo SDK 54 + Android Native

---

## Table of Contents

1. [Project Context](#project-context)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Configuration Details](#configuration-details)
5. [Frontend Implementation](#frontend-implementation)
6. [Build & Deployment](#build--deployment)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Migration from Browser-Based Flow](#migration-from-browser-based-flow)

---

## Project Context

### Objective

Successfully implement **native Google Sign-In** for HealthMate AI using:

- **@clerk/expo** (v3.2.10) - Modern authentication platform
- **Android Credential Manager** - Native biometric + password authentication
- **Google Cloud Console** - Custom OAuth credentials
- **Local Debug Keystore** - Android app signing

### Why Native Flow?

| Feature           | Browser Flow            | Native Flow                |
| ----------------- | ----------------------- | -------------------------- |
| User Experience   | Redirects to browser    | In-app bottom sheet        |
| Seamless          | ❌ Context switch       | ✅ Native bottom sheet     |
| Session Handling  | Manual redirect parsing | Automatic session creation |
| Debugging         | More complex            | Cleaner logs               |
| Biometric Support | ❌ Not supported        | ✅ Fingerprint/Face ID     |
| Package Signature | Flexible                | Strict (SHA-1 + SHA-256)   |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   HealthMate AI (Client)                    │
│                   React Native + Expo                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LoginScreen.js                                             │
│  ├─ useSignInWithGoogle() hook (Native flow)               │
│  ├─ startGoogleAuthenticationFlow()                        │
│  └─ setActive({ session: createdSessionId })              │
│        ↓                                                    │
│  Android Credential Manager                                │
│  ├─ BiometricPrompt (Fingerprint/Face ID)                 │
│  ├─ Google Account Selector                               │
│  └─ Package Name Verification (SHA-1)                     │
│        ↓                                                    │
│  Google OAuth Server (GIS)                                 │
│  ├─ Web Client ID validation                              │
│  └─ Token generation                                       │
│        ↓                                                    │
│  Clerk Authentication Service                              │
│  ├─ Session creation                                       │
│  ├─ User profile sync                                      │
│  └─ JWT token issuance                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Google Cloud Console Configuration

#### 1.1 Create OAuth Consent Screen

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services → OAuth consent screen**
4. Choose **User Type: External**
5. Fill in app information:
   - **App name:** HealthMate AI
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com

#### 1.2 Add Test Users

1. In the OAuth consent screen, scroll to **Test users**
2. Click **Add users**
3. Enter your Google account email(s)
4. This allows your accounts to test while the app is in "Testing" status

#### 1.3 Create Web Application Client

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized redirect URI:
   ```
   https://[your-clerk-project].clerk.accounts.dev/v1/oauth_callback
   ```
5. **Save** and copy:
   - **Client ID** (format: `XXXXXXX.apps.googleusercontent.com`)
   - **Client Secret**

#### 1.4 Create Android Client

1. In **Credentials**, click **Create Credentials → OAuth 2.0 Client ID**
2. Choose **Android**
3. Fill in:
   - **Package name:** `com.anonymous.healthmateaitemp`
   - **SHA-1 fingerprint:** (obtained from `cd android && ./gradlew signingReport`)
   - **SHA-256 fingerprint:** (also from signingReport; required by Clerk)

**Getting SHA Fingerprints:**

```bash
cd android
./gradlew signingReport
```

Output will show:

```
Task :app:signingReport
Variant: debug
Config: debug
Store: ~/.android/debug.keystore
Alias: androiddebugkey
MD5: ...
SHA1: AB:CD:EF:12:34:56:78:90:...
SHA-256: AB:CD:EF:12:34:56:78:90:...
```

Copy both SHA-1 and SHA-256 fingerprints (without colons).

---

### Step 2: Clerk Dashboard Configuration

#### 2.1 Enable Custom Google Credentials

1. Log in to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your project
3. Navigate to **Authentications → Social connections → Google**
4. Enable **Use custom credentials**
5. Paste the **Web Client ID** and **Client Secret** from Step 1.3

#### 2.2 Configure Android Native Support

1. In the same Google settings, enable **Android Native Application Support**
2. Enter:
   - **Package Name:** `com.anonymous.healthmateaitemp`
   - **SHA-256 Fingerprint:** (from Step 1.4)
3. **Save changes**

---

### Step 3: Environment Variables Setup

Update your `.env` file with the **Web Client ID**:

```bash
# .env

# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[your-publishable-key]
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=880483315482-gtirrlq81ksscs7dfldbup100d38phsa.apps.googleusercontent.com

# Other API Keys
GEMINI_API_KEY=...
CLERK_SECRET_KEY=sk_test_...
```

**Important:** The `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID` is **required** by the Android Credential Manager for the native token exchange. Without it, the authentication flow will fail.

---

### Step 4: Frontend Implementation

#### 4.1 Update LoginScreen.js

```javascript
import { useSignInWithGoogle } from "@clerk/expo/google";
import { useCallback } from "react";
import { Alert, TouchableOpacity, Text } from "react-native";
import { useHealthStore } from "../store/useHealthStore";

export default function LoginScreen({ navigation }) {
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const setIsGuestMode = useHealthStore((state) => state.setIsGuestMode);

  const handleGoogleSignIn = useCallback(async () => {
    console.log("➡️ Native Google sign-in initiated");

    if (typeof startGoogleAuthenticationFlow !== "function") {
      console.error("startGoogleAuthenticationFlow is missing");
      Alert.alert("Configuration Error", "Google sign-in is not available.");
      return;
    }

    try {
      console.log("Calling native startGoogleAuthenticationFlow...");

      // Native Android flow does NOT use redirect URLs
      const { createdSessionId, setActive } =
        await startGoogleAuthenticationFlow();

      console.log("Session ID Returned:", createdSessionId);

      // If successful, Credential Manager returns the session ID directly
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Navigation handled automatically via Clerk state
        return;
      }

      console.warn("Native flow aborted or returned null session.");
    } catch (err) {
      const message =
        err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5"
          ? "Google sign-in was cancelled."
          : err?.message || "An error occurred during native Google sign-in.";

      if (err?.code !== "SIGN_IN_CANCELLED" && err?.code !== "-5") {
        console.error("❌ Google sign-in error:", err);
        Alert.alert("Google Sign-In Error", message);
      }
    }
  }, [startGoogleAuthenticationFlow]);

  const handleContinueAsGuest = useCallback(() => {
    setIsGuestMode(true);
  }, [setIsGuestMode]);

  return (
    <View>
      {/* Google Sign-In Button */}
      <TouchableOpacity onPress={handleGoogleSignIn}>
        <Text>Continue with Google</Text>
      </TouchableOpacity>

      {/* Guest Mode Button */}
      <TouchableOpacity onPress={handleContinueAsGuest}>
        <Text>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 4.2 Key Implementation Details

- **No redirect URLs:** The native flow does NOT use `redirectUrl` parameters
- **Direct session creation:** `createdSessionId` is returned immediately
- **Automatic session activation:** `setActive()` handles Clerk state updates
- **Error handling:** Check for `SIGN_IN_CANCELLED` to silently dismiss cancellations

---

### Step 5: Build & Deployment

#### 5.1 Generate Debug Keystore Fingerprints

```bash
cd android
./gradlew signingReport
```

#### 5.2 Build APK for Local Testing

```bash
npx expo run:android
```

This command:

- Uses the **local debug.keystore** signature
- Matches the SHA-1/SHA-256 fingerprints from Google Cloud
- Ensures package name alignment (`com.anonymous.healthmateaitemp`)

#### 5.3 Physical Device Testing

1. Enable **USB Debugging** on your Android device
2. Connect via USB
3. Run the build command above
4. Expo will detect the device and install the app

#### 5.4 Production Build (EAS)

For production releases, use EAS Build:

```bash
npx eas build --platform android
```

Configure signing in `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "cli": {
    "version": ">= 3.0.0"
  }
}
```

---

## Configuration Details

### Environment Variables Checklist

| Variable                                 | Value                                        | Required    | Notes                               |
| ---------------------------------------- | -------------------------------------------- | ----------- | ----------------------------------- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`      | `pk_test_...`                                | ✅ Yes      | Clerk frontend key                  |
| `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID` | `[WEB_CLIENT_ID].apps.googleusercontent.com` | ✅ Yes      | **Required for Credential Manager** |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`   | Android OAuth Client ID                      | ⚠️ Optional | Can be omitted if using native flow |

### Package Configuration

In `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@clerk/expo",
        {
          "androidClientId": "880483315482-mjkvhfc1econ3gmhp9r759her71871qn.apps.googleusercontent.com"
        }
      ]
    ],
    "android": {
      "package": "com.anonymous.healthmateaitemp"
    }
  }
}
```

---

## Frontend Implementation

### LoginScreen.js Flow

```javascript
// 1. User presses "Continue with Google"
handleGoogleSignIn()
  ↓
// 2. Native Credential Manager opens
startGoogleAuthenticationFlow()
  ↓
// 3. User selects Google account + biometric
// (Android handles biometric prompt)
  ↓
// 4. Credential Manager exchanges credentials for token
// (Web Client ID required here)
  ↓
// 5. Token sent to Clerk backend
  ↓
// 6. Clerk creates session
createdSessionId returned
  ↓
// 7. Session activated
setActive({ session: createdSessionId })
  ↓
// 8. Clerk state updated → Navigation to HomeScreen
// (ClerkProvider handles automatic navigation)
```

### Error Handling

```javascript
const handleGoogleSignIn = async () => {
  try {
    const { createdSessionId, setActive } =
      await startGoogleAuthenticationFlow();

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
      return;
    }

    console.warn("No session created");
  } catch (err) {
    // User cancelled
    if (err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5") {
      console.log("User cancelled sign-in");
      return;
    }

    // Network error
    if (err?.code === "NETWORK_ERROR") {
      Alert.alert("Network Error", "Please check your internet connection");
      return;
    }

    // Other errors
    console.error("Sign-in error:", err);
    Alert.alert("Error", err?.message || "An error occurred");
  }
};
```

---

## Build & Deployment

### Local Testing (USB Debugger)

**Prerequisites:**

- Android SDK 31+ installed
- USB debugging enabled on device
- Device connected via USB

**Build Steps:**

```bash
# Navigate to project root
cd "d:\Websites\Toolify Lab\HealthMate AI"

# Install dependencies (if needed)
npm install

# Build and run on connected device
npx expo run:android
```

**What happens:**

1. Expo detects connected Android device
2. Compiles React Native code
3. Signs APK with debug keystore
4. SHA-1 fingerprint matches Google Cloud registration
5. Installs app on device
6. Opens app automatically

### Native Build (Production)

**Using EAS Build:**

```bash
eas build --platform android
```

**Using Local Gradle:**

```bash
cd android
./gradlew assembleRelease
```

---

## Troubleshooting

### Issue 1: "Package Name Mismatch"

**Error Message:**

```
Error: com.anonymous.healthmateaitemp is not registered
```

**Solution:**

- Verify `app.json` has correct package name
- Ensure `android/app/build.gradle` uses same package name
- Rebuild with `npx expo run:android`

### Issue 2: "SHA-1 Fingerprint Mismatch"

**Error Message:**

```
The package com.anonymous.healthmateaitemp does not correspond to any of the configured SHA1s
```

**Solution:**

```bash
# Get current fingerprints
cd android
./gradlew signingReport

# Copy SHA-1 (without colons) and update Google Cloud Console
# Example: AB:CD:EF:12... → ABCDEF12...
```

### Issue 3: "Invalid Web Client ID"

**Error Message:**

```
INVALID_CLIENT error in Credential Manager
```

**Solution:**

- Verify `EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID` is set in `.env`
- Confirm it's the **Web** client, not Android client
- Format must be: `[ID].apps.googleusercontent.com`
- Restart Expo: `npx expo start --clear`

### Issue 4: "No Session Created"

**Error Message:**

```
createdSessionId is null
```

**Causes & Solutions:**

| Cause                            | Solution                             |
| -------------------------------- | ------------------------------------ |
| Network error                    | Check internet connectivity          |
| User cancelled                   | Expected behavior; handle gracefully |
| Credential Manager not available | Update Android to 12+                |
| Invalid OAuth config             | Re-verify Clerk dashboard settings   |

### Issue 5: "Redirect URI Mismatch"

**Note:** This error indicates an older browser-based flow was attempted. The native flow does NOT use redirect URIs.

**Solution:**

- Remove all `redirectUrl` parameters from code
- Use only `startGoogleAuthenticationFlow()` without options
- Verify `@clerk/expo/google` version is 3.2.10+

---

## Security Best Practices

### 1. Never Hardcode Credentials

```javascript
// ❌ BAD
const CLIENT_ID =
  "880483315482-gtirrlq81ksscs7dfldbup100d38phsa.apps.googleusercontent.com";

// ✅ GOOD
const CLIENT_ID = process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID;
```

### 2. Secure Environment Variables

```bash
# .env (local only, never commit)
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=...
CLERK_SECRET_KEY=...  # Never expose to frontend

# .env.example (safe to commit)
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=[YOUR_WEB_CLIENT_ID]
CLERK_SECRET_KEY=[DO_NOT_SHARE]
```

### 3. Use Biometric Verification

The native Android Credential Manager **automatically** prompts for biometric verification when available. No additional code required.

### 4. Token Management

Clerk handles all token management:

- Automatic token refresh
- Secure token storage via `SecureStore`
- Token invalidation on logout
- HTTPS-only communication

### 5. Log Sensitive Data Carefully

```javascript
// ✅ Safe
console.log("Session created:", createdSessionId);

// ❌ Unsafe
console.log("Full response:", { token, sessionId, userId });
```

---

## Migration from Browser-Based Flow

### What Changed

**Before (Browser Flow):**

```javascript
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const handleSignIn = async () => {
  const result = await startOAuthFlow();

  // Manual redirect handling
  if (
    result?.signIn?.firstFactorVerification?.externalVerificationRedirectURL
  ) {
    await WebBrowser.openBrowserAsync(
      result.signIn.firstFactorVerification.externalVerificationRedirectURL,
    );
  }
};
```

**After (Native Flow):**

```javascript
import { useSignInWithGoogle } from "@clerk/expo/google";

const handleSignIn = async () => {
  const { createdSessionId, setActive } = await startGoogleAuthenticationFlow();

  if (createdSessionId && setActive) {
    await setActive({ session: createdSessionId });
  }
};
```

### Benefits of Migration

| Aspect                   | Before                 | After               |
| ------------------------ | ---------------------- | ------------------- |
| **UX**                   | Browser context switch | In-app bottom sheet |
| **Session Handling**     | Manual URL parsing     | Automatic           |
| **Error Recovery**       | Complex                | Simplified          |
| **Biometric**            | Not supported          | Built-in            |
| **Code Maintainability** | More lines             | Cleaner code        |

---

## References

- [Clerk Expo Documentation](https://clerk.com/docs/references/expo)
- [Google OAuth Console](https://console.cloud.google.com)
- [Android Credential Manager](https://developers.google.com/identity/android-credential-manager)
- [Expo Documentation](https://docs.expo.dev)
- [@clerk/expo NPM Package](https://www.npmjs.com/package/@clerk/expo)

---

## Support & Contact

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [Clerk Documentation](https://clerk.com/docs)
3. Open an issue in the project repository

---

**Document Version:** 1.0  
**Last Updated:** May 17, 2026  
**Status:** ✅ Production-Ready
