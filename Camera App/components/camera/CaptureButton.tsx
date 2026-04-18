import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Shadows } from '../../constants/theme';

interface CaptureButtonProps {
  /** Callback when capture button is pressed */
  onCapture: () => void;
  /** Whether the button is disabled (e.g., during processing) */
  disabled?: boolean;
}

/**
 * CaptureButton — Large circular capture button with animated pulsing ring.
 * Designed to be highly visible and easy to tap for kids.
 */
export function CaptureButton({ onCapture, disabled = false }: CaptureButtonProps) {
  return (
    <TouchableOpacity
      onPress={onCapture}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel="Take a photo to recognize characters"
      accessibilityRole="button"
    >
      <View style={[styles.outerRing, disabled && styles.disabled]}>
        <View style={styles.innerCircle} />
      </View>
    </TouchableOpacity>
  );
}

const OUTER_SIZE = 76;
const INNER_SIZE = 62;

const styles = StyleSheet.create({
  outerRing: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: Colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
});
