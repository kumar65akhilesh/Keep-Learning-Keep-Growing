import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import { isLetterMode } from '../utils/characterFilter';

/**
 * Camera Screen — Web version.
 *
 * Camera is not available on web, so we show a demo mode
 * that generates mock recognition results for UI testing.
 */
export default function CameraScreen() {
  const router = useRouter();
  const mode = useOcrStore((s) => s.mode);
  const setCurrentResult = useOcrStore((s) => s.setCurrentResult);

  const letters = isLetterMode(mode);
  const modeLabel = letters ? '🔤 Read ABC' : '🔢 Read 123';
  const modeColor = letters ? Colors.skyBlue : Colors.orange;

  /** Generate demo characters based on mode */
  const handleDemo = () => {
    const abcChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numChars = '123456789';
    const source = letters ? abcChars : numChars;

    // Pick 5 random characters
    const chars = Array.from({ length: 5 }, (_, i) => {
      const idx = Math.floor(Math.random() * source.length);
      return {
        text: source[idx],
        confidence: 0.8 + Math.random() * 0.2,
        boundingBox: {
          x: 0.1 + (i * 0.17),
          y: 0.3,
          width: 0.1,
          height: 0.15,
        },
      };
    });

    setCurrentResult({
      characters: chars,
      mode,
      timestamp: Date.now(),
      rawText: chars.map((c) => c.text).join(''),
    });
    router.push('/result');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.charcoal} />
        </TouchableOpacity>
        <View style={[styles.modeBadge, { backgroundColor: modeColor }]}>
          <Text style={styles.modeBadgeText}>{modeLabel}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Camera placeholder */}
      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={80} color={Colors.midGray} />
        <Text style={styles.placeholderTitle}>Camera Preview</Text>
        <Text style={styles.placeholderSubtitle}>
          Camera requires a native device.{'\n'}Use Demo Mode to preview the app UI.
        </Text>
      </View>

      {/* Demo button */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: modeColor }]}
          onPress={handleDemo}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={24} color={Colors.white} />
          <Text style={styles.demoButtonText}>
            Try Demo Mode — Recognize {letters ? 'Letters' : 'Numbers'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          This generates sample {letters ? 'letters' : 'numbers'} so you can test
          the Result, History, and TTS features.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modeBadgeText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.white,
  },
  cameraPlaceholder: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  placeholderTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    color: Colors.darkGray,
  },
  placeholderSubtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xxl,
  },
  actionsContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  demoButtonText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.white,
  },
  hint: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
