import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows, LetterCardColors } from '../../constants/theme';
import type { RecognizedCharacter } from '../../types';

interface LetterCardProps {
  /** The recognized character data */
  character: RecognizedCharacter;
  /** Index for color assignment */
  index: number;
  /** Callback when the card is tapped (e.g., speak the letter) */
  onPress?: (character: RecognizedCharacter) => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * LetterCard — Displays a single recognized character as a colorful,
 * kid-friendly card with a star-based confidence rating.
 */
export function LetterCard({ character, index, onPress, size = 'medium' }: LetterCardProps) {
  const bgColor = LetterCardColors[index % LetterCardColors.length];
  const stars = confidenceToStars(character.confidence);
  const sizeStyle = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }, sizeStyle.card]}
      onPress={() => onPress?.(character)}
      activeOpacity={0.8}
      accessibilityLabel={`Letter ${character.text}, confidence ${stars} out of 5 stars`}
      accessibilityRole="button"
    >
      <Text style={[styles.letter, sizeStyle.letter]}>{character.text}</Text>
      <Text style={[styles.stars, sizeStyle.stars]}>{renderStars(stars)}</Text>
    </TouchableOpacity>
  );
}

/** Convert a 0-1 confidence score to a 1-5 star rating */
function confidenceToStars(confidence: number): number {
  return Math.max(1, Math.min(5, Math.round(confidence * 5)));
}

/** Render star emojis for a given rating */
function renderStars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}

const SIZE_STYLES = {
  small: StyleSheet.create({
    card: { width: 56, height: 72, padding: Spacing.xs },
    letter: { fontSize: Fonts.size.xl },
    stars: { fontSize: 8 },
  }),
  medium: StyleSheet.create({
    card: { width: 80, height: 100, padding: Spacing.sm },
    letter: { fontSize: Fonts.size.xxxl },
    stars: { fontSize: 10 },
  }),
  large: StyleSheet.create({
    card: { width: 110, height: 140, padding: Spacing.md },
    letter: { fontSize: Fonts.size.display },
    stars: { fontSize: 14 },
  }),
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  letter: {
    fontFamily: Fonts.family.extraBold,
    color: Colors.charcoal,
  },
  stars: {
    color: Colors.orange,
    marginTop: Spacing.xs,
  },
});
