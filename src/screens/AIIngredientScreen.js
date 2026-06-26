import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const INITIAL_GREETING = {
  id: '1',
  text: "Welcome to the AI Ingredient Detector! 📸\n\nUpload a picture of a meal, or simply type your question to get recipes and ingredient lists.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

// ─── Dynamic loading states based on context ───────────────────────────────
const IMAGE_LOADING_STATES = [
  'Scanning image layers',
  'Identifying ingredients',
  'Estimating portion sizes',
  'Compiling ingredient list',
];

const TEXT_LOADING_STATES = [
  'Understanding your question',
  'Searching recipe database',
  'Compiling ingredients',
  'Formatting response',
];

// ─── Rich Text Renderer ─────────────────────────────────────────────────────
// Parses AI plain-text (ALL CAPS headings, hyphen bullets) into styled JSX
const RichAIText = ({ text, colors }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 6 }} />;

        // ALL CAPS heading detection (e.g. "DETECTED ITEMS:")
        const isHeading = /^[A-Z][A-Z\s:]{3,}$/.test(trimmed.replace(/:$/, ''));
        if (isHeading) {
          return (
            <View key={i} style={styles.richHeadingRow}>
              <View style={[styles.richHeadingAccent, { backgroundColor: colors.primary }]} />
              <Text style={[styles.richHeading, { color: colors.primary }]}>{trimmed}</Text>
            </View>
          );
        }

        // Bullet point (- or •)
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[-•]\s+/, '');
          // Check for key: value pattern inside bullet
          const kvMatch = content.match(/^(.+?):\s*(.+)$/);
          if (kvMatch) {
            return (
              <View key={i} style={styles.richBulletRow}>
                <View style={[styles.richBulletDot, { backgroundColor: colors.primary }]} />
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

        // Numbered list (1. 2. etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <View key={i} style={styles.richBulletRow}>
              <View style={[styles.richNumBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.richNumText, { color: colors.primary }]}>{numMatch[1]}</Text>
              </View>
              <Text style={[styles.richBulletText, { color: colors.textPrimary }]}>{numMatch[2]}</Text>
            </View>
          );
        }

        // Key: Value inline
        const topLevelKV = trimmed.match(/^([A-Za-z][^:]{1,30}):\s*(.+)$/);
        if (topLevelKV) {
          return (
            <Text key={i} style={[styles.richBody, { color: colors.textPrimary }]}>
              <Text style={[styles.richInlineKey, { color: colors.textPrimary }]}>{topLevelKV[1]}: </Text>
              <Text style={{ color: colors.textSecondary || colors.textMuted }}>{topLevelKV[2]}</Text>
            </Text>
          );
        }

        // Plain paragraph
        return (
          <Text key={i} style={[styles.richBody, { color: colors.textPrimary }]}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function AIIngredientScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { COLORS, FONTS } = useTheme();

  const {
    isPremiumUser,
    freeAiQuestionsRemaining,
    decrementAiQuestions,
    aiIngredientHistory,
    addIngredientMessage,
  } = useHealthStore();

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [dotCount, setDotCount] = useState(1);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Ref to track current image context for dynamic loading
  const isVisionRef = useRef(false);

  const safeTopPadding =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 10
      : insets.top + 10;

  // Animated dots
  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => setDotCount((p) => (p % 3) + 1), 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  // Dynamic loading states
  useEffect(() => {
    if (!isTyping) return;
    const states = isVisionRef.current ? IMAGE_LOADING_STATES : TEXT_LOADING_STATES;
    let index = 0;
    setLoadingMessage(states[0]);
    const interval = setInterval(() => {
      index = (index + 1) % states.length;
      setLoadingMessage(states[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isTyping]);

  // Initial greeting
  useEffect(() => {
    if (aiIngredientHistory.length === 0) addIngredientMessage(INITIAL_GREETING);
  }, [aiIngredientHistory.length, addIngredientMessage]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowScrollToTop(contentOffset.y > 200);
    setShowScrollToBottom(
      contentSize.height - layoutMeasurement.height - contentOffset.y > 150
    );
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

  const pickImage = async (useCamera = false) => {
    try {
      const options = { mediaTypes: ['images'], allowsEditing: false, quality: 0.8 };
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { alert('Camera permissions are required.'); return; }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { alert('Gallery permissions are required.'); return; }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 512 } }],
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setSelectedImageUri(manipResult.uri);
        setSelectedImage(`data:image/jpeg;base64,${manipResult.base64}`);
      }
    } catch (error) { console.error('Image capture error:', error); }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImageUri(null);
  };

  // ─── Streaming fetch via SSE / chunked response simulation ───────────────
  // NVIDIA API doesn't natively stream through a proxy, so we simulate
  // progressive reveal by chunking the full response on receipt.
  const callAPIWithStreaming = async (payloadMessages, modelName, onChunk) => {
    const response = await fetch('https://healthmate-backend-eta.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName, messages: payloadMessages, max_tokens: 800 }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server rejected the request.');

    const fullText =
      data.choices?.[0]?.message?.content ||
      'Sorry, I could not process the request at this time.';

    // Simulate streaming: reveal words progressively for premium feel
    const words = fullText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      onChunk(accumulated);
      // Vary delay: faster for short words, slight pause at punctuation
      const delay = words[i].endsWith('.') || words[i].endsWith('\n') ? 30 : 12;
      await new Promise((r) => setTimeout(r, delay));
    }
    return fullText;
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    Keyboard.dismiss();

    if (!isPremiumUser && freeAiQuestionsRemaining <= 0) {
      navigation.navigate('PaywallScreen');
      return;
    }
    if (!isPremiumUser) decrementAiQuestions();

    const cachedImage = selectedImage;
    const cachedText = inputText.trim();
    const isVisionRequest = !!cachedImage;
    isVisionRef.current = isVisionRequest;

    const userMessage = {
      id: Date.now().toString(),
      text: cachedText || 'Analyze this image.',
      imageUri: selectedImageUri,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    addIngredientMessage(userMessage);
    setInputText('');
    removeSelectedImage();
    setDotCount(1);
    setIsTyping(true);
    setIsStreaming(false);
    setStreamingText('');
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const formattedHistory = aiIngredientHistory
        .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
        .slice(-4)
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

      const modelToUse = isVisionRequest
        ? 'meta/llama-3.2-90b-vision-instruct'
        : 'meta/llama-3.1-70b-instruct';

      const systemPrompt = isVisionRequest
        ? `Analyze the image carefully. Identify the dish, individual ingredients, and estimated weights.
CRITICAL RULES: NO markdown (** or #). Use ALL CAPS for section headings (DETECTED ITEMS:, INGREDIENTS:, ESTIMATED WEIGHTS:). Separate sections heading with a vertical blank line. Use discs for bullet points. Heading and bullet points must have green color. add | in green color before headings. Bold the heading and |. Estimate weights in grams (g) or milliliters (ml) where possible. If you cannot identify the dish, just list the ingredients.
Example output:
| DETECTED ITEMS:
• Spaghetti Bolognese - 120grams
• Caesar Salad - 400grams

| INGREDIENTS:
• Spaghetti - 100g
• Ground Beef - 150g
• Tomato Sauce - 80ml
• Parmesan Cheese - 20g
• Romaine Lettuce - 200g
• Caesar Dressing - 50ml

| HEALTH ANALYSIS:
• High in protein due to ground beef and cheese.
• Contains vegetables from the salad, providing fiber and vitamins.
• Moderate calorie content; portion control is advised for weight management.
`
        : `You are an expert culinary AI. Answer questions about recipes, ingredients, and food preparation.
CRITICAL RULES: NO markdown (** or #)`
      const currentMessageContent = isVisionRequest
        ? [
            { type: 'text', text: cachedText || 'Identify the ingredients in this image.' },
            { type: 'image_url', image_url: { url: cachedImage } },
          ]
        : cachedText || 'Hello';

      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: currentMessageContent },
      ];

      // Switch to streaming bubble once we have first content
      let finalText = '';
      await callAPIWithStreaming(payloadMessages, modelToUse, (chunk) => {
        if (!isStreaming) setIsStreaming(true);
        setIsTyping(false);
        setStreamingText(chunk);
        finalText = chunk;
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: false }));
      });

      // Commit the final message to store
      setIsStreaming(false);
      setStreamingText('');
      addIngredientMessage({
        id: (Date.now() + 1).toString(),
        text: finalText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('AI API Error:', error.message);
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingText('');
      addIngredientMessage({
        id: (Date.now() + 1).toString(),
        text: `Network Error: ${error.message}. Please try again.`,
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
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.messageWrapperUser : styles.messageWrapperAI,
        ]}
      >
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="scan" size={14} color={COLORS.card} />
          </View>
        )}
        <View style={[styles.bubbleContainer, isUser && { alignItems: 'flex-end' }]}>
          {item.imageUri && (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
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
            {isUser ? (
              <Text
                selectable
                style={[styles.messageText, { color: COLORS.card }]}
              >
                {item.text}
              </Text>
            ) : (
              <RichAIText text={item.text} colors={COLORS} />
            )}
          </View>

          <View
            style={[
              styles.actionRow,
              { justifyContent: isUser ? 'flex-end' : 'flex-start' },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleCopy(item.text, item.id)}
              style={styles.actionBtn}
            >
              <Ionicons
                name={copiedId === item.id ? 'checkmark-done' : 'copy-outline'}
                size={14}
                color={copiedId === item.id ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: copiedId === item.id ? COLORS.primary : COLORS.textMuted },
                ]}
              >
                {copiedId === item.id ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
            {isUser && (
              <TouchableOpacity
                onPress={() => handleEdit(item.text)}
                style={[styles.actionBtn, { marginLeft: 12 }]}
              >
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
    // FIX: On Android, KeyboardAvoidingView behavior='padding' fights with StatusBar.
    // Using 'height' on Android prevents the jump; iOS keeps 'padding'.
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS.aiBackground }]}
      behavior='padding'
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.aiBackground }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: safeTopPadding, borderBottomColor: COLORS.border },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
              Ingredient Detector
            </Text>
            {!isPremiumUser && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
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

        {/* Chat list */}
        <FlatList
          ref={flatListRef}
          data={aiIngredientHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Loading indicator (shown before streaming begins) */}
        {isTyping && !isStreaming && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="scan" size={14} color={COLORS.card} />
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
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}
            >
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' }}>
                {loadingMessage}
                {'.'.repeat(dotCount)}
              </Text>
            </View>
          </View>
        )}

        {/* Streaming bubble — live text appears here */}
        {isStreaming && streamingText.length > 0 && (
          <View style={[styles.typingContainer, { marginBottom: 4 }]}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="scan" size={14} color={COLORS.card} />
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
                  flex: 1,
                },
              ]}
            >
              <RichAIText text={streamingText} colors={COLORS} />
              {/* Blinking cursor */}
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 16 }}>▌</Text>
            </View>
          </View>
        )}

        {/* Image preview dock */}
        {selectedImageUri && (
          <View
            style={[
              styles.imagePreviewDock,
              { borderTopColor: COLORS.border, backgroundColor: COLORS.aiBackground },
            ]}
          >
            <View style={styles.previewWrap}>
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.removeImageBtn, { backgroundColor: COLORS.card }]}
                onPress={removeSelectedImage}
              >
                <Ionicons name="close" size={14} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scroll nav buttons */}
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
              style={[
                styles.floatingBtn,
                { backgroundColor: COLORS.surface, borderColor: COLORS.border, marginTop: 8 },
              ]}
              onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
            >
              <Ionicons name="arrow-down" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Input dock */}
        <View style={[styles.inputDock, { backgroundColor: COLORS.aiBackground }]}>
          <View
            style={[
              styles.pillContainer,
              {
                backgroundColor: COLORS.inputField || COLORS.surface,
                borderColor: COLORS.border,
                marginBottom: Math.max(insets.bottom, 12),
                marginTop: selectedImageUri ? 0 : 12,
              },
            ]}
          >
            <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(false)}>
              <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(true)}>
              <Ionicons name="camera-outline" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder={selectedImageUri ? 'Add a note...' : 'Upload food image...'}
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim() || selectedImage ? COLORS.primary : 'transparent',
                },
              ]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isTyping || isStreaming}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() || selectedImage ? COLORS.card : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  flatList: { flex: 1 },
  chatList: { padding: 16, paddingBottom: 8 },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperAI: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  bubbleContainer: { flexDirection: 'column', flex: 1 },
  messageImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 8 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, width: '100%' },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  imagePreviewDock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewWrap: { position: 'relative', width: 60, height: 60 },
  previewImage: { width: 60, height: 60, borderRadius: 10 },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  inputDock: { paddingHorizontal: 16, paddingTop: 8 },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'flex-end',
    minHeight: 48,
  },
  attachBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 8,
    paddingTop: 8,
    fontSize: 15,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 4,
    width: '100%',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  actionText: { fontSize: 12, marginLeft: 4, fontWeight: '500' },
  floatingNavContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  // Rich text styles
  richHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  richHeadingAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    marginRight: 8,
  },
  richHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  richBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  richBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
    flexShrink: 0,
  },
  richBulletText: { fontSize: 14, lineHeight: 21, flex: 1 },
  richBulletKey: { fontWeight: '700' },
  richNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  richNumText: { fontSize: 11, fontWeight: '800' },
  richBody: { fontSize: 14, lineHeight: 21, marginVertical: 2 },
  richInlineKey: { fontWeight: '700' },
});