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
  backgroundColor = '#fff',
  style,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const KAV = (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={keyboardOffset + (Platform.OS === 'android' ? 0 : insets.top)}
      style={{ flex: 1 }}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: insets.bottom + 16 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          // If you ever embed scrollables inside, enable nested:
          // nestedScrollEnabled
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingBottom: insets.bottom + 16 }, style]} {...rest}>
          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}
      edges={['top', 'right', 'left']}
    >
      {KAV}
    </SafeAreaView>
  );
}
