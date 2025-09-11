import React from 'react';
import { View, ViewProps } from 'react-native';

type ContainerProps = ViewProps & {
  children: React.ReactNode;
  maxWidth?: number;
};

export default function Container({
  children,
  maxWidth = 900,
  style,
  ...rest
}: ContainerProps) {
  return (
    <View
      style={[
        {
          maxWidth,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 16,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}