import { fetch as expoFetch } from 'expo/fetch';
import { Ionicons } from '@expo/vector-icons';
import OpenAI from 'openai';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

// 1. HARDCODE THE BASE URL: The OpenAI SDK will automatically append '/chat/completions' to this.
const EXPO_PUBLIC_NVIDIA_INVOKE_URL = 'https://integrate.api.nvidia.com/v1';
const EXPO_PUBLIC_NVIDIA_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
const EXPO_PUBLIC_NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

if (!EXPO_PUBLIC_NVIDIA_API_KEY) {
  console.warn("Missing EXPO_PUBLIC_NVIDIA_API_KEY in .env file");
}

// 2. INITIALIZE SDK WITH THE STRICT BASE URL
const openai = new OpenAI({
  apiKey: EXPO_PUBLIC_NVIDIA_API_KEY,
  baseURL: EXPO_PUBLIC_NVIDIA_INVOKE_URL,
  dangerouslyAllowBrowser: true,
  fetch: expoFetch,
});

const INITIAL_DOCTOR_GREETING = {
  // ... rest of your code remains exactly the same
  id: '1',
  text: "Hello. I am the HealthMate AI Doctor. I can help analyze symptoms and provide preliminary health insights. Please describe what you're experiencing.\n\n*Note: I am an AI, not a licensed physician. Always seek professional medical help for emergencies.*",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};



const AI_LOADING_STATES = [
  'Analyzing symptoms...',
  'Checking Causes...',
  'Reviewing Signs...',
  'Preparing insights...',
];

export default function AIDoctorScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { COLORS, FONTS } = useTheme();

  const {
    isPremiumUser,
    freeAiQuestionsRemaining,
    decrementAiQuestions,
    aiDoctorHistory,
    addDoctorMessage,
    age,
    gender,
    weightKg,
    heightCm,
  } = useHealthStore();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(AI_LOADING_STATES[0]);
  const [dotCount, setDotCount] = useState(1);

  const safeTopPadding =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 10
      : insets.top + 10;

  useEffect(() => {
    if (aiDoctorHistory.length === 0) {
      addDoctorMessage(INITIAL_DOCTOR_GREETING);
    }
  }, [aiDoctorHistory.length, addDoctorMessage]);

  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    let interval;
    if (isTyping) {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % AI_LOADING_STATES.length;
        setLoadingMessage(AI_LOADING_STATES[index]);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  const buildSystemPrompt = () =>
    `You are HealthMate AI Doctor, an evidence-based virtual health assistant.

CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. "NO asterisks (**), NO bold tags, NO hash symbols (#)". 
2. Use ALL CAPS for section headings (e.g., DISH NAME, DESCRIPTION, INGREDIENTS, INSTRUCTIONS, TIPS).
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.

Purpose:
  Patient Profile: ${age} years old, ${gender}, ${weightKg}kg, ${heightCm}cm.
Help users understand symptoms, possible causes, home care, prevention, and when medical attention is needed.
Use the user profile and health metrics provided.
Rules:
- Do not greet users or waste tokens.
- Begin immediately with useful information.
- Be concise by default (150-250 words).
- Expand only if the user asks for details.
- Explain medical terms in simple language.
- Mention confidence when uncertainty exists.
- Never claim a diagnosis with certainty.
- Present possible causes ranked by likelihood.
- Distinguish emergency symptoms from non-emergency symptoms.
Response structure:
POSSIBLE CAUSES:
- ...
HOME CARE TIPS:
• ...
PREVENTION:
• ...
See a doctor if:
• ...
Emergency warning signs:
• ...
MEDICATIONS:
Only suggest common OTC medications when appropriate.
Include standard adult dosage ranges.
Mention contraindications when known.
STATES:
"AI responses can make mistakes. Consult a healthcare professional before starting medications."
Emergency symptoms requiring immediate care:
- Chest pain
- Severe breathing difficulty
- Stroke symptoms
- Severe allergic reactions
- Heavy bleeding
- Loss of consciousness
- Suicidal thoughts
Avoid unnecessary greetings such as "Hello" or "How are you?".
Do not reveal chain of thought.
Use WHO and major guideline-based recommendations.
Recommend professional evaluation whenever uncertainty is high.


Communication Style:
Professional, practical and supportive.
- Avoid greetings, small talk and filler words.
- Start directly with useful information.
- Use bullet points and short sections.
- Default response length is medium (150-250 words).
- Provide detailed explanations only when requested.
- Use simple language suitable for non-medical users.
- Explain uncertainty when confidence is low.
- Never reveal chain of thought or internal reasoning.
- Do not invent information.
`;

  const callNvidiaDoctor = async (messages) => {
    if (!EXPO_PUBLIC_NVIDIA_API_KEY || !EXPO_PUBLIC_NVIDIA_INVOKE_URL || !EXPO_PUBLIC_NVIDIA_MODEL) {
      throw new Error('Missing API Configuration. Check environment variables.');
    }

    try {
      // Using the exact payload structure required by Nemotron
      const completion = await openai.chat.completions.create({
        model: EXPO_PUBLIC_NVIDIA_MODEL,
        messages: messages,
        temperature: 0.2, // Lower temp for clinical accuracy
        top_p: 0.7,
        max_tokens: 1040, // Adjusted from 16384 for faster mobile response
        chat_template_kwargs: { "enable_thinking": true },
        stream: false // Kept false for simpler state management in React Native
      });

      return (
        completion.choices[0]?.message?.content ||
        'Sorry, I could not generate a medical insight at this time.'
      );
    } catch (error) {
      throw new Error(
        error?.response?.data?.message || error?.message || 'NVIDIA API error'
      );
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();

    if (!isPremiumUser && freeAiQuestionsRemaining <= 0) {
      navigation.navigate('PaywallScreen');
      return;
    }

    if (!isPremiumUser) decrementAiQuestions();

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    addDoctorMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    setLoadingMessage(AI_LOADING_STATES[0]);

    requestAnimationFrame(() =>
      flatListRef.current?.scrollToEnd({ animated: true })
    );

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...aiDoctorHistory
          .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
          .map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        { role: 'user', content: userMessage.text },
      ];

      const assistantText = await callNvidiaDoctor(messages);

      addDoctorMessage({
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('AI Doctor API Error: ', error);
      addDoctorMessage({
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I am having trouble connecting to the medical database right now. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
      requestAnimationFrame(() =>
        flatListRef.current?.scrollToEnd({ animated: true })
      );
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.messageWrapperUser : styles.messageWrapperAI,
        ]}
      >
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.tertiary }]}>
            <Ionicons
              name="medkit"
              size={14}
              color={COLORS.card}
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isUser
              ? { backgroundColor: COLORS.tertiary }
              : {
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
              },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isUser
                  ? COLORS.card
                  : COLORS.textPrimary,
              },
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS.aiBackground }]}
      behavior='padding' enabled={true}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.aiBackground }}>
        {/* ── HEADER ── */}
        <View
          style={[
            styles.header,
            { paddingTop: safeTopPadding, borderBottomColor: COLORS.border },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text
              style={[
                styles.headerTitle,
                FONTS.sectionHeading,
                { color: COLORS.textPrimary },
              ]}
            >
              AI Doctor
            </Text>
            {!isPremiumUser && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: COLORS.tertiary }]}>
                  {freeAiQuestionsRemaining} FREE LEFT
                </Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── CHAT LIST ── */}
        <FlatList
          ref={flatListRef}
          data={aiDoctorHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (isTyping) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* ── TYPING INDICATOR ── */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.tertiary }]}>
              <Ionicons
                name="medkit"
                size={14}
                color={COLORS.card}
              />
            </View>
            <View
              style={[
                styles.aiBubble,
                {
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.tertiary}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: 14,
                    flexShrink: 1,
                  }}
                >
                  {loadingMessage}
                  {'.'.repeat(dotCount)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── INPUT DOCK ── */}
        <View style={[styles.inputDock, { backgroundColor: COLORS.aiBackground }]}>
          <View
            style={[
              styles.pillContainer,
              {
                backgroundColor: COLORS.inputField || COLORS.surface,
                borderColor: COLORS.border,
                marginBottom: Math.max(insets.bottom, 12),
                marginTop: 12,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder="Describe your symptoms..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={600}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? COLORS.tertiary : 'transparent',
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() ? COLORS.card : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  flatList: {
    flex: 1,
  },
  chatList: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageWrapperAI: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  inputDock: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'flex-end',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
});