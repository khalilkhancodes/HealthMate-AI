import { Ionicons } from '@expo/vector-icons';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

let RAW_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
if (RAW_URL.endsWith('/v1') || RAW_URL.endsWith('/v1/')) {
  RAW_URL = RAW_URL.replace(/\/$/, '') + '/chat/completions';
}
const NVIDIA_INVOKE_URL = RAW_URL;
const VISION_MODEL = process.env.EXPO_PUBLIC_NVIDIA_VISION_MODEL || 'meta/llama-3.2-90b-vision-instruct';
const API_KEY = process.env.EXPO_PUBLIC_NVIDIA_VISION_API_KEY || process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

if (!API_KEY) {
  console.warn("Missing Vision API Key in .env file");
}

const INITIAL_GREETING = {
  id: '1',
  text: "Welcome to the AI Ingredient Detector! 📸\n\nUpload a picture of a meal or an ingredient label. I will identify the dish, extract the ingredients, and break down the estimated nutritional metrics.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

// 1. Corrected context-specific loading states
const AI_LOADING_STATES = [
  'Scanning image layers',
  'Identifying ingredients',
  'Estimating portions',
  'Formatting nutritional data',
];

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
  const [loadingMessage, setLoadingMessage] = useState(AI_LOADING_STATES[0]);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : insets.top + 10;

  // 2. Dynamic ellipsis animation interval
  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isTyping]);

  // 3. Message cycle interval
  useEffect(() => {
    let interval;
    if (isTyping) {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % AI_LOADING_STATES.length;
        setLoadingMessage(AI_LOADING_STATES[index]);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  useEffect(() => {
    if (aiIngredientHistory.length === 0) {
      addIngredientMessage(INITIAL_GREETING);
    }
  }, [aiIngredientHistory.length, addIngredientMessage]);

  const buildSystemPrompt = () =>
    `Analyze the image carefully.

Identify:
- Dish name.
- Individual ingredients.
- Estimated weight in grams.
- Confidence score.

CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting. "NO asterisks (**), NO bold tags, NO hash symbols (#)". 
2. Use ALL CAPS for section headings (e.g., DISH NAME, DESCRIPTION, INGREDIENTS, INSTRUCTIONS, TIPS).
3. Use simple hyphens (-) for bullet points.
4. Separate sections with blank lines for readability.

Required Output Structure:
DETECTED ITEMS:
- List items and estimated portions here.

if user asks for dish name or other things, provide them in a clear and concise manner like this:
DISH NAME: [Dish Name]
INGREDIENTS:
- [Ingredient 1]: [Estimated Weight] g
- [Ingredient 2]: [Estimated Weight] g

If user asks for instructions, provide them in a clear and concise manner like this:
INSTRUCTIONS:
- Step 1: [Instruction]
- Step 2: [Instruction]

Provide Tips or Suggestions if applicable:
TIPS:
- [Tip 1]
- [Tip 2]

HEALTH ANALYSIS:
Provide a brief 2-sentence analysis or healthy alternative suggestion.

Do not estimate calories.
Do not provide explanations.
Focus on ingredient recognition and portion estimation.


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

  const pickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1, 
      };

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Camera permissions are required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Gallery permissions are required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
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

  const callNvidiaVision = async (payloadMessages) => {
    if (!API_KEY) throw new Error('Missing API Configuration.');

    const payload = {
      model: VISION_MODEL,
      messages: payloadMessages,
      max_tokens: 512,
      temperature: 0.2,
      top_p: 0.7,
      stream: false
    };

    const response = await fetch(NVIDIA_INVOKE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const textData = await response.text();
    let data;

    try {
      data = JSON.parse(textData);
    } catch (error) {
      console.error("Raw API Rejection:", textData);
      throw new Error(`API Gateway Rejected Request: ${textData.substring(0, 50)}...`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'NVIDIA API returned an error');
    }

    return data.choices[0].message.content;
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
      text: inputText.trim() || 'Analyze this image.',
      imageUri: selectedImageUri,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    addIngredientMessage(userMessage);
    const cachedImage = selectedImage;
    const cachedText = inputText;

    setInputText('');
    removeSelectedImage();
    
    // Reset loading state parameters before displaying
    setLoadingMessage(AI_LOADING_STATES[0]);
    setDotCount(1);
    setIsTyping(true);

    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const formattedHistory = aiIngredientHistory
        .filter((msg, index) => !(index === 0 && msg.sender === 'ai'))
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

      const currentMessageContent = [];
      if (cachedText) {
        currentMessageContent.push({ type: 'text', text: cachedText });
      } else {
        currentMessageContent.push({ type: 'text', text: 'What is in this image?' });
      }

      if (cachedImage) {
        currentMessageContent.push({
          type: 'image_url',
          image_url: { url: cachedImage },
        });
      }

      const payloadMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...formattedHistory,
        { role: 'user', content: currentMessageContent },
      ];

      const responseText = await callNvidiaVision(payloadMessages);

      addIngredientMessage({
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.warn('AI Vision API Error: ', error.message);
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
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="scan" size={14} color={COLORS.card} />
          </View>
        )}
        <View style={styles.bubbleContainer}>
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
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
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS.aiBackground }]}
      behavior='padding' enabled={true}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.aiBackground }}>
        <View style={[styles.header, { paddingTop: safeTopPadding, borderBottomColor: COLORS.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
              Ingredient Detector
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
        />

        {/* 4. Correctly rendered typing container with text and dynamic dots */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="scan" size={14} color={COLORS.card} />
            </View>
            <View style={[styles.aiBubble, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' }}>
                {loadingMessage}{'.'.repeat(dotCount)}
              </Text>
            </View>
          </View>
        )}

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
              placeholder={selectedImageUri ? "Add a note..." : "Upload food image..."}
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: (inputText.trim() || selectedImage) ? COLORS.primary : 'transparent' }]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isTyping}
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
  removeImageBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3 },
  inputDock: { paddingHorizontal: 16, paddingTop: 8, },
  pillContainer: { flexDirection: 'row', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 6, borderWidth: 1, alignItems: 'flex-end', minHeight: 48 },
  attachBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  textInput: { flex: 1, minHeight: 36, maxHeight: 120, paddingHorizontal: 8, paddingTop: 8, fontSize: 15, backgroundColor: 'transparent' },
  sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 4, marginBottom: 4 },
});