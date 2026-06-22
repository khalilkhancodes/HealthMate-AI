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

const NVIDIA_INVOKE_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL || 'https://integrate.api.nvidia.com/v1';
const MEAL_PLANNER_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MEAL_PLANNER_MODEL || 'meta/llama-3.1-70b-instruct';
// Reusing the general API key, but you can create a specific one if needed
const API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

if (!API_KEY) {
  console.warn("Missing EXPO_PUBLIC_NVIDIA_API_KEY in .env file");
}

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: NVIDIA_INVOKE_URL,
  dangerouslyAllowBrowser: true,
  fetch: expoFetch, // Use Expo's fetch for better streaming support in React Native 
});

const INITIAL_GREETING = {
  id: '1',
  text: "Welcome to the AI Meal Planner! 🥗\n\nI have access to your daily calorie goals and physical profile. Tell me your dietary preferences, allergies, or what ingredients you have in your fridge, and I'll generate a personalized meal plan for you.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

const AI_LOADING_STATES = [
  'Building Meals...',
  'Planning Week...',
  'Balancing Nutrition...',
  'Preparing Menu...',
];

export default function AIMealPlannerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const themePreference = useHealthStore((s) => s.themePreference);
  const { COLORS, FONTS, isDark } = useTheme(themePreference);

  const {
    isPremiumUser,
    freeAiQuestionsRemaining,
    decrementAiQuestions,
    aiMealPlannerHistory,
    addMealPlannerMessage,
    weightKg,
    targetWeightKg,
    primaryGoal,
    calorieGoal,
    activityLevel
  } = useHealthStore();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Real-time Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;

  useEffect(() => {
    if (aiMealPlannerHistory.length === 0) {
      addMealPlannerMessage(INITIAL_GREETING);
    }
  }, [aiMealPlannerHistory.length, addMealPlannerMessage]);


  const buildSystemPrompt = () =>
    `You are HealthMate AI Meal Planner.
CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. "NO asterisks (**), NO bold tags, NO hash symbols (#)". 
2. Use ALL CAPS for section headings (e.g., WEEKLY MEAL PLAN, MONDAY, DAYS NAMES, ADVANTAGES AND OTHER HEADINGS REQUIRED BY USER).
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.

Create personalized weekly meal plans.
Use:
- Age
- Weight
- Height
- Activity level
- Goal
- BMI
- BMR
- Country

Goals:
  - Current Weight: ${weightKg}kg
  - Target Weight: ${targetWeightKg}kg
  - Activity Level: ${activityLevel}
  - Primary Goal: ${primaryGoal}
  - Daily Calorie Target: ${calorieGoal} kcal
Requirements:
- Weekly meal plan.
- Breakfast, lunch, dinner and snacks.
- Estimate calories and protein content.
- Suggest affordable foods.
- Include Pakistani foods when appropriate.
- Explain advantages of following the plan.
- Explain expected results.
- Mention hydration.

Format:
WEEKLY MEAL PLAN
MONDAY
- Breakfast:
...
- Lunch:
...
- Dinner:
...
- Daily Calories:
...
ADVANTAGES OF THIS PLAN:
• ...
EXPECTED RESULTS:
• ...
HEALTH ALTERNATIVES TO COMMON INGREDIENTS:
• ...


Communication Style:
Professional, practical and supportive.
- Avoid greetings, small talk and filler words.
- Start directly with useful information.
- Default response length is medium (150-250 words).
- Provide detailed explanations only when requested.
- Use simple language suitable for non-medical users.
- Explain uncertainty when confidence is low.
- Never reveal chain of thought or internal reasoning.
- Do not invent information.
`;

  const callNvidiaMealPlanner = async (messages) => {
    if (!API_KEY) throw new Error('Missing API Configuration.');

    try {
      const stream = await openai.chat.completions.create({
        model: MEAL_PLANNER_MODEL,
        messages: messages,
        temperature: 0.5, // Slightly higher than the doctor for culinary creativity
        top_p: 0.9,
        max_tokens: 1024,
        stream: true, // Enables real-time typing
      });

      return stream;
    } catch (error) {
      throw new Error(error?.response?.data?.message || error?.message || 'NVIDIA API error');
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

    addMealPlannerMessage(userMessage);
    setInputText('');
    setIsTyping(true);

    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...aiMealPlannerHistory
          .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
          .map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        { role: 'user', content: userMessage.text },
      ];

      setIsTyping(false);
      setIsStreaming(true);
      setStreamingMessage('');

      const stream = await callNvidiaMealPlanner(messages);
      let accumulatedText = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          accumulatedText += content;
          setStreamingMessage(accumulatedText);
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }

      setIsStreaming(false);
      setStreamingMessage('');

      addMealPlannerMessage({
        id: (Date.now() + 1).toString(),
        text: accumulatedText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      setIsStreaming(false);
      setIsTyping(false);
      console.warn('AI Meal Planner API Error: ', error);
      addMealPlannerMessage({
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I am having trouble connecting to the culinary database right now. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="restaurant" size={14} color={COLORS.card} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isUser
              ? { backgroundColor: COLORS.primary }
              : { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? COLORS.card : COLORS.textPrimary }]}>
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
        <View style={[styles.header, { paddingTop: safeTopPadding, borderBottomColor: COLORS.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
              AI Meal Planner
            </Text>
            {!isPremiumUser && (
              <View style={[styles.badge, { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }]}>
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
          data={aiMealPlannerHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {/* ── REAL-TIME STREAMING BUBBLE ── */}
        {isStreaming && (
          <View style={[styles.messageWrapper, styles.messageWrapperAI, { paddingHorizontal: 16 }]}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="restaurant" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}>
              <Text style={[styles.messageText, { color: COLORS.textPrimary }]}>
                {streamingMessage}
                <Text style={{ color: COLORS.primary }}> ▍</Text>
              </Text>
            </View>
          </View>
        )}

        {/* ── TYPING INDICATOR (Short delay before stream starts) ── */}
        {isTyping && !isStreaming && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="restaurant" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 16 }]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}

        {/* ── INPUT DOCK ── */}
        <View style={[styles.inputDock, { backgroundColor: COLORS.aiBackground }]}>
          <View style={[styles.pillContainer, { backgroundColor: COLORS.inputField || COLORS.surface, borderColor: COLORS.border, marginBottom: Math.max(insets.bottom, 12), marginTop: 12 }]}>
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder="E.g., High protein vegetarian dinner..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={600}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? COLORS.primary : 'transparent' }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping || isStreaming}
            >
              <Ionicons name="arrow-up" size={20} color={inputText.trim() ? COLORS.card : COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', width: 200, textAlign: 'center' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  flatList: { flex: 1 },
  chatList: { padding: 16 },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperAI: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  typingContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-start' },
  inputDock: { paddingHorizontal: 16 },
  pillContainer: { flexDirection: 'row', borderRadius: 24, paddingHorizontal: 6, borderWidth: 1, alignItems: 'flex-end', minHeight: 48, paddingBottom: 6 },
  textInput: { flex: 1, minHeight: 36, maxHeight: 120, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, fontSize: 15, backgroundColor: 'transparent' },
  sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 4 },
});