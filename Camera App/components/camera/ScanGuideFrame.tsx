import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, BorderRadius, Fonts } from '../../constants/theme';

interface ScanGuideFrameProps {
  previewWidth: number;
  previewHeight: number;
  cropRatio: number;
}

const BORDER_WIDTH = 3;
const CORNER_LENGTH = 24;
const CORNER_THICKNESS = 5;

/**
 * Visual guide frame overlay for the camera preview.
 * Shows kids where to position their handwriting.
 * The frame size matches the actual OCR crop region.
 */
export function ScanGuideFrame({ previewWidth, previewHeight, cropRatio }: ScanGuideFrameProps) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    // Stop pulsing after 5 seconds, stay solid
    pulseTimeout.current = setTimeout(() => {
      pulse.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 5000);

    return () => {
      pulse.stop();
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    };
  }, [pulseAnim]);

  // Frame sized to match the center-crop region
  const frameSize = Math.min(previewWidth, previewHeight) * cropRatio;
  const frameLeft = (previewWidth - frameSize) / 2;
  const frameTop = (previewHeight - frameSize) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dimmed overlay — top */}
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: frameTop }]} />
      {/* Dimmed overlay — bottom */}
      <View style={[styles.dim, { bottom: 0, left: 0, right: 0, height: frameTop }]} />
      {/* Dimmed overlay — left */}
      <View style={[styles.dim, { top: frameTop, left: 0, width: frameLeft, height: frameSize }]} />
      {/* Dimmed overlay — right */}
      <View style={[styles.dim, { top: frameTop, right: 0, width: frameLeft, height: frameSize }]} />

      {/* Frame border */}
      <Animated.View
        style={[
          styles.frame,
          {
            top: frameTop,
            left: frameLeft,
            width: frameSize,
            height: frameSize,
            opacity: pulseAnim,
          },
        ]}
      >
        {/* Corner markers — top-left */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTL_H]} />
        {/* Corner markers — top-right */}
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerTR_H]} />
        {/* Corner markers — bottom-left */}
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBL_H]} />
        {/* Corner markers — bottom-right */}
        <View style={[styles.corner, styles.cornerBR]} />
        <View style={[styles.corner, styles.cornerBR_H]} />

        {/* Orientation labels — help kids hold paper correctly */}
        <Text style={[styles.orientLabel, styles.labelTop]}>↑ top</Text>
        <Text style={[styles.orientLabel, styles.labelBottom]}>↓ bottom</Text>
        <Text style={[styles.orientLabel, styles.labelLeft]}>←</Text>
        <Text style={[styles.orientLabel, styles.labelRight]}>→</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  frame: {
    position: 'absolute',
    borderWidth: BORDER_WIDTH,
    borderColor: Colors.white,
    borderRadius: BorderRadius.md,
  },
  // Vertical part of corner markers
  corner: {
    position: 'absolute',
    backgroundColor: Colors.coral,
    borderRadius: 2,
  },
  // Top-left vertical
  cornerTL: {
    top: -BORDER_WIDTH,
    left: -BORDER_WIDTH,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
  },
  // Top-left horizontal
  cornerTL_H: {
    top: -BORDER_WIDTH,
    left: -BORDER_WIDTH,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
  },
  // Top-right vertical
  cornerTR: {
    top: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
  },
  // Top-right horizontal
  cornerTR_H: {
    top: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
  },
  // Bottom-left vertical
  cornerBL: {
    bottom: -BORDER_WIDTH,
    left: -BORDER_WIDTH,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
  },
  // Bottom-left horizontal
  cornerBL_H: {
    bottom: -BORDER_WIDTH,
    left: -BORDER_WIDTH,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
  },
  // Bottom-right vertical
  cornerBR: {
    bottom: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
  },
  // Bottom-right horizontal
  cornerBR_H: {
    bottom: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
  },
  // Orientation labels
  orientLabel: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: Fonts.family.semiBold,
    textAlign: 'center',
  },
  labelTop: {
    top: 4,
    alignSelf: 'center',
    left: 0,
    right: 0,
  },
  labelBottom: {
    bottom: 4,
    alignSelf: 'center',
    left: 0,
    right: 0,
  },
  labelLeft: {
    left: 4,
    top: '45%' as any,
  },
  labelRight: {
    right: 4,
    top: '45%' as any,
  },
});
