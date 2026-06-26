import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // NEW IMPORT
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

const INITIAL_AI_GREETING = {
  id: '1',
  text: "Hi! I'm HealthMate AI, your personal wellness coach. I can see your daily health stats and give personalized advice. How can I help you reach your goals today?",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { COLORS, FONTS } = useTheme();
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
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your health data...');
  
  // NEW STATE: Scroll tracking
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [copiedId, setCopiedId] = useState(null); // Visual feedback for copy
  
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;

  const AI_LOADING_STATES = [
    'Thinking...',
    'Analyzing your data...',
    'Reviewing Health...',
    'Reviewing Progress...',
    'Preparing Insights...',
  ];
  const [dotCount, setDotCount] = useState(1);
  
  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => setDotCount(prev => (prev % 3) + 1), 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    if (aiChatHistory.length === 0) addChatMessage(INITIAL_AI_GREETING);
  }, [aiChatHistory.length, addChatMessage]);

  useEffect(() => {
    let interval;
    if (isTyping) {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % AI_LOADING_STATES.length;
        setLoadingMessage(AI_LOADING_STATES[index]);
      }, 1200);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTyping]);

  // ─── NEW: SCROLL, COPY & EDIT HANDLERS ────────────────────────────────────
  
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // Show 'Top' button if scrolled down more than 200px
    setShowScrollToTop(contentOffset.y > 200);
    
    // Show 'Bottom' button if user is scrolled up away from the bottom by more than 150px
    const isAtBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < 150;
    setShowScrollToBottom(!isAtBottom);
  };

  const handleCopy = async (text, id) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Clear checkmark after 2s
  };

  const handleEdit = (text) => {
    setInputText(text);
    // Optional: You could scroll to bottom here automatically
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // ──────────────────────────────────────────────────────────────────────────

  const buildSystemPrompt = () =>
    `You are HealthMate AI Health Assistant.
CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. "NO asterisks (**), NO bold tags, NO hash symbols (#)". 
2. Use ALL CAPS for section headings.
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.
Your role is lifestyle optimization.
Use user data including:
- Steps: ${dailySteps} / ${stepGoal}
- Water: ${waterIntake}ml
- Sleep: ${sleepDuration} hours
Rules:
- Avoid greetings.
- Give practical advice.
- Keep responses concise.
- Personalize recommendations using available metrics.
Use metric units. Prefer foods commonly available globally with emphasis on Pakistan.
Communication Style: Professional, practical and supportive.`;

  const callNvidiaChat = async (messages) => {
    try {
      const response = await fetch('https://healthmate-backend-eta.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, stream: true, max_tokens: 400, model: 'meta/llama-3.2-90b-vision-instruct' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server rejected the request.');
      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate an insight at this time.';
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
    
    addChatMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    setLoadingMessage(AI_LOADING_STATES[0]);
    
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...aiChatHistory
          .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
          .map((msg) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
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
        text: 'Sorry, I am having trouble connecting to the secure server right now. Please try again.',
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
            <Ionicons name="sparkles" size={14} color={COLORS.onPrimary || '#0B1326'} />
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
            {/* Native Text Selection Enabled */}
            <Text selectable={true} style={[styles.messageText, { color: isUser ? COLORS.onPrimary || '#0B1326' : COLORS.textPrimary }]}>
              {item.text}
            </Text>
          </View>
          
          {/* Action Row: Copy & Edit */}
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
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.aiBackground }]} behavior='padding' enabled={true}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: COLORS.aiBackground }}>
          {/* HEADER */}
          <View style={[styles.header, { paddingTop: safeTopPadding, borderBottomColor: COLORS.border }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>HealthMate AI</Text>
              {!isPremiumUser && (
                <View style={[styles.badge, { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>{freeAiQuestionsRemaining} FREE LEFT</Text>
                </View>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>
          
          {/* CHAT LIST */}
          <FlatList
            ref={flatListRef}
            data={aiChatHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.flatList}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            onScroll={handleScroll}
            scrollEventThrottle={16} // Controls onScroll firing rate for performance
            onContentSizeChange={() => {
              if (isTyping) flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
          
          {/* TYPING INDICATOR */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="sparkles" size={14} color={COLORS.onPrimary || '#0B1326'} />
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

          {/* FLOATING SCROLL BUTTONS */}
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
          
          {/* INPUT DOCK */}
          <View style={[styles.inputDock, ]}>
            <View style={[styles.pillContainer, { backgroundColor: COLORS.inputField || COLORS.surface, borderColor: COLORS.border, marginBottom: Math.max(insets.bottom, 22), marginTop: Math.max(insets.bottom, 12) }]}>
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
                style={[styles.sendButton, { backgroundColor: inputText.trim() ? COLORS.primary : 'transparent' }]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
              >
                <Ionicons name="arrow-up" size={20} color={inputText.trim() ? COLORS.onPrimary || '#0B1326' : COLORS.textMuted} />
              </TouchableOpacity>
            </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  flatList: { flex: 1 },
  chatList: { padding: 16, paddingBottom: 24 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperAI: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 24 },
  bubbleContainer: { maxWidth: '85%' },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
  aiBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 20 },
  messageText: { fontSize: 15, lineHeight: 22 },
  
  // New Action Row Styles
  actionRow: { flexDirection: 'row', marginTop: 6, paddingHorizontal: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  actionText: { fontSize: 12, marginLeft: 4, fontWeight: '500' },
  
  // New Floating Scroll Button Styles
  floatingNavContainer: { position: 'absolute', bottom: 100, right: 16, alignItems: 'flex-end', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 4 },

  typingContainer: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end' },
  inputDock: { paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: 'transparent', backgroundColor: "#ffffff" },
  pillContainer: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 2, paddingBottom: 10 },
  textInput: { flex: 1, maxHeight: 100, minHeight: 24, fontSize: 15, paddingTop: Platform.OS === 'ios' ? 8 : 4, paddingBottom: Platform.OS === 'ios' ? 8 : 4 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8, alignSelf: 'flex-end' },
});