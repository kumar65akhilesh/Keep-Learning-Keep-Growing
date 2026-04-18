import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, LetterCardColors } from '../../constants/theme';

interface LetterBubbleProps {
  /** The character to display */
  character: string;
  /** Index for color assignment */
  index: number;
  /** Size in pixels */
  size?: number;
  /** Callback on press */
  onPress?: () => void;
}

/**
 * LetterBubble — Small circular bubble showing a single character.
 * Used in the live result strip on the camera screen and in history cards.
 */
export function LetterBubble({ character, index, size = 40, onPress }: LetterBubbleProps) {
  const bgColor = LetterCardColors[index % LetterCardColors.length];

  const content = (
    <View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text
        style={[
          styles.character,
          { fontSize: size * 0.5 },
        ]}
      >
        {character}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  character: {
    fontFamily: Fonts.family.extraBold,
    color: Colors.charcoal,
  },
});
