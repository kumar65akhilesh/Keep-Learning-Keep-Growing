import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
  ImageBackground,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import type { RecognitionMode } from '../types';

/** Cartoon icon definition rendered as layered badge */
interface CartoonIcon {
  /** Background circle color */
  bg: string;
  /** Main Ionicon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon color */
  iconColor: string;
  /** Small decorative accent emoji (top-right sparkle) */
  accent: string;
  /** Tiny secondary icon at bottom-left */
  miniIcon: keyof typeof Ionicons.glyphMap;
  miniColor: string;
}

interface ModeCard {
  mode: RecognitionMode;
  title: string;
  subtitle: string;
  preview: string;
  bgColor: string;
  borderColor: string;
  route: '/camera' | '/tracing' | '/handwrite';
  cartoon: CartoonIcon;
  tileImage: ImageSourcePropType;
}

const MODE_CARDS: ModeCard[] = [
  {
    mode: 'read-abc',
    title: 'Read ABC',
    subtitle: 'Scan letters with camera',
    preview: 'A B C D E',
    bgColor: '#E8F8FF',
    borderColor: Colors.skyBlue,
    route: '/camera',
    tileImage: require('../assets/tile-read-abc.png'),
    cartoon: {
      bg: '#4CC9F0',
      icon: 'camera',
      iconColor: '#fff',
      accent: '✨',
      miniIcon: 'text',
      miniColor: '#FFD60A',
    },
  },
  {
    mode: 'trace-abc',
    title: 'Trace ABC',
    subtitle: 'Trace over guide letters',
    preview: 'A B C D E',
    bgColor: '#E8FFE8',
    borderColor: Colors.grassGreen,
    route: '/tracing',
    tileImage: require('../assets/tile-trace-abc.png'),
    cartoon: {
      bg: '#06D6A0',
      icon: 'finger-print',
      iconColor: '#fff',
      accent: '🌟',
      miniIcon: 'pencil',
      miniColor: '#FF9E00',
    },
  },
  {
    mode: 'handwrite-abc',
    title: 'Handwrite ABC',
    subtitle: 'Write freely & recognize',
    preview: 'A B C D E',
    bgColor: '#FFF0F5',
    borderColor: Colors.coral,
    route: '/handwrite',
    tileImage: require('../assets/tile-handwrite-abc.png'),
    cartoon: {
      bg: '#F72585',
      icon: 'color-palette',
      iconColor: '#fff',
      accent: '🎨',
      miniIcon: 'sparkles',
      miniColor: '#FFD60A',
    },
  },
  {
    mode: 'read-123',
    title: 'Read 123',
    subtitle: 'Scan numbers with camera',
    preview: '1 2 3 4 5',
    bgColor: '#FFF3E0',
    borderColor: Colors.orange,
    route: '/camera',
    tileImage: require('../assets/tile-read-123.png'),
    cartoon: {
      bg: '#FF9E00',
      icon: 'camera',
      iconColor: '#fff',
      accent: '🔍',
      miniIcon: 'calculator',
      miniColor: '#F72585',
    },
  },
  {
    mode: 'trace-123',
    title: 'Trace 123',
    subtitle: 'Trace over guide numbers',
    preview: '1 2 3 4 5',
    bgColor: '#F3E8FF',
    borderColor: Colors.purple,
    route: '/tracing',
    tileImage: require('../assets/tile-trace-123.png'),
    cartoon: {
      bg: '#7B2FF7',
      icon: 'finger-print',
      iconColor: '#fff',
      accent: '💫',
      miniIcon: 'pencil',
      miniColor: '#06D6A0',
    },
  },
  {
    mode: 'handwrite-123',
    title: 'Handwrite 123',
    subtitle: 'Write freely & recognize',
    preview: '1 2 3 4 5',
    bgColor: '#FFF8E0',
    borderColor: Colors.sunnyYellow,
    route: '/handwrite',
    tileImage: require('../assets/tile-handwrite-123.png'),
    cartoon: {
      bg: '#FFD60A',
      icon: 'color-palette',
      iconColor: '#4A4A4A',
      accent: '⭐',
      miniIcon: 'sparkles',
      miniColor: '#F72585',
    },
  },
];

/** Cartoon icon badge — layered circle with icon, sparkle, and mini-icon */
function CartoonBadge({ cartoon, size }: { cartoon: CartoonIcon; size: number }) {
  const iconSize = size * 0.48;
  const miniSize = size * 0.22;
  return (
    <View style={[cartoonStyles.badgeOuter, { width: size, height: size }]}>
      {/* Outer ring (lighter) */}
      <View
        style={[
          cartoonStyles.badgeRing,
          { width: size, height: size, borderRadius: size / 2, borderColor: cartoon.bg + '50' },
        ]}
      />
      {/* Main circle */}
      <View
        style={[
          cartoonStyles.badgeCircle,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: (size * 0.82) / 2,
            backgroundColor: cartoon.bg,
          },
        ]}
      >
        {/* Inner highlight (top-left shine) */}
        <View
          style={[
            cartoonStyles.shine,
            {
              width: size * 0.22,
              height: size * 0.12,
              borderRadius: size * 0.06,
              top: size * 0.08,
              left: size * 0.12,
            },
          ]}
        />
        <Ionicons name={cartoon.icon} size={iconSize} color={cartoon.iconColor} />
      </View>
      {/* Sparkle accent (top-right) */}
      <View style={[cartoonStyles.accentBubble, { top: -2, right: -2 }]}>
        <Text style={{ fontSize: size * 0.24 }}>{cartoon.accent}</Text>
      </View>
      {/* Mini icon (bottom-left) */}
      <View
        style={[
          cartoonStyles.miniBadge,
          {
            width: miniSize,
            height: miniSize,
            borderRadius: miniSize / 2,
            backgroundColor: cartoon.miniColor,
            bottom: 0,
            left: 0,
          },
        ]}
      >
        <Ionicons name={cartoon.miniIcon} size={miniSize * 0.55} color="#fff" />
      </View>
    </View>
  );
}

const cartoonStyles = StyleSheet.create({
  badgeOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  badgeRing: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  badgeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  accentBubble: {
    position: 'absolute',
  },
  miniBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.sm,
  },
});

/**
 * Home Screen — 2×3 grid: Read / Trace / Handwrite × Letters / Numbers.
 */
export default function HomeScreen() {
  const router = useRouter();
  const setMode = useOcrStore((s) => s.setMode);
  const { width } = useWindowDimensions();

  const maxCardWidth = 160;
  const cardWidth = Math.min(maxCardWidth, (width - Spacing.lg * 3) / 2);
  const cardHeight = cardWidth * 1.3;
  const badgeSize = cardWidth * 0.45;

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
            <Text style={styles.appName}>� Little Letters</Text>
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
                    borderColor: card.borderColor,
                  },
                ]}
                onPress={() => handleSelectMode(card)}
                activeOpacity={0.85}
                accessibilityLabel={`${card.title}: ${card.subtitle}`}
                accessibilityRole="button"
              >
                <ImageBackground
                  source={card.tileImage}
                  resizeMode="cover"
                  style={styles.tileBg}
                  imageStyle={[
                    styles.tileBgImage,
                    { backgroundColor: card.bgColor },
                  ]}
                >
                  <CartoonBadge cartoon={card.cartoon} size={badgeSize} />
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  <View style={styles.cardPreview}>
                    <Text style={styles.previewLetters}>{card.preview}</Text>
                  </View>
                </ImageBackground>
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
    overflow: 'hidden',
    ...Shadows.md,
  },
  tileBg: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBgImage: {
    borderRadius: BorderRadius.xl - 2,
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
