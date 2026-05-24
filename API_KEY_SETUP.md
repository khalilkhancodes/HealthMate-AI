# NVIDIA Chat API Setup

## 1) Get your NVIDIA API key

Go to NVIDIA Build or your NVIDIA API dashboard and create/copy a chat API key.

Keep it private. Do not hardcode it into `AIChatScreen.js`.

---

## 2) Add the key to Expo env vars

Create a `.env` file at the project root:

```bash
EXPO_PUBLIC_NVIDIA_API_KEY=your-nvidia-api-key-here
```

`AIChatScreen.js` reads this value with:

```javascript
const NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY || "";
```

---

## 3) Verify it works

Run the app and:

- Open the AI Chat screen
- Send a message
- You should get a real response from the NVIDIA chat completions API
- Check the console for any API or network errors

If you see a missing-key error:

- Make sure `.env` exists in the project root
- Make sure the variable name is exactly `EXPO_PUBLIC_NVIDIA_API_KEY`
- Restart Metro after editing the env file

---

## 4) Security notes

### Development

- Expo public env vars are visible in the client bundle
- That is acceptable for development, not for production secrets

### Production

Use a backend proxy so the NVIDIA key never ships inside the app:

```javascript
const response = await fetch("https://your-backend.com/api/healthmate-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages }),
});
```

Your backend should call NVIDIA with the secret key and return the assistant message.

---

## 5) Verification checklist

- [ ] You added `EXPO_PUBLIC_NVIDIA_API_KEY` to `.env`
- [ ] You restarted the dev server
- [ ] You sent a message in AI Chat
- [ ] You got a real response from NVIDIA
