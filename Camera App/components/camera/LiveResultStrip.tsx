import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { LetterBubble } from '../common/LetterBubble';
import type { RecognizedCharacter } from '../../types';

interface LiveResultStripProps {
  /** Characters currently detected in the preview */
  characters: RecognizedCharacter[];
  /** Callback when a bubble is tapped */
  onCharacterPress?: (char: RecognizedCharacter) => void;
}

/**
 * LiveResultStrip — Horizontal scrollable strip showing detected
 * characters as colorful bubbles. Displayed below the camera preview.
 */
export function LiveResultStrip({ characters, onCharacterPress }: LiveResultStripProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {characters.length > 0
          ? `Detected: ${characters.length}`
          : 'Scanning...'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {characters.length > 0 ? (
          characters.map((char, index) => (
            <LetterBubble
              key={`${char.text}-${index}`}
              character={char.text}
              index={index}
              size={36}
              onPress={() => onCharacterPress?.(char)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Point camera at letters or numbers</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.overlayLight,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  label: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  emptyText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
    fontStyle: 'italic',
  },
});
