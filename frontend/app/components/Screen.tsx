import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardOffset?: number; // extra offset to add to the iOS keyboardVerticalOffset
  style?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}>;

export function Screen({
  children,
  scroll = false,
  backgroundColor = '#FFFFFF',
  contentContainerStyle,
  keyboardOffset = 0,
  style,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const iosKeyboardOffset = Math.max(insets.top, 0) + keyboardOffset;

  const Inner = () => {
    if (scroll) {
      return (
        <ScrollView
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom, 16) },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[{ flex: 1, paddingBottom: Math.max(insets.bottom, 0) }, contentContainerStyle]}>
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? iosKeyboardOffset : 0}
      >
        <Inner />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Screen;