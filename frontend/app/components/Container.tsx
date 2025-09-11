import React from 'react';
import { View, ViewProps } from 'react-native';

type ContainerProps = ViewProps & {
  children: React.ReactNode;
};

export default function Container({
  children,
  style,
  ...rest
}: ContainerProps) {
  return (
    <View 
      style={[
        {
          maxWidth: 900,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 16,
        },
        style
      ]} 
      {...rest}
    >
      {children}
    </View>
  );
}