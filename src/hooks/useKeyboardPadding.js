// AI-assisted: see docs/AI_LOG.md #12

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Custom hook that listens to keyboard show/hide events (with mandatory cleanup)
 * and returns whether the keyboard is visible along with the extra bottom padding
 * required so any ScrollView can scroll all fields above the open keyboard.
 */
export default function useKeyboardPadding(basePadding = 56) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event?.endCoordinates?.height || 280;
      setKeyboardHeight(height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isKeyboardVisible = keyboardHeight > 0;
  // Add generous bottom space when keyboard is open so the lowest field can scroll well above the keyboard
  const bottomPadding = isKeyboardVisible ? keyboardHeight + 120 : basePadding;

  return {
    isKeyboardVisible,
    keyboardHeight,
    bottomPadding,
  };
}

