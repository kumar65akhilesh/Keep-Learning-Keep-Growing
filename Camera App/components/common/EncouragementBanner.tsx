import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';

interface EncouragementBannerProps {
  /** Number of characters found */
  characterCount: number;
  /** Optional specific character to celebrate */
  highlightCharacter?: string;
}

const MESSAGES = [
  'Great job! 🌟',
  'Amazing! 🎉',
  'You did it! 🏆',
  'Awesome! ⭐',
  'Wonderful! 🎊',
  'Fantastic! 💫',
  'Super! 🌈',
  'Brilliant! ✨',
];

/**
 * EncouragementBanner — Displays an encouraging message with
 * contextual praise based on what was recognized.
 */
export function EncouragementBanner({ characterCount, highlightCharacter }: EncouragementBannerProps) {
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  const detail = highlightCharacter
    ? `You found the letter "${highlightCharacter}"!`
    : characterCount > 0
      ? `You found ${characterCount} character${characterCount > 1 ? 's' : ''}!`
      : 'Point the camera at some text!';

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{characterCount > 0 ? message : '📸 Ready!'}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  message: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xl,
    color: Colors.charcoal,
  },
  detail: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    marginTop: Spacing.xs,
  },
});
