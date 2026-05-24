# Quick Reference: Commands & Setup

**HealthMate AI - May 15, 2026**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
# - Ensure .env has EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
# - Ensure .env has EXPO_PUBLIC_NVIDIA_API_KEY

# 3. Build Android APK
cd android
./gradlew assembleDebug

# 4. Connect device & install
adb devices
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 5. Launch app
adb shell am start -n com.healthmate.ai/.MainActivity

# 6. View logs
adb logcat | grep -i "clerk\|pedometer"
```

---

## 📋 Environment Setup (One-Time)

### Windows Environment Variables

```powershell
# Java
setx JAVA_HOME "C:\Program Files\Java\jdk-17.0.1"

# Android SDK
setx ANDROID_SDK_ROOT "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
setx ANDROID_HOME "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"

# Add to PATH
setx PATH "%PATH%;%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\tools"

# Verify
java -version
adb --version
sdkmanager --list
```

### Android Device Setup

```bash
# Enable USB Debugging
# Settings → About Phone → Build Number (tap 7x) → Developer Options

# Connect & verify
adb devices
# Output: 1A2B3C4D5E6F7G8H  device

# Grant permissions
# Device prompt: Tap "Allow" for debugging permission
```

---

## 🔧 Build Commands

### Debug Build

```bash
cd android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
# Time: 3-5 min (first), 1-2 min (incremental)
```

### Release Build

```bash
cd android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
# Requires signing config in app/build.gradle
```

### Clean Build

```bash
cd android
./gradlew clean
./gradlew assembleDebug
# Clears cached files & rebuilds
```

### Optimized Build (Skip Lint)

```bash
cd android
./gradlew assembleDebug -x lint
# Faster build, skips code linting
```

---

## 📱 Device Management

### Install & Launch

```bash
# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Uninstall previous version
adb uninstall com.healthmate.ai

# Launch app
adb shell am start -n com.healthmate.ai/.MainActivity

# Check if running
adb shell dumpsys window | grep "mCurrentFocus"
```

### View Logs

```bash
# Real-time logs
adb logcat

# Filter by tag
adb logcat -s "Clerk"
adb logcat -s "Pedometer"

# Filter by app
adb logcat | grep "com.healthmate"

# Save to file
adb logcat > logs_$(date +%s).txt

# Clear logs
adb logcat -c
```

### Device Info

```bash
# List devices
adb devices

# Get device info
adb shell getprop ro.build.version.release     # Android version
adb shell getprop ro.product.model              # Device model
adb shell getprop ro.hardware                   # Hardware info

# Check storage
adb shell df -h

# Memory usage
adb shell dumpsys meminfo com.healthmate.ai
```

---

## 🔐 Environment Variables

### Create `.env` file (in project root)

```dotenv
# Clerk OAuth (from Clerk Dashboard)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Z29sZGVuLWxvY3VzdC04Ni5jbGVyay5hY2NvdW50cy5kZXYk

# Backend secret (NOT used in Expo client build)
CLERK_SECRET_KEY=sk_test_yWzet9NEvLlHDOkb1LiyrgXGm6GTyhaun4M2gfsXA5

# NVIDIA API (for AI chat)
EXPO_PUBLIC_NVIDIA_API_KEY=nvapi_YOUR_KEY_HERE
```

### Verify Env Vars

```bash
# Check if loaded
echo $EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

# In app code
console.log(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
```

---

## 🧪 Testing Scenarios

### Test Guest Mode

```bash
# Steps:
# 1. adb shell am start -n com.healthmate.ai/.MainActivity
# 2. Tap "Continue as Guest"
# 3. Verify StepScreen loads
# 4. Open Profile → Tap "Log Out"
# 5. Verify back to LoginScreen
```

### Test Google OAuth

```bash
# Steps:
# 1. Tap "Continue with Google"
# 2. Browser opens (if not, check WebBrowser warmup)
# 3. Select Google account
# 4. Verify logged in
# 5. Check Profile shows user name/email
# 6. Verify session persists after app restart
```

### Test Pedometer

```bash
# Steps:
# 1. Open StepScreen
# 2. Tap "Start Workout"
# 3. Walk >10 steps
# 4. Watch step count increase
# 5. Tap "Stop Workout"
# 6. Verify tracking stopped
```

### Test AI Chat

```bash
# Steps:
# 1. Open AIChatScreen
# 2. Type: "What should I eat for breakfast?"
# 3. Verify NVIDIA response appears
# 4. Send 2-3 more messages
# 5. Check chat history persists
```

---

## 🐛 Debugging

### Enable Debug Mode

```bash
# In React Native Debugger
adb shell getprop ro.debuggable
# Output: 1 (enabled)

# Attach debugger
react-native-debugger &
adb logcat | grep "react-native"
```

### Check Clerk Auth

```bash
# View Clerk logs
adb logcat -s "Clerk"

# Manually test token cache
adb shell am start -n com.healthmate.ai/.MainActivity
adb logcat -s "tokenCache"
```

### Monitor Network

```bash
# Capture HTTP traffic
adb shell setprop http.proxyHost 127.0.0.1
adb shell setprop http.proxyPort 8888

# Or use Charles/Fiddler to inspect
# NVIDIA API calls, Clerk OAuth, etc.
```

---

## 📦 Dependency Management

### Install Dependencies

```bash
npm install
# or
yarn install

# Add new package
npm install @expo/vector-icons@latest

# Remove package
npm uninstall package-name

# Update all
npm update
```

### Check Installed Versions

```bash
npm list
npm list @clerk/clerk-expo
npm list expo-sensors
```

### Fix Peer Dependency Issues

```bash
npm install --legacy-peer-deps
# Use if you hit peer dependency conflicts
```

---

## 🔑 Authentication

### Reset Clerk Session (Device)

```bash
# Clear app data
adb shell pm clear com.healthmate.ai

# Reinstall app
adb uninstall com.healthmate.ai
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Test OAuth Redirect

```bash
# Verify redirect URI in Clerk Dashboard:
# Settings → Applications → [Your App] → Redirect URLs
# Should include: exp://localhost:8081/oauth-callback
```

---

## 📊 Performance Monitoring

### Check App Size

```bash
# Get installed app size
adb shell pm list packages -f | grep healthmate
adb shell du -sh /data/app/*healthmate*

# Analyze APK
bundletool analyze-bundle --bundle=app.aab --mode=size-total
```

### Monitor Memory

```bash
# Real-time memory usage
adb shell dumpsys meminfo com.healthmate.ai

# Memory leak detection
adb shell am dumpheap com.healthmate.ai /sdcard/heap.dump
adb pull /sdcard/heap.dump
# Analyze with Android Studio Profiler
```

### Frame Rate (Performance)

```bash
# Enable GPU profiling
adb shell setprop debug.atrace.tags.enableflags 1

# View frame drops
adb shell dumpsys gfxinfo com.healthmate.ai
```

---

## 🚢 Deployment

### Prepare Release APK

```bash
# 1. Create keystore (one-time)
keytool -genkey -v -keystore healthmate.keystore \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Build release APK
cd android
./gradlew assembleRelease

# 3. Verify signature
jarsigner -verify -verbose app/build/outputs/apk/release/app-release.apk

# 4. Upload to Google Play Console
# Settings → Releases → Production → Upload APK
```

### Generate App Bundle (for Google Play)

```bash
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## ✅ Pre-Launch Checklist

```bash
# 1. Build check
./gradlew assembleDebug

# 2. Install check
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 3. Test scenarios
# [ ] Guest mode works
# [ ] Clerk OAuth completes
# [ ] Pedometer tracking active
# [ ] AI chat responds
# [ ] Premium gating works
# [ ] Profile logout works
# [ ] Session persists on restart

# 4. Log check
adb logcat | grep -i "error\|exception"

# 5. Device compatibility
# [ ] Android 31+ device
# [ ] At least 200MB free storage
# [ ] Google Play Services installed
```

---

## 📚 Useful Files to Review

```
Key Implementation Files:
├── src/utils/tokenCache.js ............. Clerk token caching
├── src/screens/LoginScreen.js ......... Google OAuth
├── src/screens/ProfileScreen.js ....... Clerk integration
├── src/store/useHealthStore.js ........ Zustand auth state
├── App.js ............................. ClerkProvider wrapper
├── app.json ........................... Android permissions

Documentation:
├── CLERK_MIGRATION.md ................. Auth migration guide
├── ANDROID_BUILD_GUIDE.md ............. Build & test instructions
├── PROJECT_SUMMARY.md ................. Architecture overview
└── .env .............................. Environment configuration
```

---

## 🔗 Quick Links

| Resource         | URL                                    |
| ---------------- | -------------------------------------- |
| Clerk Docs       | https://clerk.com/docs/references/expo |
| Expo Docs        | https://docs.expo.dev                  |
| React Native     | https://reactnative.dev/docs           |
| NVIDIA API       | https://docs.nvidia.com/ai-enterprise  |
| Android Dev      | https://developer.android.com          |
| React Navigation | https://reactnavigation.org            |

---

## 💡 Pro Tips

1. **Speed up builds**: Use `gradlew assembleDebug -x lint`
2. **Save logs**: `adb logcat > logs_$(date +%s).txt`
3. **Monitor memory**: Run `adb shell dumpsys meminfo com.healthmate.ai` periodically
4. **Test OAuth offline**: Use Clerk's test mode before deploying
5. **Cache APK**: Keep `app-debug.apk` to avoid rebuilding
6. **Use daemon**: `./gradlew --daemon` for faster repeated builds
7. **Screen mirror**: `scrcpy` to see device screen on computer

---

**Happy developing! 🎉**

Last Updated: May 15, 2026
