import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import type { RecognizedCharacter } from '../../types';

interface OcrOverlayProps {
  /** Characters detected with bounding boxes */
  characters: RecognizedCharacter[];
  /** Preview dimensions for coordinate mapping */
  previewWidth: number;
  previewHeight: number;
}

/** Colors for bounding boxes — cycles through for visual variety */
const BOX_COLORS = [
  '#4CC9F0',
  '#F72585',
  '#06D6A0',
  '#FFD60A',
  '#7B2FF7',
  '#FF9E00',
];

/**
 * OcrOverlay — Renders colored bounding boxes with recognized characters
 * over the camera preview. Each detected character gets a colorful
 * rounded rectangle and a label floating above it.
 */
export function OcrOverlay({ characters, previewWidth, previewHeight }: OcrOverlayProps) {
  if (characters.length === 0) return null;

  return (
    <View
      style={[styles.overlay, { width: previewWidth, height: previewHeight }]}
      pointerEvents="none"
    >
      {characters.map((char, index) => {
        const color = BOX_COLORS[index % BOX_COLORS.length];
        const box = char.boundingBox;

        return (
          <View
            key={`${char.text}-${index}`}
            style={[
              styles.boundingBox,
              {
                left: box.x * previewWidth,
                top: box.y * previewHeight,
                width: box.width * previewWidth,
                height: box.height * previewHeight,
                borderColor: color,
              },
            ]}
          >
            <View style={[styles.label, { backgroundColor: color }]}>
              <Text style={styles.labelText}>{char.text}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: BorderRadius.sm,
  },
  label: {
    position: 'absolute',
    top: -28,
    left: -1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  labelText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
