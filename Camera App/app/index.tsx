import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import type { RecognitionMode } from '../types';

interface ModeCard {
  mode: RecognitionMode;
  emoji: string;
  title: string;
  subtitle: string;
  preview: string;
  bgColor: string;
  borderColor: string;
  route: '/camera' | '/tracing' | '/handwrite';
  icon: keyof typeof Ionicons.glyphMap;
}

const MODE_CARDS: ModeCard[] = [
  {
    mode: 'read-abc',
    emoji: '📖',
    title: 'Read ABC',
    subtitle: 'Scan letters with camera',
    preview: 'A B C D E',
    bgColor: '#E8F8FF',
    borderColor: Colors.skyBlue,
    route: '/camera',
    icon: 'camera-outline',
  },
  {
    mode: 'trace-abc',
    emoji: '✏️',
    title: 'Trace ABC',
    subtitle: 'Trace over guide letters',
    preview: 'A B C D E',
    bgColor: '#E8FFE8',
    borderColor: Colors.grassGreen,
    route: '/tracing',
    icon: 'finger-print-outline',
  },
  {
    mode: 'handwrite-abc',
    emoji: '🖊️',
    title: 'Handwrite ABC',
    subtitle: 'Write freely & recognize',
    preview: 'A B C D E',
    bgColor: '#FFF0F5',
    borderColor: Colors.coral,
    route: '/handwrite',
    icon: 'create-outline',
  },
  {
    mode: 'read-123',
    emoji: '🔢',
    title: 'Read 123',
    subtitle: 'Scan numbers with camera',
    preview: '1 2 3 4 5',
    bgColor: '#FFF3E0',
    borderColor: Colors.orange,
    route: '/camera',
    icon: 'camera-outline',
  },
  {
    mode: 'trace-123',
    emoji: '✏️',
    title: 'Trace 123',
    subtitle: 'Trace over guide numbers',
    preview: '1 2 3 4 5',
    bgColor: '#F3E8FF',
    borderColor: Colors.purple,
    route: '/tracing',
    icon: 'finger-print-outline',
  },
  {
    mode: 'handwrite-123',
    emoji: '🖊️',
    title: 'Handwrite 123',
    subtitle: 'Write freely & recognize',
    preview: '1 2 3 4 5',
    bgColor: '#FFF8E0',
    borderColor: Colors.sunnyYellow,
    route: '/handwrite',
    icon: 'create-outline',
  },
];

/**
 * Home Screen — 2×3 grid: Read / Trace / Handwrite × Letters / Numbers.
 */
export default function HomeScreen() {
  const router = useRouter();
  const setMode = useOcrStore((s) => s.setMode);
  const { width } = useWindowDimensions();

  const maxCardWidth = 160;
  const cardWidth = Math.min(maxCardWidth, (width - Spacing.lg * 3) / 2);
  const cardHeight = cardWidth * 1.15;

  const handleSelectMode = (card: ModeCard) => {
    setMode(card.mode);
    router.push(card.route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>🔍 Letter Lens</Text>
            <Text style={styles.subtitle}>What do you want to do?</Text>
          </View>

          {/* 2×2 Card Grid */}
          <View style={styles.cardsGrid}>
            {MODE_CARDS.map((card) => (
              <TouchableOpacity
                key={card.mode}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: card.bgColor,
                    borderColor: card.borderColor,
                  },
                ]}
                onPress={() => handleSelectMode(card)}
                activeOpacity={0.85}
                accessibilityLabel={`${card.title}: ${card.subtitle}`}
                accessibilityRole="button"
              >
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <View style={styles.cardPreview}>
                  <Text style={styles.previewLetters}>{card.preview}</Text>
                </View>
                <View style={[styles.goButton, { backgroundColor: card.borderColor }]}>
                  <Ionicons name={card.icon} size={20} color={Colors.white} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/history')}
              accessibilityLabel="View history"
            >
              <Ionicons name="time-outline" size={28} color={Colors.darkGray} />
              <Text style={styles.navLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={28} color={Colors.darkGray} />
              <Text style={styles.navLabel}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Stats teaser */}
          <View style={styles.statsBar}>
            <Ionicons name="trophy" size={18} color={Colors.orange} />
            <Text style={styles.statsText}>You've found 0 characters so far!</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softWhite,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  appName: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xxxl,
    color: Colors.charcoal,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.lg,
    color: Colors.midGray,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xl,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.midGray,
    marginTop: 2,
    textAlign: 'center',
  },
  cardPreview: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  previewLetters: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.darkGray,
    letterSpacing: 2,
    textAlign: 'center',
  },
  goButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
  navButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.darkGray,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  statsText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
  },
});
