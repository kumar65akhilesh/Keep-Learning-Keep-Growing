import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { LetterCard } from '../components/common/LetterCard';
import { ActionButton } from '../components/common/ActionButton';
import { EncouragementBanner } from '../components/common/EncouragementBanner';
import { useOcrStore } from '../store/ocrStore';
import { useSettingsStore } from '../store/settingsStore';
import { spellOutCharacters, speakCharacter, stopSpeaking } from '../services/tts';
import { copyText } from '../services/clipboard';
import { saveScan } from '../services/history';
import { useHistoryStore } from '../store/historyStore';
import { isLetterMode } from '../utils/characterFilter';
import type { RecognizedCharacter } from '../types';

/**
 * Result Screen — Displays recognized characters after capture.
 *
 * Shows characters as large, colorful, tappable cards in a grid.
 * Provides actions: Speak, Copy, Save, Retry.
 */
export default function ResultScreen() {
  const router = useRouter();
  const currentResult = useOcrStore((s) => s.currentResult);
  const mode = useOcrStore((s) => s.mode);
  const clearCurrentResult = useOcrStore((s) => s.clearCurrentResult);
  const addScan = useHistoryStore((s) => s.addScan);
  const speechRate = useSettingsStore((s) => s.speechRate);
  const spellOut = useSettingsStore((s) => s.spellOutLetters);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const characters = currentResult?.characters ?? [];
  const recognizedText = characters.map((c) => c.text).join('');

  /** Average confidence for display */
  const avgConfidence = useMemo(() => {
    if (characters.length === 0) return 0;
    const sum = characters.reduce((acc, c) => acc + c.confidence, 0);
    return sum / characters.length;
  }, [characters]);

  /** Speak all characters aloud */
  const handleSpeak = useCallback(async () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      if (spellOut) {
        await spellOutCharacters(
          characters.map((c) => c.text),
          { rate: speechRate }
        );
      } else {
        const { speakText } = await import('../services/tts');
        await speakText(recognizedText, { rate: speechRate });
      }
    } catch (err) {
      console.warn('TTS error:', err);
    } finally {
      setIsSpeaking(false);
    }
  }, [characters, isSpeaking, speechRate, spellOut, recognizedText]);

  /** Copy recognized text to clipboard */
  const handleCopy = useCallback(async () => {
    const success = await copyText(recognizedText);
    if (success) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } else {
      Alert.alert('Oops!', 'Could not copy text.');
    }
  }, [recognizedText]);

  /** Save scan to history */
  const handleSave = useCallback(async () => {
    if (!currentResult || isSaved) return;

    try {
      const record = await saveScan({
        recognizedText,
        characters,
        mode,
        imageUri: currentResult.imageUri ?? '',
        confidence: avgConfidence,
      });
      addScan(record);
      setIsSaved(true);
    } catch (error) {
      Alert.alert('Error', 'Could not save scan to history.');
      console.error('Save error:', error);
    }
  }, [currentResult, isSaved, recognizedText, characters, mode, avgConfidence, addScan]);

  /** Go back to camera for another scan */
  const handleRetry = useCallback(() => {
    clearCurrentResult();
    router.back();
  }, [clearCurrentResult, router]);

  /** Tap a letter card to speak it */
  const handleCardPress = useCallback((char: RecognizedCharacter) => {
    speakCharacter(char.text);
  }, []);

  // No result — shouldn't normally happen, but handle gracefully
  if (!currentResult || characters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyTitle}>No characters found</Text>
          <Text style={styles.emptySubtitle}>
            Try again with better lighting or hold the camera closer.
          </Text>
          <ActionButton
            label="Try Again"
            icon="camera-outline"
            variant="primary"
            onPress={handleRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  const modeEmoji = isLetterMode(mode) ? '🔤' : '🔢';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.charcoal} />
        </TouchableOpacity>
        <EncouragementBanner characterCount={characters.length} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Captured image thumbnail */}
        {currentResult.imageUri && (
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: currentResult.imageUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.thumbnailBadge}>
              <Text style={styles.thumbnailBadgeText}>
                {modeEmoji} {characters.length} found
              </Text>
            </View>
          </View>
        )}

        {/* Letter cards grid */}
        <View style={styles.cardsGrid}>
          {characters.map((char, index) => (
            <LetterCard
              key={`${char.text}-${index}`}
              character={char}
              index={index}
              size="large"
              onPress={handleCardPress}
            />
          ))}
        </View>

        {/* Recognized text summary */}
        <View style={styles.textSummary}>
          <Text style={styles.summaryLabel}>Found text:</Text>
          <Text style={styles.summaryText}>{recognizedText}</Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          <ActionButton
            label={isSpeaking ? 'Stop' : 'Speak'}
            icon={isSpeaking ? 'stop-circle' : 'volume-high'}
            variant="primary"
            onPress={handleSpeak}
          />
          <ActionButton
            label={copiedToast ? 'Copied!' : 'Copy'}
            icon={copiedToast ? 'checkmark-circle' : 'copy'}
            variant="danger"
            onPress={handleCopy}
          />
        </View>
        <View style={styles.actionsRow}>
          <ActionButton
            label={isSaved ? 'Saved! ✓' : 'Save'}
            icon={isSaved ? 'checkmark-circle' : 'save'}
            variant="success"
            onPress={handleSave}
            disabled={isSaved}
          />
          <ActionButton
            label="Retry"
            icon="camera"
            variant="warning"
            onPress={handleRetry}
          />
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  thumbnailContainer: {
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  thumbnailBadgeText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.charcoal,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  textSummary: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  summaryLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xxl,
    color: Colors.charcoal,
    letterSpacing: 4,
  },
  actionsContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});
