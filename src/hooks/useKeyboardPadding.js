import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Platform } from 'react-native';

/**
 * A custom hook to handle manual keyboard padding and list scrolling.
 * @param {React.MutableRefObject} flatListRef - Reference to the FlatList to automatically scroll when keyboard opens.
 * @returns {{ keyboardPadding: Animated.Value, isKeyboardVisible: boolean }}
 */
export function useKeyboardPadding(flatListRef = null) {
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // iOS uses 'Will' for smoother animations before the keyboard physically appears.
    // Android uses 'Did' because window metrics recalculate after the event.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      Animated.timing(keyboardPadding, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 250,
        useNativeDriver: false, // Cannot use native driver for layout properties (padding)
      }).start(() => {
        // Automatically scroll the list to the bottom once the animation completes
        if (flatListRef && flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardVisible(false);
      Animated.timing(keyboardPadding, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardPadding, flatListRef]);

  return { keyboardPadding, isKeyboardVisible };
}