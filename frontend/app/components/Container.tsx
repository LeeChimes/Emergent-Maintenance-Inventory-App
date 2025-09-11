import React, { PropsWithChildren } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

type ContainerProps = PropsWithChildren<{
  maxWidth?: number;
  paddingHorizontal?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function Container({
  children,
  maxWidth = 900,
  paddingHorizontal = 16,
  style,
}: ContainerProps) {
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth,
          alignSelf: 'center',
          paddingHorizontal,
          flexGrow: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Container;