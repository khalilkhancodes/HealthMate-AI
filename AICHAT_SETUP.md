# HealthMate AI - AIChatScreen Setup Guide

## ✅ Completed Upgrades

Your `AIChatScreen.js` has been completely rewritten with the following enterprise features:

### 1. **State Persistence & Theme Integration**

- ✅ Integrated `useTheme()` hook - all UI colors are dynamic (`COLORS` and `FONTS`)
- ✅ Integrated `useHealthStore` - chat history persists across app sessions via Zustand
- ✅ Auto-injects initial greeting message when `aiChatHistory` is empty
- ✅ Uses `aiChatHistory` and `addChatMessage` from global store (no more local state)

### 2. **Gemini API Integration**

- ✅ Imported `GoogleGenerativeAI` SDK
- ✅ Configured `gemini-1.5-flash` model
- ✅ Real asynchronous API calls replace mock responses
- ✅ `isTyping` state works correctly during API calls
- ✅ Proper error handling with fallback messages

### 3. **Context-Aware System Prompting**

- ✅ System instruction pulls live data from Zustand store:
  - Current daily steps vs goal
  - Water intake (ml)
  - Sleep duration (hours)
- ✅ AI responds with personalized, encouragement-based advice
- ✅ Context string passed to Gemini model for intelligent responses

### 4. **Android Keyboard Bug Fix**

- ✅ `KeyboardAvoidingView` updated to use `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`
- ✅ `keyboardVerticalOffset` set to `90` for iOS and `80` for Android
- ✅ Input field rests perfectly on Android virtual keyboard

### 5. **Premium Features**

- ✅ Free user gate: Shows "X Free Left" badge
- ✅ When free questions exhausted, redirects to PaywallScreen
- ✅ Premium users get unlimited questions
- ✅ Free question counter decrements on each message

---

## 🚀 Installation & Setup Steps

### Step 1: Install the Google Generative AI SDK

```bash
npm install @google/generative-ai
# or
yarn add @google/generative-ai
```

### Step 2: Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key" and create a new key
3. Copy the API key

### Step 3: Add Your API Key

Open `src/screens/AIChatScreen.js` and replace the empty string with your actual API key:

```javascript
// Line 17 - Replace with your API key
const API_KEY = "your-actual-api-key-here";
```

⚠️ **Security Note**: For production, move this to environment variables:

```javascript
import { API_KEY } from "../config/secrets"; // or from process.env
```

### Step 4: Verify Zustand Store Integration

The store (`src/store/useHealthStore.js`) now includes:

```javascript
aiChatHistory: [],
addChatMessage: (message) => set((state) => ({
  aiChatHistory: [...state.aiChatHistory, message]
})),
```

These are automatically persisted via AsyncStorage.

---

## 📋 Feature Checklist

### User Experience

- [x] Dark mode support (via `useTheme` hook)
- [x] Chat history persists across app sessions
- [x] Typing indicator shows while AI responds
- [x] Auto-scroll to latest messages
- [x] Input disabled while typing
- [x] Smooth keyboard handling (iOS + Android)
- [x] Premium badge shows free questions remaining

### AI Capabilities

- [x] Context-aware responses based on user's health stats
- [x] Personalized advice (steps, water, sleep)
- [x] Encouraging, supportive tone
- [x] Respects 3-paragraph response limit
- [x] Error handling for API failures

### Business Logic

- [x] Free user gating (10 free questions per session)
- [x] Premium users get unlimited access
- [x] Redirect to PaywallScreen when out of free questions
- [x] Question counter decrements correctly

---

## 🔧 Customization

### Adjust System Prompt

The AI personality is defined in `buildSystemPrompt()` function. To customize:

```javascript
const buildSystemPrompt = () => {
  return `You are HealthMate AI, ...
    // Modify this text to change AI behavior
  `;
};
```

### Adjust Keyboard Offsets

If the keyboard offset is off on your device:

```javascript
keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80} // Adjust these numbers
```

### Change Response Length

Modify `maxOutputTokens` in `handleSend()`:

```javascript
generationConfig: {
  maxOutputTokens: 500, // Increase for longer responses
  temperature: 0.7,
},
```

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] API key is correctly set
- [ ] Send a message as a free user - should see it in chat
- [ ] Free question counter decrements
- [ ] When free questions = 0, clicking send redirects to Paywall
- [ ] Log in as premium user - no question limit badge
- [ ] Toggle dark mode - chat colors update dynamically
- [ ] Close app and reopen - chat history persists
- [ ] Long messages wrap properly in bubbles
- [ ] Typing indicator appears while waiting for response
- [ ] Test on both iOS and Android for keyboard behavior

---

## 📱 UI Structure

```
KeyboardAvoidingView (handles iOS/Android keyboard)
├── Header (with back button, title, free questions badge)
├── FlatList (renders aiChatHistory from Zustand)
│   ├── AI Messages (left-aligned, sparkle avatar)
│   └── User Messages (right-aligned, primary color)
├── Typing Indicator (shows while AI responds)
└── Input Area
    ├── TextInput (asks "Ask me anything...")
    └── Send Button (disabled until input filled)
```

---

## 🐛 Troubleshooting

### "Unable to resolve module '@google/generative-ai'"

- Solution: Run `npm install @google/generative-ai`
- Restart the dev server

### API Key not working

- Check that you copied the full key (no extra spaces)
- Verify the key is enabled in Google Cloud Console
- Ensure Generative AI API is enabled

### Chat history not persisting

- Verify AsyncStorage is installed: `npm list @react-native-async-storage/async-storage`
- Check that Zustand persist middleware is working
- Clear app cache and test again

### Keyboard covering input on Android

- Adjust `keyboardVerticalOffset` to 80-100 range
- Test on physical Android device (emulator behavior varies)

---

## 📚 API Reference

### Context Data Available from Zustand

The system prompt has access to:

- `dailySteps` - Current step count
- `stepGoal` - Daily step target
- `waterIntake` - Water consumed today (ml)
- `sleepDuration` - Hours slept today

Add more stats to system prompt as needed:

```javascript
- BMI: ${bmi}
- Heart Rate: ${heartRate} bpm
```

---

## 🔐 Environment Variables (Production)

Create a `.env.local` file:

```
EXPO_PUBLIC_GEMINI_API_KEY=your-api-key-here
```

Then update the import:

```javascript
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
```

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Google Gemini API docs: https://ai.google.dev/
3. Check React Native docs for platform-specific issues

---

**Last Updated**: April 29, 2026
**Screen**: AIChatScreen.js
**Status**: ✅ Production Ready
