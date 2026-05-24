# Android Build & Testing Guide (Local Gradle + USB Debugger)

**Project:** HealthMate AI  
**Platform:** React Native + Expo  
**Build Method:** Local Gradle with USB Debugger  
**Date:** May 15, 2026

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Android SDK Installation](#android-sdk-installation)
3. [USB Debugger Setup](#usb-debugger-setup)
4. [Building APK](#building-apk)
5. [Testing on Device](#testing-on-device)
6. [Debugging](#debugging)
7. [Common Issues](#common-issues)
8. [Performance Optimization](#performance-optimization)
9. [Deployment Preparation](#deployment-preparation)

---

## Environment Setup

### Prerequisites

- Node.js >= 18.x
- Java JDK 11 or 17
- Android SDK (API 30+)
- Android NDK (for native modules)
- Physical Android device or emulator

### Install Java

#### Windows (Using Chocolatey)

```powershell
choco install openjdk17
```

#### Manual Download

1. Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)
2. Set `JAVA_HOME`:
   ```powershell
   setx JAVA_HOME "C:\Program Files\Java\jdk-17.0.1"
   ```
3. Verify:
   ```bash
   java -version
   javac -version
   ```

---

## Android SDK Installation

### Step 1: Download Android Studio

1. Visit [https://developer.android.com/studio](https://developer.android.com/studio)
2. Download Android Studio for Windows
3. Run the installer and follow the setup wizard

### Step 2: Configure SDK Manager

1. Open Android Studio
2. Go to: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Install the following:
   - **SDK Platforms**: Android API 34, 33, 32, 31
   - **SDK Tools**:
     - Android SDK Platform-Tools (latest)
     - Android SDK Build-Tools 34.0.0+
     - Android Emulator
     - NDK (Side by side) 25.1.8937393

### Step 3: Set Environment Variables

```powershell
# Open PowerShell as Administrator
setx ANDROID_SDK_ROOT "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
setx ANDROID_HOME "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"

# Add to PATH
setx PATH "%PATH%;C:\Users\<YourUsername>\AppData\Local\Android\Sdk\tools;C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools"
```

### Step 4: Verify Installation

```bash
adb --version
# Output: Android Debug Bridge version 1.0.41, Version 34.0.x

sdkmanager --list
# Shows installed packages
```

---

## USB Debugger Setup

### Enable Developer Mode on Android Device

1. Go to **Settings → About Phone**
2. Tap "Build Number" 7 times
3. You'll see: "You are now a developer!"
4. Go back to **Settings → Developer Options**
5. Enable:
   - **USB Debugging**
   - **USB Debugging (Security settings)** (if available)
   - **Install apps via USB**
   - **File transfer mode** (Default)

### Connect Device via USB

1. Connect Android device to computer via USB-C cable
2. On device, tap "Allow" when prompted for debugging permission
3. Verify connection:
   ```bash
   adb devices
   # Output:
   # List of attached devices
   # 1A2B3C4D5E6F7G8H  device
   ```

---

## Building APK

### Navigate to Project Directory

```bash
cd "d:\Websites\Toolify Lab\HealthMate AI"
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Build Debug APK

```bash
cd android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

**Build time:** ~3-5 minutes (first build)  
**Output location:** `app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK

```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

**Note:** Requires signing configuration in `app/build.gradle`

---

## Testing on Device

### Install APK via USB

```bash
# Automated installation
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Verify installation
adb shell pm list packages | grep healthmate
# Output: package:com.healthmate.ai
```

### Launch App

#### Via Command Line

```bash
adb shell am start -n com.healthmate.ai/.MainActivity
# -n = component name
# Format: -n <package>/<activity>
```

#### Via Device UI

1. On device, find "HealthMate AI" in app drawer
2. Tap to launch

### Verify App Running

```bash
adb shell dumpsys window | grep "mCurrentFocus"
# Output: mCurrentFocus=Window{...com.healthmate.ai...}
```

---

## Debugging

### View Logs

```bash
# Real-time logs
adb logcat

# Filter by tag
adb logcat -s "HealthMate"

# Filter by app package
adb logcat | grep -i "com.healthmate"

# Save logs to file
adb logcat > logs.txt

# Clear logs
adb logcat -c
```

### Common Log Tags

| Tag           | Purpose                   |
| ------------- | ------------------------- |
| `Clerk`       | Clerk authentication logs |
| `Pedometer`   | Step tracking logs        |
| `NVIDIA_CHAT` | AI API responses          |
| `ReactNative` | React Native runtime      |
| `Expo`        | Expo framework logs       |

### Interactive Debugging

#### React Native Debugger

1. Install debugger:

   ```bash
   npm install -g react-native-debugger
   ```

2. Open debugger:

   ```bash
   react-native-debugger
   ```

3. In app, press `Ctrl+M` (Android) or `Cmd+D` (iOS)
4. Select "Debug with Chrome" or "Debug with Debugger"

#### Expo Go Debugging

```bash
expo start --local
# Then scan QR code with device using Expo Go app
```

### Breakpoint Debugging with VSCode

1. Create `.vscode/launch.json`:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Attach to React Native",
         "type": "node",
         "request": "attach",
         "port": 9229,
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

2. Connect device
3. Press `Ctrl+M` → "Start Debugging"
4. In VSCode, press `F5` or **Run → Start Debugging**

---

## Common Issues

### Issue 1: "Command not found: adb"

**Cause:** ANDROID_SDK_ROOT not set or PATH not updated

**Solution:**

```bash
# Verify environment variable
echo $ANDROID_SDK_ROOT

# If not set, set it manually
setx ANDROID_SDK_ROOT "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"

# Add to PATH
$env:PATH += ";$env:ANDROID_SDK_ROOT\platform-tools"
```

### Issue 2: "No Devices Found"

**Cause:** USB driver not installed or debugging not enabled

**Solution:**

1. Download USB driver from manufacturer (Samsung, Google Pixel, etc.)
2. Install driver
3. Enable USB Debugging on device
4. Unplug and replug USB cable
5. Verify: `adb devices`

### Issue 3: "Installation Failed"

**Cause:** App already installed or insufficient storage

**Solution:**

```bash
# Uninstall previous version
adb uninstall com.healthmate.ai

# Clear app cache
adb shell pm clear com.healthmate.ai

# Try installation again
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Issue 4: "Gradle Build Failed: SDK Not Found"

**Cause:** Android SDK not configured in `local.properties`

**Solution:**

1. In project root, create `android/local.properties`:

   ```properties
   sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
   ndk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk\\ndk\\25.1.8937393
   ```

2. Re-run build:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

### Issue 5: "Clerk OAuth Not Working"

**Cause:** Missing environment variables or incorrect publishable key

**Solution:**

1. Verify `.env` has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Check logs for OAuth errors:
   ```bash
   adb logcat | grep -i "clerk\|oauth"
   ```
3. Verify WebBrowser warmup in LoginScreen:
   ```javascript
   import * as WebBrowser from "expo-web-browser";
   WebBrowser.warmUpAsync();
   ```

---

## Performance Optimization

### Monitor App Performance

```bash
# View frame rate
adb shell dumpsys gfxinfo com.healthmate.ai

# Memory usage
adb shell dumpsys meminfo com.healthmate.ai

# CPU usage
adb shell top -p $(adb shell pidof com.healthmate.ai)
```

### Optimize Build Size

```bash
# Check APK size
adb shell pm path com.healthmate.ai
# Output: package:/data/app/<app_folder>/app-debug.apk

# Analyze APK
bundletool analyze-bundle --bundle=app.aab --mode=size-total
```

### Reduce Build Time

1. Use incremental builds:

   ```bash
   ./gradlew assembleDebug -x lint -x androidTest
   ```

2. Skip linting:

   ```bash
   ./gradlew assembleDebug -x lint
   ```

3. Use daemon:
   ```bash
   ./gradlew assembleDebug --daemon
   ```

---

## Deployment Preparation

### Pre-Deployment Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set (`.env` with Clerk keys)
- [ ] App builds without errors (`./gradlew assembleDebug`)
- [ ] App runs on test device
- [ ] Guest mode works
- [ ] Clerk OAuth flow works
- [ ] Pedometer tracking works
- [ ] AI chat responds correctly
- [ ] Premium gating works
- [ ] Dark mode toggles
- [ ] Notifications appear
- [ ] Logout clears session

### Generate Release APK

1. Create keystore:

   ```bash
   keytool -genkey -v -keystore healthmate.keystore -keyalg RSA -keysize 2048 -validity 10000
   # Enter password, organization, location, etc.
   ```

2. Configure signing in `app/build.gradle`:

   ```gradle
   signingConfigs {
     release {
       keystore file('healthmate.keystore')
       keystore_password 'YOUR_PASSWORD'
       key_alias 'healthmate'
       key_password 'YOUR_PASSWORD'
     }
   }
   ```

3. Build release APK:
   ```bash
   ./gradlew assembleRelease
   ```

### Upload to Google Play

1. Create Google Play Developer Account
2. Create App Listing
3. Upload APK in **Google Play Console → Release → Production**
4. Fill in store listing, screenshots, description
5. Submit for review

---

## Testing Scenarios

### Scenario 1: Fresh Install + Guest Mode

```bash
adb uninstall com.healthmate.ai
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.healthmate.ai/.MainActivity

# On device:
# 1. Tap "Continue as Guest"
# 2. Verify StepScreen shows steps
# 3. Verify AIChatScreen works
# 4. Tap Profile → Log Out
# 5. Verify back to LoginScreen
```

### Scenario 2: Google OAuth Sign-In

```bash
# On device:
# 1. Tap "Continue with Google"
# 2. Browser opens with OAuth consent
# 3. Select Google account
# 4. Verify logged in
# 5. Check Profile screen shows user name/email
```

### Scenario 3: Session Persistence

```bash
# 1. Sign in with Google
# 2. Close app (swipe out)
# 3. Reopen app
# 4. Verify still logged in (no LoginScreen)
```

### Scenario 4: Pedometer Tracking

```bash
# On device:
# 1. Open StepScreen
# 2. Tap "Start Workout"
# 3. Walk around (>10 steps)
# 4. Verify step count increases
# 5. Tap "Stop Workout"
```

### Scenario 5: AI Chat

```bash
# On device:
# 1. Open AIChatScreen
# 2. Type: "What should I eat for breakfast?"
# 3. Verify NVIDIA response appears
# 4. Send multiple messages
# 5. Check chat history persists
```

---

## Useful Commands Reference

| Command                                      | Purpose                   |
| -------------------------------------------- | ------------------------- |
| `adb devices`                                | List connected devices    |
| `adb install app.apk`                        | Install APK               |
| `adb uninstall com.package`                  | Uninstall app             |
| `adb logcat`                                 | View device logs          |
| `adb shell pm list packages`                 | List installed apps       |
| `adb shell am start`                         | Launch activity           |
| `adb push file.txt /sdcard/`                 | Upload file to device     |
| `adb pull /sdcard/file.txt`                  | Download file from device |
| `adb shell screencap /sdcard/screen.png`     | Take screenshot           |
| `adb shell getprop ro.build.version.release` | Get Android version       |

---

## Next Steps

1. **Set up USB debugging** on your Android device
2. **Build APK**: `cd android && ./gradlew assembleDebug`
3. **Install**: `adb install -r app/build/outputs/apk/debug/app-debug.apk`
4. **Test guest mode** and **Clerk OAuth**
5. **Monitor logs**: `adb logcat | grep -i "clerk\|pedometer"`
6. **Prepare for release** when all tests pass

---

## Support

For issues or questions:

- Check logs: `adb logcat`
- Consult Clerk docs: https://clerk.com/docs
- Review React Native docs: https://reactnative.dev/docs

---

**Happy testing! 🚀**
