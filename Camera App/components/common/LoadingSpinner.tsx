import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';

interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
}

/**
 * LoadingSpinner — Centered loading indicator with optional message.
 */
export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.skyBlue} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
