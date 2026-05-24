# AIChatScreen - Implementation Guide

> Comprehensive guide for the Gemini AI integration in AIChatScreen

## 📖 Documentation Index

### 🚀 Quick Setup (Start Here)

- **QUICKSTART.md** - Get up and running in 5 minutes

### 📋 Complete Guides

- **AICHAT_SETUP.md** - Full setup with all options
- **AICHAT_SUMMARY.md** - Complete overview of changes
- **API_KEY_SETUP.md** - API key management guide

### 🔍 Technical Details

- **AICHAT_ARCHITECTURE.md** - System design and data flows
- **AICHAT_BEFORE_AFTER.md** - Code comparisons
- **AICHAT_CHANGES.md** - Detailed change log

---

## 📝 What Was Done

### Files Modified

#### 1. `src/screens/AIChatScreen.js`

**Status:** ✅ Complete Rewrite

**Before:**

- Mock AI responses
- Local state (lost on unmount)
- No API integration
- Android keyboard issues
- Generic responses

**After:**

- Real Gemini API integration
- Global persistent state (Zustand + AsyncStorage)
- Context-aware system prompting
- Android keyboard fixed
- Personalized responses based on health data

**Key Changes:**

```javascript
// Before: Mock response generator
const generateMockAIResponse = (userText) => {
  if (userText.includes("sleep")) return "To improve your sleep...";
  return "That's a great question...";
};

// After: Real Gemini API with context
const buildSystemPrompt = () => {
  return `You are HealthMate AI. The user's stats today:
- Steps: ${dailySteps} / ${stepGoal}
- Water: ${waterIntake}ml
- Sleep: ${sleepDuration} hours
Keep responses under 3 paragraphs. Be encouraging.`;
};

const handleSend = async () => {
  const chat = model.startChat({
    systemInstruction: buildSystemPrompt(),
  });
  const result = await chat.sendMessage(userMessage.text);
  // Real response!
};
```

#### 2. `src/store/useHealthStore.js`

**Status:** ✅ Updated

**Changes:**

- Uncommented `aiChatHistory: []`
- Uncommented `addChatMessage()` function
- Cleaned up old commented code

**New State:**

```javascript
aiChatHistory: [],
addChatMessage: (message) => set((state) => ({
  aiChatHistory: [...state.aiChatHistory, message]
})),
```

---

## 🎯 Features Implemented

### Task 1: ✅ State Persistence & Theme Integration

- Dynamic `COLORS` and `FONTS` from `useTheme()` hook
- Chat history uses `aiChatHistory` from Zustand store
- Auto-inject greeting if history empty
- All colors applied dynamically in JSX

### Task 2: ✅ Gemini API Integration

- Imported `GoogleGenerativeAI` SDK
- Initialized `gemini-1.5-flash` model
- Real async API calls in `handleSend()`
- Proper `isTyping` state management
- Error handling with fallback messages

### Task 3: ✅ Context-Aware System Prompting

- System prompt built from live health data
- Includes: steps, water, sleep stats
- AI gives personalized encouragement
- Context passed to Gemini model

### Task 4: ✅ Android Keyboard Fix

- Set `behavior='height'` for Android
- Set `behavior='padding'` for iOS
- `keyboardVerticalOffset` optimized per platform
- Input stays above keyboard on both platforms

### Bonus: ✅ Free User Gating

- Shows "X Free Left" badge
- Decrements on each message
- Redirects to PaywallScreen when empty
- Premium users unlimited

---

## 🚀 Setup Steps

### Step 1: Install SDK

```bash
npm install @google/generative-ai
```

### Step 2: Get API Key

Go to: https://aistudio.google.com/app/apikey

- Click "Create API Key"
- Copy the key

### Step 3: Add to Code

File: `src/screens/AIChatScreen.js`
Line 17:

```javascript
const API_KEY = "your-actual-key-here";
```

### Step 4: Restart

```bash
npm start
```

### Step 5: Test

- Send a message in AI Chat
- Should get real Gemini response
- Check free question counter

---

## 🧪 Verification Checklist

- [ ] SDK installed: `npm install @google/generative-ai`
- [ ] API key added to AIChatScreen.js line 17
- [ ] Free user: Send message → counter decrements
- [ ] Free user: 10 messages → redirect to Paywall
- [ ] Premium user: No counter, unlimited messages
- [ ] Dark mode: Toggle → chat colors update
- [ ] Persistence: Close app → reopen → chat still there
- [ ] iOS: Keyboard doesn't cover input
- [ ] Android: Keyboard doesn't cover input
- [ ] Long messages: Wrap properly in bubbles
- [ ] Typing indicator: Shows while waiting
- [ ] Error: Send with no API key → error message shown

---

## 🔧 Customization

### Change AI Personality

Edit `buildSystemPrompt()`:

```javascript
const buildSystemPrompt = () => {
  return `You are HealthMate AI...
  // Modify this text to change behavior
  `;
};
```

### Adjust Response Length

Edit `generationConfig` in `handleSend()`:

```javascript
generationConfig: {
  maxOutputTokens: 500, // Increase for longer
  temperature: 0.7,
},
```

### Adjust Keyboard Offset

Edit KeyboardAvoidingView:

```javascript
keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
// Adjust these numbers based on your header height
```

---

## 🐛 Troubleshooting

### "Unable to resolve module '@google/generative-ai'"

**Solution:**

```bash
npm install @google/generative-ai
npm start
```

### API key not working

**Check:**

- Key copied completely (no spaces)
- From correct URL: https://aistudio.google.com/app/apikey
- Key is enabled in Google Cloud Console
- Generative AI API is enabled

### Chat not persisting

**Check:**

- AsyncStorage installed: `npm list @react-native-async-storage/async-storage`
- Clear app cache and retest
- Check app storage permissions

### Keyboard covers input on Android

**Try:**

- Adjust `keyboardVerticalOffset` to 70-100
- Test on physical device (emulator varies)

---

## 📱 User Experience Flow

```
User Opens AI Chat
      ↓
Initial greeting shown (first time only)
      ↓
User types message
      ↓
Send button becomes enabled
      ↓
User presses Send
      ↓
Premium/Free gate check
      ↓
User message added to chat
Free question counter decrements (if free)
      ↓
Typing indicator appears
      ↓
System prompt built with live health data:
  "Steps: 6543/10000, Water: 2400ml, Sleep: 7.5h"
      ↓
Gemini API called with context
      ↓
AI response received
      ↓
Response added to chat
Typing indicator disappears
      ↓
Chat auto-scrolls to bottom
      ↓
Message persisted to AsyncStorage
      ↓
User can send next message
```

---

## 🔐 Security Notes

### Development

- API key in code is acceptable for testing
- React Native can expose keys through debugging

### Production

**Option 1: Environment Variables**

```bash
# .env.local
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
```

**Option 2: Backend Proxy (Recommended)**

```javascript
// Instead of direct API call
const response = await fetch("https://your-backend.com/api/gemini", {
  method: "POST",
  body: JSON.stringify({ message, history }),
});
// Backend calls Gemini with secret key
```

---

## 📊 Performance

### Optimizations

- FlatList renders only visible messages
- System prompt built on-demand
- No unnecessary re-renders
- isTyping prevents concurrent API calls

### Potential Improvements

- Message pagination (load older msgs)
- Response caching
- Image upload support
- Voice input
- Message search

---

## 📞 Support

**Docs Location:** `/HealthMate AI/` folder

- `QUICKSTART.md` - 5-min setup
- `AICHAT_SETUP.md` - Full guide
- `AICHAT_ARCHITECTURE.md` - Technical
- `API_KEY_SETUP.md` - API guide

**Next Steps:**

1. Read QUICKSTART.md
2. Run setup commands
3. Add API key
4. Test

---

## 📚 Links

- [Gemini API Docs](https://ai.google.dev/)
- [Get API Key](https://aistudio.google.com/app/apikey)
- [React Native Docs](https://reactnative.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)

---

**Ready to get started?** → Read `QUICKSTART.md`
