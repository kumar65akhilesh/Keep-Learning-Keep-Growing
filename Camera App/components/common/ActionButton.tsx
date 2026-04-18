import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows, MIN_TOUCH_TARGET } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

interface ActionButtonProps {
  /** Button label text */
  label: string;
  /** Ionicons icon name */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Callback on press */
  onPress: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Full width mode */
  fullWidth?: boolean;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.skyBlue, text: Colors.white },
  secondary: { bg: Colors.lightGray, text: Colors.charcoal },
  success: { bg: Colors.grassGreen, text: Colors.white },
  danger: { bg: Colors.coral, text: Colors.white },
  warning: { bg: Colors.orange, text: Colors.white },
};

/**
 * ActionButton — Large, pill-shaped button with icon and label.
 * Designed with generous touch targets for kids.
 */
export function ActionButton({
  label,
  icon,
  variant = 'primary',
  onPress,
  disabled = false,
  fullWidth = false,
}: ActionButtonProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.bg },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {icon && (
        <Ionicons
          name={icon}
          size={22}
          color={colors.text}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
  },
});
