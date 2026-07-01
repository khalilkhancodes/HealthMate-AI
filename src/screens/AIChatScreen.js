import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
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
import { useKeyboardPadding } from '../hooks/useKeyboardPadding';

const INITIAL_AI_GREETING = {
  id: '1',
  text: "Hi! I'm HealthMate AI, your personal wellness coach. I can see your daily health stats and give personalized advice. How can I help you reach your goals today?",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

const AI_LOADING_STATES = [
  'Thinking...',
  'Analyzing your data...',
  'Reviewing Health...',
  'Reviewing Progress...',
  'Preparing Insights...',
];

const STREAMING_BUBBLE_ID = 'streaming-bubble';

// ─── Rich Text Renderer ───────────────────────────────────────────────────────
const RichAIText = ({ text, colors }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 6 }} />;

        const isHeading = /^[A-Z][A-Z\s:|-]{3,}$/.test(trimmed.replace(/:$/, ''));
        if (isHeading) {
          return (
            <View key={i} style={styles.richHeadingRow}>
              <View style={[styles.richHeadingAccent, { backgroundColor: colors.primary }]} />
              <Text style={[styles.richHeading, { color: colors.primary }]}>{trimmed}</Text>
            </View>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[-•]\s+/, '');
          const kvMatch = content.match(/^(.+?):\s*(.+)$/);
          if (kvMatch) {
            return (
              <View key={i} style={styles.richBulletRow}>
                <View style={[styles.richBulletDot, { backgroundColor:colors.primary }]} />
                <Text style={[styles.richBulletText, { color: colors.textPrimary }]}>
                  <Text style={[styles.richBulletKey, { color: colors.textPrimary }]}>{kvMatch[1]}: </Text>
                  <Text style={{ color: colors.textSecondary || colors.textMuted }}>{kvMatch[2]}</Text>
                </Text>
              </View>
            );
          }
          return (
            <View key={i} style={styles.richBulletRow}>
              <View style={[styles.richBulletDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.richBulletText, { color: colors.textPrimary }]}>{content}</Text>
            </View>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <View key={i} style={styles.richBulletRow}>
              <View style={[styles.richNumBadge, { backgroundColor:  colors.primary + '22' }]}>
                <Text style={[styles.richNumText, { color: colors.primary }]}>{numMatch[1]}</Text>
              </View>
              <Text style={[styles.richBulletText, { color: colors.textPrimary }]}>{numMatch[2]}</Text>
            </View>
          );
        }

        const topLevelKV = trimmed.match(/^([A-Za-z][^:]{1,30}):\s*(.+)$/);
        if (topLevelKV) {
          return (
            <Text key={i} style={[styles.richBody, { color: colors.textPrimary }]}>
              <Text style={[styles.richInlineKey, { color: colors.textPrimary }]}>{topLevelKV[1]}: </Text>
              <Text style={{ color: colors.textSecondary || colors.textMuted }}>{topLevelKV[2]}</Text>
            </Text>
          );
        }

        return (
          <Text key={i} style={[styles.richBody, { color: colors.textPrimary }]}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { keyboardPadding, isKeyboardVisible } = useKeyboardPadding(flatListRef);
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
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(AI_LOADING_STATES[0]);
  const [dotCount, setDotCount] = useState(1);
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [inputDockHeight, setInputDockHeight] = useState(80);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const editPairRef = useRef({});
  const isNearBottomRef = useRef(true);

  const accentColor = COLORS.primary;
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;
  
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

  const listData = isStreaming
    ? [
        ...aiChatHistory,
        {
          id: STREAMING_BUBBLE_ID,
          text: streamingText,
          sender: 'ai',
          isStreaming: true,
          timestamp: new Date().toISOString(),
        },
      ]
    : aiChatHistory;
  
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollToTop(contentOffset.y > 200);
    setShowScrollToBottom(distanceFromBottom > 150);
    isNearBottomRef.current = distanceFromBottom < 150;
  };

  const scrollToBottomIfNear = () => {
    if (isNearBottomRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  };

  const handleCopy = async (text, id) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (item) => {
    const history = aiChatHistory;
    const userIndex = history.findIndex((m) => m.id === item.id);
    const nextMsg = history[userIndex + 1];
    const pairedAiId = nextMsg && nextMsg.sender === 'ai' ? nextMsg.id : null;
    setEditingMessageId(item.id);
    if (pairedAiId) editPairRef.current[item.id] = pairedAiId;
    setInputText(item.text);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

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

  const callAPIWithStreaming = async (messages, onChunk) => {
    const response = await fetch('https://healthmate-backend-eta.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, stream: true, max_tokens: 400, model: 'meta/llama-3.1-8b-instruct' }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server rejected the request.');
    
    const fullText = data.choices?.[0]?.message?.content || 'Sorry, I could not generate an insight at this time.';
    
    const words = fullText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      onChunk(accumulated);
      const delay = words[i].endsWith('.') || words[i].endsWith('\n') ? 30 : 12;
      await new Promise((r) => setTimeout(r, delay));
    }
    return fullText;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    
    if (!isPremiumUser && freeAiQuestionsRemaining <= 0) {
      navigation.navigate('PaywallScreen');
      return;
    }
    
    const isEdit = !!editingMessageId;
    if (!isPremiumUser && !isEdit) decrementAiQuestions();
    
    const messageId = editingMessageId || Date.now().toString();
    const aiResponseId = editPairRef.current[messageId] || (Date.now() + 1).toString();
    
    const userMessage = {
      id: messageId,
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    if (isEdit) {
      useHealthStore.getState().updateChatMessage?.(messageId, userMessage);
    } else {
      addChatMessage(userMessage);
    }
    
    setInputText('');
    setEditingMessageId(null);
    setIsTyping(true);
    setIsStreaming(false);
    setStreamingText('');
    setLoadingMessage(AI_LOADING_STATES[0]);
    isNearBottomRef.current = true;
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ...aiChatHistory
          .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
          .filter((msg) => msg.id !== messageId && msg.id !== aiResponseId)
          .map((msg) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: userMessage.text },
      ];
      
      let finalText = '';
      await callAPIWithStreaming(messages, (chunk) => {
        if (!isStreaming) setIsStreaming(true);
        setIsTyping(false);
        setStreamingText(chunk);
        finalText = chunk;
        scrollToBottomIfNear();
      });
      
      setIsStreaming(false);
      setStreamingText('');
      
      const aiMessage = {
        id: aiResponseId,
        text: finalText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      
      if (isEdit && editPairRef.current[messageId]) {
        useHealthStore.getState().updateChatMessage?.(aiResponseId, aiMessage);
      } else {
        addChatMessage(aiMessage);
        editPairRef.current[messageId] = aiResponseId;
      }
    } catch (error) {
      console.warn('AI API Error: ', error);
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingText('');
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
    const isCurrentlyEditing = editingMessageId === item.id;
    const isLiveStreamingBubble = item.isStreaming;

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: accentColor }]}>
            <Ionicons name="sparkles" size={14} color={COLORS.onPrimary || '#0B1326'} />
          </View>
        )}
        <View style={styles.bubbleContainer}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
              isUser
                ? { backgroundColor: isCurrentlyEditing ? accentColor + 'CC' : accentColor }
                : { 
                    backgroundColor: COLORS.surface, 
                    borderWidth: 1, 
                    borderColor: isLiveStreamingBubble ? accentColor + '44' : COLORS.border 
                  },
            ]}
          >
            {isUser ? (
              <Text selectable={true} style={[styles.messageText, { color: COLORS.onPrimary || '#0B1326' }]}>
                {item.text}
              </Text>
            ) : (
              <View>
                <RichAIText text={item.text} colors={COLORS} />
                {isLiveStreamingBubble && (
                  <Text style={{ color: accentColor, fontWeight: '700', fontSize: 16 }}>▌</Text>
                )}
              </View>
            )}
          </View>
          
          {!isLiveStreamingBubble && (
            <View style={[styles.actionRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
              <TouchableOpacity onPress={() => handleCopy(item.text, item.id)} style={styles.actionBtn}>
                <Ionicons 
                  name={copiedId === item.id ? "checkmark-done" : "copy-outline"} 
                  size={14} 
                  color={copiedId === item.id ? accentColor : COLORS.textMuted} 
                />
                <Text style={[styles.actionText, { color: copiedId === item.id ? accentColor : COLORS.textMuted }]}>
                  {copiedId === item.id ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
              
              {isUser && (
                <TouchableOpacity 
                  onPress={() => handleEdit(item)} 
                  style={[styles.actionBtn, { marginLeft: 12 }]}
                  disabled={isTyping || isStreaming}
                >
                  <Ionicons 
                    name={isCurrentlyEditing ? "pencil" : "pencil-outline"} 
                    size={14} 
                    color={isCurrentlyEditing ? accentColor : COLORS.textMuted} 
                  />
                  <Text style={[styles.actionText, { color: isCurrentlyEditing ? accentColor : COLORS.textMuted }]}>
                    {isCurrentlyEditing ? "Editing" : "Edit"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isTyping) return null;
    return (
      <View style={styles.typingContainer}>
        <View style={[styles.aiAvatar, { backgroundColor: accentColor }]}>
          <Ionicons name="sparkles" size={14} color={COLORS.onPrimary || '#0B1326'} />
        </View>
        <View style={[styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={accentColor} style={{ marginRight: 10 }} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 14, flexShrink: 1 }}>
              {loadingMessage}{'.'.repeat(dotCount)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: COLORS.aiBackground, paddingBottom: keyboardPadding }]}>
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
                <Text style={[styles.badgeText, { color: accentColor }]}>{freeAiQuestionsRemaining} FREE LEFT</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        {/* CHAT LIST */}
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={[styles.chatList, { paddingBottom: inputDockHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          ListFooterComponent={renderFooter}
          scrollEventThrottle={16}
        />

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
        <View 
          style={[styles.inputDock, { backgroundColor: COLORS.aiBackground }]}
          onLayout={(e) => setInputDockHeight(e.nativeEvent.layout.height)}
        >
          <View style={[
            styles.pillContainer, 
            { 
              backgroundColor: COLORS.inputField || COLORS.surface, 
              borderColor: editingMessageId ? accentColor : COLORS.border, 
              marginBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12), 
              marginTop: Math.max(insets.bottom, 12) 
            }
          ]}>
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder={editingMessageId ? 'Editing message...' : "Ask me anything..."}
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            {editingMessageId && (
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => { setEditingMessageId(null); setInputText(''); }}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? accentColor : 'transparent' }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping || isStreaming}
            >
              <Ionicons name="arrow-up" size={20} color={inputText.trim() ? (COLORS.onPrimary || '#0B1326') : COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
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
  chatList: { padding: 16 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start', maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperAI: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 2, flexShrink: 0 },
  bubbleContainer: { flex: 1 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
  aiBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 20 },
  messageText: { fontSize: 15, lineHeight: 22 },
  actionRow: { flexDirection: 'row', marginTop: 6, paddingHorizontal: 4, width: '100%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  actionText: { fontSize: 12, marginLeft: 4, fontWeight: '500' },
  floatingNavContainer: { position: 'absolute', bottom: 100, right: 16, alignItems: 'flex-end', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 4 },
  typingContainer: { paddingHorizontal: 16, flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  inputDock: { paddingHorizontal: 16, paddingTop: 4 },
  pillContainer: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 6, minHeight: 48, paddingBottom: 6 },
  textInput: { flex: 1, minHeight: 36, maxHeight: 120, paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 8 : 4, paddingBottom: Platform.OS === 'ios' ? 8 : 4, fontSize: 15 },
  cancelEditBtn: { width: 28, height: 36, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4, alignSelf: 'flex-end', flexShrink: 0 },
  richHeadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 },
  richHeadingAccent: { width: 3, height: 14, borderRadius: 2, marginRight: 8 },
  richHeading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  richBulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3, paddingLeft: 4 },
  richBulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: 10, flexShrink: 0 },
  richBulletText: { fontSize: 14, lineHeight: 21, flex: 1 },
  richBulletKey: { fontWeight: '700' },
  richNumBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1, flexShrink: 0 },
  richNumText: { fontSize: 11, fontWeight: '800' },
  richBody: { fontSize: 14, lineHeight: 21, marginVertical: 2 },
  richInlineKey: { fontWeight: '700' },
});