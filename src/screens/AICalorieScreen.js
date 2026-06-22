import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { fetch as expoFetch } from 'expo/fetch';
import OpenAI from 'openai';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

let RAW_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
if (RAW_URL.endsWith('/v1') || RAW_URL.endsWith('/v1/')) {
  RAW_URL = RAW_URL.replace(/\/$/, '') + '/chat/completions';
}
const FETCH_URL = RAW_URL; 
const SDK_BASE_URL = 'https://integrate.api.nvidia.com/v1'; 

const VISION_MODEL = process.env.EXPO_PUBLIC_NVIDIA_VISION_MODEL || 'meta/llama-3.2-90b-vision-instruct';
const TEXT_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';
const API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

if (!API_KEY) {
  console.warn("Missing API Key in .env file");
}

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: SDK_BASE_URL,
  dangerouslyAllowBrowser: true,
  fetch: expoFetch, 
});

const INITIAL_GREETING = {
  id: '1',
  text: "Welcome to the AI Calories Calculator! 📊\n\nUpload a photo of your meal or describe what you ate. I will analyze the contents, estimate the portion sizes, and calculate your total Calories, Protein, Carbs, and Fats.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

export default function AICalorieScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const { COLORS, FONTS } = useTheme();

  const {
    isPremiumUser,
    freeAiQuestionsRemaining,
    decrementAiQuestions,
    aiCalorieHistory,
    addCalorieMessage,
  } = useHealthStore();

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  
  const [isTyping, setIsTyping] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState('');
  const [dotCount, setDotCount] = useState(1);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;

  useEffect(() => {
    if (aiCalorieHistory.length === 0) {
      addCalorieMessage(INITIAL_GREETING);
    }
  }, [aiCalorieHistory.length, addCalorieMessage]);

  // Dynamic ellipsis animation for the loading state
  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  const pickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      };

      let result = useCamera 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setSelectedImageUri(manipResult.uri);
        setSelectedImage(`data:image/jpeg;base64,${manipResult.base64}`);
      }
    } catch (error) {
      console.error("Image capture error:", error);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImageUri(null);
  };

  // ─── PIPELINE STEP 1: VISION MODEL (Strictly "Eyes") ───
  const extractFoodFromImage = async (base64Image, userNotes) => {
    const prompt = `Identify the food items visible in this image. Estimate their portion sizes (e.g., cups, grams). ${userNotes ? `User notes: ${userNotes}` : ''}\n\nList the items clearly. Do NOT calculate calories or macros.`;
    
    const payload = {
      model: VISION_MODEL,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: base64Image } }] }],
      max_tokens: 300,
      temperature: 0.1,
      top_p: 0.7,
      stream: false
    };

    const response = await fetch(FETCH_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const textData = await response.text();
    let data;
    try { data = JSON.parse(textData); } 
    catch (e) { throw new Error('Vision API gateway rejected the payload.'); }

    if (!response.ok) throw new Error(data.message || 'Vision API failed');
    return data.choices[0].message.content;
  };

  // ─── PIPELINE STEP 2: NUTRITIONAL MATH MODEL (Strictly "Brain") ───
  const calculateMacrosStream = async (visionOutput, userNotes) => {
    const systemPrompt = `You are a precision dietary calculator. 
Task: Calculate the nutritional value.

Inputs provided:
- Detected Foods: ${visionOutput || 'None (Rely on user notes)'}
- User Notes: ${userNotes || 'None'}

CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. NO asterisks (**), NO bold tags, NO hash symbols (#). 
2. Use ALL CAPS for section headings (e.g., MACRO BREAKDOWN:).
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.

Required Output Structure:
DETECTED ITEMS:
- List items and estimated portions here.

MACRO BREAKDOWN:
- Total Calories: X kcal
- Protein: X g
- Carbohydrates: X g
- Fat: X g

HEALTH ANALYSIS:
Provide a brief 2-sentence analysis or healthy alternative suggestion.`;

    const formattedHistory = aiCalorieHistory
      .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
      .map((msg) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));

    return await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...formattedHistory, { role: 'user', content: 'Process the nutritional data.' }],
      temperature: 0.1, 
      top_p: 0.8,
      max_tokens: 800,
      stream: true,
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    Keyboard.dismiss();

    if (!isPremiumUser && freeAiQuestionsRemaining <= 0) {
      navigation.navigate('PaywallScreen');
      return;
    }
    if (!isPremiumUser) decrementAiQuestions();

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim() || 'Analyze this meal.',
      imageUri: selectedImageUri,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    addCalorieMessage(userMessage);
    const cachedImage = selectedImage;
    const cachedText = inputText.trim();
    
    setInputText('');
    removeSelectedImage();
    setIsTyping(true);
    setPipelineStatus('Analyzing image layers');
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      let visionData = '';

      if (cachedImage) {
        visionData = await extractFoodFromImage(cachedImage, cachedText);
      }

      setPipelineStatus('Calculating precise macros');
      const stream = await calculateMacrosStream(visionData, cachedText);

      setIsTyping(false);
      setIsStreaming(true);
      setStreamingMessage('');
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
      
      addCalorieMessage({
        id: (Date.now() + 1).toString(),
        text: accumulatedText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      setIsStreaming(false);
      setIsTyping(false);
      console.warn('Pipeline Error: ', error.message);
      addCalorieMessage({
        id: (Date.now() + 1).toString(),
        text: `Error processing data: ${error.message}. Please try again.`,
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
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.secondary }]}>
            <Ionicons name="flame" size={14} color={COLORS.card} />
          </View>
        )}
        <View style={styles.bubbleContainer}>
          {item.imageUri && (
             <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
          )}
          {item.text ? (
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.aiBubble,
                isUser ? { backgroundColor: COLORS.secondary } : { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
              ]}
            >
              <Text style={[styles.messageText, { color: isUser ? COLORS.card : COLORS.textPrimary }]}>
                {item.text}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.aiBackground }]} behavior='padding' enabled={true}>
      <View style={{ flex: 1, backgroundColor: COLORS.aiBackground }}>
        {/* ── HEADER ── */}
        <View style={[styles.header, { paddingTop: safeTopPadding, borderBottomColor: COLORS.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>AI Calories Calculator</Text>
            {!isPremiumUser && (
              <View style={[styles.badge, { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }]}>
                <Text style={[styles.badgeText, { color: COLORS.secondary }]}>{freeAiQuestionsRemaining} FREE LEFT</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── CHAT LIST ── */}
        <FlatList
          ref={flatListRef}
          data={aiCalorieHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        />

        {/* ── REAL-TIME STREAMING BUBBLE ── */}
        {isStreaming && (
          <View style={[styles.messageWrapper, styles.messageWrapperAI, { paddingHorizontal: 16 }]}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.secondary }]}>
              <Ionicons name="flame" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}>
              <Text style={[styles.messageText, { color: COLORS.textPrimary }]}>
                {streamingMessage}
                <Text style={{ color: COLORS.secondary }}> ▍</Text>
              </Text>
            </View>
          </View>
        )}

        {/* ── DUAL-STATE TYPING INDICATOR ── */}
        {isTyping && !isStreaming && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.secondary }]}>
              <Ionicons name="flame" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' }}>
                {pipelineStatus}{'.'.repeat(dotCount)}
              </Text>
            </View>
          </View>
        )}

        {/* ── IMAGE PREVIEW DOCK ── */}
        {selectedImageUri && (
          <View style={[styles.imagePreviewDock, { borderTopColor: COLORS.border, backgroundColor: COLORS.aiBackground }]}>
             <View style={styles.previewWrap}>
               <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
               <TouchableOpacity style={[styles.removeImageBtn, { backgroundColor: COLORS.card }]} onPress={removeSelectedImage}>
                 <Ionicons name="close" size={14} color={COLORS.textPrimary} />
               </TouchableOpacity>
             </View>
          </View>
        )}

        {/* ── INPUT DOCK ── */}
        <View style={[styles.inputDock, { backgroundColor: COLORS.aiBackground }]}>
          <View style={[styles.pillContainer, { backgroundColor: COLORS.inputField || COLORS.surface, borderColor: COLORS.border, marginBottom: Math.max(insets.bottom, 12), marginTop: selectedImageUri ? 0 : 12 }]}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(false)}>
              <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage(true)}>
              <Ionicons name="camera-outline" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, { color: COLORS.textPrimary }]}
              placeholder={selectedImageUri ? "Add portion notes..." : "Upload food or type meal..."}
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: (inputText.trim() || selectedImage) ? COLORS.secondary : 'transparent' }]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isTyping || isStreaming}
            >
              <Ionicons name="arrow-up" size={20} color={(inputText.trim() || selectedImage) ? COLORS.card : COLORS.textMuted} />
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  flatList: { flex: 1 },
  chatList: { padding: 16 },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperAI: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  bubbleContainer: { flexDirection: 'column', alignItems: 'flex-end' },
  messageImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 8 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  typingContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-start' },
  imagePreviewDock: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  previewWrap: { position: 'relative', width: 60, height: 60 },
  previewImage: { width: 60, height: 60, borderRadius: 10 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, elevation: 3 },
  inputDock: { paddingHorizontal: 16, paddingTop: 8 },
  pillContainer: { flexDirection: 'row', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 6, borderWidth: 1, alignItems: 'flex-end', minHeight: 48 },
  attachBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  textInput: { flex: 1, minHeight: 36, maxHeight: 120, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8, fontSize: 15, backgroundColor: 'transparent' },
  sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 4, marginBottom: 4 },
});