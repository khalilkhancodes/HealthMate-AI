# 🚀 Quick Start (5 Minutes)

## Step 1: Install the SDK (30 seconds)

```bash
npm install @google/generative-ai
```

## Step 2: Get API Key (1 minute)

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

## Step 3: Add Key (1 minute)

Open: `src/screens/AIChatScreen.js`

Find line 17:

```javascript
const API_KEY = ""; // Add your API key here
```

Replace with:

```javascript
const API_KEY = "AIzaSyD...your-key...abc123";
```

## Step 4: Restart (30 seconds)

```bash
npm start
```

## Step 5: Test (2 minutes)

1. Open the AI Chat screen
2. Send: "What's my current step count?"
3. You should get a personalized response based on your actual steps!

---

## ✅ What You Should See

**Free User:**

- Badge showing "10 Free Left" (decrements with each message)
- After 10 messages → redirected to PaywallScreen

**Premium User:**

- No badge
- Unlimited messages

**Dark Mode:**

- Chat colors update when you toggle dark mode
- All bubbles and text use theme colors

**Chat Persistence:**

- Close app
- Reopen
- Chat history still there!

---

## 🐛 If You See an Error

**"Unable to resolve module '@google/generative-ai'"**
→ Run: `npm install @google/generative-ai`
→ Restart the dev server

**API Key Error**
→ Check your key is correct (no spaces)
→ Verify it's from https://aistudio.google.com/app/apikey
→ Make sure the key is enabled

---

## 📚 Full Documentation

- `AICHAT_SETUP.md` - Complete setup guide
- `AICHAT_SUMMARY.md` - Full summary of changes
- `AICHAT_BEFORE_AFTER.md` - Code comparisons
- `AICHAT_ARCHITECTURE.md` - Technical details
- `API_KEY_SETUP.md` - API key guide

---

**That's it! You're done in 5 minutes.** 🎉
