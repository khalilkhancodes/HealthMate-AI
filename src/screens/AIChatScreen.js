import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const NVIDIA_INVOKE_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL;
const NVIDIA_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL;
const NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.warn("Missing EXPO_PUBLIC_NVIDIA_API_KEY in .env file");
}

const INITIAL_AI_GREETING = {
  id: '1',
  text: "Hi! I'm HealthMate AI, your personal wellness coach. I can see your daily health stats and give personalized advice. How can I help you reach your goals today?",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { COLORS, FONTS, isDark } = useTheme();

  const {
    isPremiumUser,
    freeAiQuestionsRemaining,
    decrementAiQuestions,
    aiChatHistory,
    addChatMessage,
    dailySteps,
    stepGoal,
    waterIntake,
    sleepDuration,
  } = useHealthStore();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const safeTopPadding =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 10
      : insets.top + 10;

  // ─── Initial greeting ─────────────────────────────────────────────────────
  useEffect(() => {
    if (aiChatHistory.length === 0) {
      addChatMessage(INITIAL_AI_GREETING);
    }
  }, [aiChatHistory.length, addChatMessage]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const buildSystemPrompt = () =>
    `You are HealthMate AI, an expert health coach.
The user's current stats today:
- Steps: ${dailySteps} / ${stepGoal}
- Water: ${waterIntake}ml
- Sleep: ${sleepDuration} hours
Keep responses under 3 short paragraphs. Be highly encouraging. Use the stats above to give personalized advice.`;

  const callNvidiaChat = async (messages) => {
    if (!NVIDIA_INVOKE_URL || !NVIDIA_API_KEY) {
      throw new Error('Missing API Configuration. Check environment variables.');
    }

    const headers = {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const payload = {
      model: NVIDIA_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.70,
      top_p: 0.90,
      stream: false,
    };

    try {
      const response = await axios.post(NVIDIA_INVOKE_URL, payload, { headers });
      return (
        response.data?.choices?.[0]?.message?.content ||
        'Sorry, I could not generate a response.'
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

    addChatMessage(userMessage);
    setInputText('');
    setIsTyping(true);

    requestAnimationFrame(() =>
      flatListRef.current?.scrollToEnd({ animated: true })
    );

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...aiChatHistory
          .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
          .map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        { role: 'user', content: userMessage.text },
      ];

      const assistantText = await callNvidiaChat(messages);

      addChatMessage({
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('AI API Error: ', error);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I am having trouble connecting to the server right now. Please try again.',
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

  // ─── Render message ───────────────────────────────────────────────────────
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
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
            <Ionicons
              name="sparkles"
              size={14}
              color={COLORS.onPrimary || '#0B1326'}
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isUser
              ? { backgroundColor: COLORS.primary }
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
                  ? COLORS.onPrimary || '#0B1326'
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
      style={[styles.container, { backgroundColor: COLORS.aiBackground}]}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              HealthMate AI
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
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>
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
          data={aiChatHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* ── TYPING INDICATOR ── */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons
                name="sparkles"
                size={14}
                color={COLORS.onPrimary || '#0B1326'}
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
              <ActivityIndicator size="small" color={COLORS.textMuted} />
            </View>
          </View>
        )}

        {/* ── INPUT DOCK ── */}
        <View
          style={[
            styles.inputDock,
            { backgroundColor: COLORS.aiBackground },
          ]}
        >
          <View
            style={[
              styles.pillContainer,
              {
                backgroundColor: COLORS.inputField || COLORS.surface,
                borderColor: COLORS.border,
                marginBottom: Math.max(insets.bottom, 22),
                marginTop: Math.max(insets.bottom, 12),
                // paddingTop: Math.max(insets.bottom, 22),
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder="Ask me anything..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? COLORS.primary
                    : 'transparent',
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  inputText.trim()
                    ? COLORS.onPrimary || '#0B1326'
                    : COLORS.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </View>

      </View>
      </TouchableWithoutFeedback>
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
    paddingBottom: 8,
    marginBottom: -28,
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'flex-end',
    minHeight: 48,
  },  textInput: {
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
  },
});