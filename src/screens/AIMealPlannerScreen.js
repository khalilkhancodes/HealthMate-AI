import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
  const { COLORS, FONTS } = useTheme(themePreference);

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
  const [loadingMessage, setLoadingMessage] = useState(AI_LOADING_STATES[0]);
  const [dotCount, setDotCount] = useState(1);

  // Scroll and Copy Feedback States
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;

  useEffect(() => {
    if (aiMealPlannerHistory.length === 0) {
      addMealPlannerMessage(INITIAL_GREETING);
    }
  }, [aiMealPlannerHistory.length, addMealPlannerMessage]);

  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
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

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowScrollToTop(contentOffset.y > 200);
    const isAtBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < 150;
    setShowScrollToBottom(!isAtBottom);
  };

  const handleCopy = async (text, id) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (text) => {
    setInputText(text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const buildSystemPrompt = () =>
    `You are HealthMate AI Meal Planner.
CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. "NO asterisks (**), NO bold tags, NO hash symbols (#)". 
2. Use ALL CAPS for section headings.
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.
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
- Include Pakistani foods when appropriate.
Communication Style:
Professional, practical and supportive.`;

  const callNvidiaMealPlanner = async (messages) => {
    try {
      const response = await fetch('https://healthmate-backend-eta.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messages, max_tokens: 512, model: 'llama-3.3-70b-instruct' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected the request.');
      }

      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a meal plan at this time.';
    } catch (error) {
      throw new Error(error.message || 'Proxy connection failed');
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
    setLoadingMessage(AI_LOADING_STATES[0]);

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

      const responseText = await callNvidiaMealPlanner(messages);

      addMealPlannerMessage({
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.warn('AI Meal Planner API Error: ', error);
      addMealPlannerMessage({
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I am having trouble connecting to the culinary database right now. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
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
        <View style={styles.bubbleContainer}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
              isUser
                ? { backgroundColor: COLORS.primary }
                : { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
            ]}
          >
            <Text selectable={true} style={[styles.messageText, { color: isUser ? COLORS.card : COLORS.textPrimary }]}>
              {item.text}
            </Text>
          </View>

          <View style={[styles.actionRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
            <TouchableOpacity onPress={() => handleCopy(item.text, item.id)} style={styles.actionBtn}>
              <Ionicons 
                name={copiedId === item.id ? "checkmark-done" : "copy-outline"} 
                size={14} 
                color={copiedId === item.id ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={[styles.actionText, { color: copiedId === item.id ? COLORS.primary : COLORS.textMuted }]}>
                {copiedId === item.id ? "Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
            
            {isUser && (
              <TouchableOpacity onPress={() => handleEdit(item.text)} style={[styles.actionBtn, { marginLeft: 12 }]}>
                <Ionicons name="pencil-outline" size={14} color={COLORS.textMuted} />
                <Text style={[styles.actionText, { color: COLORS.textMuted }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* ── TYPING INDICATOR ── */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="restaurant" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={{ color: COLORS.textPrimary, fontSize: 14, flexShrink: 1 }}>
                  {loadingMessage}{'.'.repeat(dotCount)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.floatingNavContainer}>
          {showScrollToTop && (
            <TouchableOpacity 
              style={[styles.floatingBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]} 
              onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
            >
              <Ionicons name="arrow-up" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          {showScrollToBottom && (
            <TouchableOpacity 
              style={[styles.floatingBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.border, marginTop: 8 }]} 
              onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
            >
              <Ionicons name="arrow-down" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

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
              disabled={!inputText.trim() || isTyping}
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
  aiAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 24 },
  bubbleContainer: { flex: 1 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  typingContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-start' },
  inputDock: { paddingHorizontal: 16 },
  pillContainer: { flexDirection: 'row', borderRadius: 24, paddingHorizontal: 6, borderWidth: 1, alignItems: 'flex-end', minHeight: 48, paddingBottom: 6 },
  textInput: { flex: 1, minHeight: 36, maxHeight: 120, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, fontSize: 15, backgroundColor: 'transparent' },
  sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 4 },
  actionRow: { flexDirection: 'row', marginTop: 6, paddingHorizontal: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  actionText: { fontSize: 12, marginLeft: 4, fontWeight: '500' },
  floatingNavContainer: { position: 'absolute', bottom: 100, right: 16, alignItems: 'flex-end', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 4 },
});