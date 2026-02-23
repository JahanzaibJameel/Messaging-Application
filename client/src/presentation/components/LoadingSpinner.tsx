/**
 * Loading Spinner Component
 * Consistent loading indicator across the app
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface Props {
  size?: 'small' | 'large' | number;
  color?: string;
  text?: string;
  style?: object;
  showText?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({
  size = 'large',
  color = '#3498db',
  text = 'Loading...',
  style,
  showText = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {showText && text ? (
        <Text style={styles.text}>{text}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default LoadingSpinner;
