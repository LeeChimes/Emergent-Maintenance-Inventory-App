import React from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, View, ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  scroll?: boolean;              // set true for forms/long content
  children: React.ReactNode;
  keyboardOffset?: number;       // tweak if headers present
  backgroundColor?: string;
  contentContainerStyle?: object;
};

export default function Screen({
  scroll = false,
  children,
  keyboardOffset = 0,
  backgroundColor = '#1a1a1a',    // Match app's dark theme
  style,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        { flexGrow: 1, paddingBottom: insets.bottom + 16 },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingBottom: insets.bottom + 16 }, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'right', 'left']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={keyboardOffset + (Platform.OS === 'ios' ? insets.top : 0)}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
