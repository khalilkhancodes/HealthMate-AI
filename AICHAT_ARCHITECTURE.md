# AIChatScreen.js - Technical Architecture

## System Prompt Context Flow

```
User Types Message
      ↓
Zustand Store Retrieves Live Health Data:
  • dailySteps: 6543
  • stepGoal: 10000
  • waterIntake: 2400ml
  • sleepDuration: 7.5 hours
      ↓
buildSystemPrompt() Creates Context String:
  "You are HealthMate AI, an expert health coach. The user's current stats today:
   - Steps: 6543 / 10000
   - Water: 2400ml
   - Sleep: 7.5 hours
   Keep responses under 3 short paragraphs. Be highly encouraging..."
      ↓
Gemini Model Receives:
  1. System Instruction (context above)
  2. Conversation History (all previous messages)
  3. Current User Message
      ↓
AI Generates Personalized Response
      ↓
Response Added to aiChatHistory
      ↓
AsyncStorage Persists Automatically
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AIChatScreen Component                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  useTheme() Hook ──────────────→ COLORS & FONTS (Dynamic)   │
│  useHealthStore() ────────────→ All User Health Data        │
│                                 • Daily Stats                │
│                                 • Chat History               │
│                                 • Premium Status             │
│                                                              │
│  handleSend() Function ────────→ Async API Call             │
│    ├─ Validates Premium Gate                                │
│    ├─ Decrements Free Questions                             │
│    ├─ Builds System Prompt                                  │
│    ├─ Calls Gemini API                                      │
│    └─ Stores in Zustand + AsyncStorage                      │
│                                                              │
│  renderMessage() ──────────────→ Styled UI Bubbles          │
│    ├─ Theme-aware Colors                                    │
│    ├─ Font Tokens from Theme                                │
│    └─ Dynamic Backgrounds                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
      Zustand           Google Gemini          AsyncStorage
    State Store            API v1.5-flash      Persistence
```

---

## Component Props & State

### Global State (from useHealthStore)

```javascript
{
  // User Data
  isPremiumUser: boolean,
  freeAiQuestionsRemaining: number,
  decrementAiQuestions: function,

  // Health Stats (used in system prompt)
  dailySteps: number,
  stepGoal: number,
  waterIntake: number,
  sleepDuration: number,

  // Chat Persistence
  aiChatHistory: [
    {
      id: string,
      text: string,
      sender: 'user' | 'ai',
      timestamp: ISO8601,
    }
  ],
  addChatMessage: function,
}
```

### Local State (component-level)

```javascript
{
  inputText: string,           // Current input value
  isTyping: boolean,          // Shows while AI responds
}
```

### Theme Props (from useTheme)

```javascript
{
  COLORS: {
    background: string,
    surface: string,
    primary: string,
    textMain: string,
    textMuted: string,
    border: string,
  },
  FONTS: {
    sectionHeading: { fontSize, fontWeight, color, fontFamily },
    bodyText: { ... },
    smallText: { ... },
  },
  isDark: boolean,
}
```

---

## Component Lifecycle

```
┌─ Mount ─────────────────────────────┐
│                                     │
│  useEffect(() => {                 │
│    if (aiChatHistory.length === 0) │
│      addChatMessage(GREETING)       │
│  }, [aiChatHistory.length, ...])   │
│                                     │
│  Result: Initial greeting shown     │
│          if no chat history         │
│                                     │
└─────────────────────────────────────┘
         ↓
┌─ User Interaction ──────────────────┐
│                                     │
│  1. User types in TextInput         │
│  2. useState updates inputText      │
│  3. Send button becomes enabled     │
│  4. User presses Send               │
│                                     │
└─────────────────────────────────────┘
         ↓
┌─ Message Processing ───────────────┐
│                                     │
│  handleSend() async {               │
│    1. Validate gate                 │
│    2. Add user message to store     │
│    3. Set isTyping = true           │
│    4. Build system prompt           │
│    5. Call Gemini API               │
│    6. Add response to store         │
│    7. Set isTyping = false          │
│  }                                  │
│                                     │
└─────────────────────────────────────┘
         ↓
┌─ UI Updates (Automatic) ───────────┐
│                                     │
│  • FlatList re-renders              │
│    (aiChatHistory changed)          │
│  • New messages appear              │
│  • Typing indicator shown/hidden    │
│  • Scroll to bottom auto-triggered  │
│  • Input cleared                    │
│                                     │
└─────────────────────────────────────┘
         ↓
┌─ Persistence (Automatic) ──────────┐
│                                     │
│  • Zustand store updated            │
│  • AsyncStorage persists            │
│  • Chat survives app restart        │
│                                     │
└─────────────────────────────────────┘
```

---

## API Call Flow

```
MODEL.startChat() with:
├── history: Previous messages formatted for Gemini
├── systemInstruction: Context-aware prompt
├── generationConfig:
│   ├── maxOutputTokens: 500
│   └── temperature: 0.7
└──
   SEND MESSAGE: userMessage.text
      ↓
   GEMINI PROCESSES:
   ├── System instruction (personality + stats context)
   ├── Conversation history (previous exchanges)
   ├── Current user message
      ↓
   GENERATES RESPONSE
      ↓
   RETURNS: result.response.text()
      ↓
   SUCCESS: Add to aiChatHistory
   ERROR: Show error message, add to history
```

---

## Message Structure

### User Message

```javascript
{
  id: '1714392847123',           // timestamp-based ID
  text: 'How can I improve my sleep?',
  sender: 'user',
  timestamp: '2026-04-29T15:34:07.123Z',
}
```

### AI Message

```javascript
{
  id: '1714392847124',           // timestamp + 1
  text: 'Great question! Since you slept 7.5 hours last night...',
  sender: 'ai',
  timestamp: '2026-04-29T15:34:08.456Z',
}
```

### Initial Greeting

```javascript
{
  id: '1',
  text: "Hi! I'm HealthMate AI, your personal wellness coach...",
  sender: 'ai',
  timestamp: new Date().toISOString(),
}
```

---

## Styling Architecture

### StyleSheet (Layout Only)

```javascript
const styles = StyleSheet.create({
  container: { flex: 1 }, // Layout
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    // NO colors here!
  },
  userBubble: { borderBottomRightRadius: 4 }, // Subtle styling
  aiBubble: { borderBottomLeftRadius: 4 },
});
```

### Dynamic Colors in JSX

```javascript
// User bubbles
<View style={[
  styles.userBubble,
  { backgroundColor: COLORS.primary }  // ← Dynamic
]}>

// AI bubbles
<View style={[
  styles.aiBubble,
  { backgroundColor: COLORS.surface }  // ← Dynamic
]}>

// Text
<Text style={[
  styles.messageText,
  { color: isUser ? '#FFFFFF' : COLORS.textMain }  // ← Dynamic
]}>
```

---

## Keyboard Behavior Fix

### Problem (Before)

```
Android: Keyboard covers input field
iOS: Works fine with 'padding' behavior
```

### Solution (After)

```javascript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
>
```

### Result

```
iOS:     Input moves up with 90px offset (header height)
Android: Entire view resizes with 80px offset (keyboard height)
```

---

## Free User Gate Logic

```
User sends message
      ↓
Check: isPremiumUser && freeAiQuestionsRemaining > 0?
      ├─ YES → Continue to send
      │        Decrement counter
      │        Send to Gemini
      │
      └─ NO → Show PaywallScreen
              User must upgrade
```

---

## Error Handling

```
try {
  const result = await chat.sendMessage(...);

} catch (error) {
  // Could be:
  // • API key invalid
  // • Network error
  // • API rate limit
  // • Invalid message format

  Log error to console
  Show user-friendly error in chat
  Allow user to retry
}
```

---

## Performance Considerations

### Optimizations

- `FlatList` renders only visible messages (scrolling performance)
- `useRef` for flatListRef to avoid re-renders
- `isTyping` prevents multiple simultaneous API calls
- System prompt dynamically built (context-aware, not hardcoded)

### Potential Improvements

- Message pagination (load older messages as needed)
- Message search functionality
- Caching common responses
- Image support for health metrics
- Voice input

---

## File Dependencies

```
AIChatScreen.js depends on:
├── @google/generative-ai (SDK)
├── react-native (platform, navigation)
├── @expo/vector-icons (UI icons)
├── react-native-safe-area-context (safe area)
├── ../theme/theme.js (useTheme hook)
└── ../store/useHealthStore.js (Zustand store)

useHealthStore.js depends on:
├── zustand (state management)
├── @react-native-async-storage/async-storage (persistence)
```

---

## Testing Scenarios

### Scenario 1: Free User with Questions

```
Initial: freeAiQuestionsRemaining = 10
Action: Send 1 message
Result: Counter shows "9 Free Left"
```

### Scenario 2: Free User Out of Questions

```
Initial: freeAiQuestionsRemaining = 0
Action: Try to send message
Result: Redirected to PaywallScreen
```

### Scenario 3: Premium User

```
Initial: isPremiumUser = true
Action: Send unlimited messages
Result: No counter shown, no gate triggered
```

### Scenario 4: Dark Mode

```
Initial: isDarkMode = true, isPremiumUser = true
Action: View chat
Result: All colors use darkColors palette
```

### Scenario 5: App Restart

```
Initial: Chat with 5 messages
Action: Close app and reopen
Result: All 5 messages still visible (AsyncStorage)
```

---

## Configuration Reference

| Config            | Value            | Purpose                                         |
| ----------------- | ---------------- | ----------------------------------------------- |
| Model             | gemini-1.5-flash | Fast, efficient responses                       |
| Max Tokens        | 500              | Limits response length to ~3 paragraphs         |
| Temperature       | 0.7              | Balanced creativity (0=deterministic, 1=random) |
| KB Offset iOS     | 90               | Header height                                   |
| KB Offset Android | 80               | Keyboard height                                 |
| Free Questions    | 10               | Default quota per session                       |

---

**Architecture Last Updated:** April 29, 2026
**Status:** Production Ready ✅
