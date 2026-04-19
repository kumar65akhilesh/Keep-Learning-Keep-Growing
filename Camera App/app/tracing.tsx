import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import { isLetterMode } from '../utils/characterFilter';
import { speakCharacter } from '../services/tts';
import * as Speech from 'expo-speech';
import { getExpectedCells, PATTERN_COLS, PATTERN_ROWS } from '../utils/charPatterns';

/**
 * Minimum fraction of the reference pattern cells that must be
 * covered by the user's strokes to count as a successful trace.
 * Deliberately lenient for young kids.
 */
const MATCH_THRESHOLD = 0.25;
/**
 * Minimum fraction of the user's visited cells that must land
 * on expected cells (precision). Prevents random shapes like
 * circles from passing by penalising drawing in wrong areas.
 */
const PRECISION_THRESHOLD = 0.50;
/** Minimum number of total drawn points before we even evaluate */
const MIN_POINTS = 10;

const SUCCESS_MESSAGES = [
  'Good Job! 🌟',
  'Amazing! 🎉',
  'You did it! 🏆',
  'Awesome! ⭐',
  'Super Star! 🎊',
  'Fantastic! 💫',
  'Brilliant! ✨',
  'Way to go! 🌈',
];

/** A single drawn point */
interface Point {
  x: number;
  y: number;
}

/** A stroke is an array of points */
type Stroke = Point[];

/**
 * Tracing Practice Screen — Kids trace letters or numbers over a guide.
 *
 * Shows a large faded target character.
 * Kids draw on the canvas; they can clear, hear the letter, or skip to the next.
 */
export default function TracingScreen() {
  const router = useRouter();
  const mode = useOcrStore((s) => s.mode);
  const letters = isLetterMode(mode);

  const charSet = useMemo(
    () =>
      letters
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        : '123456789'.split(''),
    [letters]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tracedSuccess, setTracedSuccess] = useState(false);
  const currentStroke = useRef<Stroke>([]);
  const canvasWidth = useRef(320);
  const canvasHeight = useRef(320);
  const successAnim = useRef(new Animated.Value(0)).current;

  const [tryAgainMsg, setTryAgainMsg] = useState(false);
  const canvasOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<View>(null);

  const targetChar = charSet[currentIndex % charSet.length];
  const modeColor = letters ? Colors.grassGreen : Colors.purple;
  const modeLabel = letters ? '✏️ Trace ABC' : '✏️ Trace 123';
  const successMessage = useRef(SUCCESS_MESSAGES[0]);

  /**
   * Evaluate whether the user's strokes match the reference
   * pattern for the current character.
   *
   * Maps stroke points into the 5×7 character grid
   * (using the centre 70% of the canvas to account for font padding)
   * and checks overlap with expected cells.
   */
  const evaluatePattern = useCallback(
    (allStrokes: Stroke[]): boolean => {
      const totalPoints = allStrokes.reduce((sum, s) => sum + s.length, 0);
      if (totalPoints < MIN_POINTS) return false;

      const expected = getExpectedCells(targetChar);
      if (!expected || expected.size === 0) return false;

      const w = canvasWidth.current;
      const h = canvasHeight.current;

      // The guide character (font 220px inside ~320px canvas)
      // occupies roughly the central 70% of the canvas.
      const marginX = w * 0.15;
      const marginY = h * 0.15;
      const activeW = w * 0.70;
      const activeH = h * 0.70;

      const cellW = activeW / PATTERN_COLS;
      const cellH = activeH / PATTERN_ROWS;

      const visited = new Set<string>();
      const allVisited = new Set<string>();
      for (const stroke of allStrokes) {
        for (const pt of stroke) {
          const col = Math.floor((pt.x - marginX) / cellW);
          const row = Math.floor((pt.y - marginY) / cellH);
          if (col >= 0 && col < PATTERN_COLS && row >= 0 && row < PATTERN_ROWS) {
            const key = `${col},${row}`;
            allVisited.add(key);
            if (expected.has(key)) {
              visited.add(key);
            }
          }
        }
      }

      // ── Anti-circle detection ──
      // A circle has very uniform distance from its centroid (low
      // coefficient of variation). Real letter tracing has varying
      // distances because strokes go through the centre, not just
      // around the perimeter.
      // Characters that are naturally circular (O, D, Q, C, 0) are exempt.
      const CIRCULAR_CHARS = new Set(['O', 'D', 'Q', 'C', '0']);
      if (!CIRCULAR_CHARS.has(targetChar)) {
        let sumX = 0, sumY = 0, ptCount = 0;
        for (const stroke of allStrokes) {
          for (const pt of stroke) {
            sumX += pt.x;
            sumY += pt.y;
            ptCount++;
          }
        }
        if (ptCount > 0) {
          const cx = sumX / ptCount;
          const cy = sumY / ptCount;
          let sumDist = 0, sumDistSq = 0;
          for (const stroke of allStrokes) {
            for (const pt of stroke) {
              const d = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
              sumDist += d;
              sumDistSq += d * d;
            }
          }
          const meanDist = sumDist / ptCount;
          const variance = sumDistSq / ptCount - meanDist * meanDist;
          // Coefficient of variation: std-dev / mean
          const cv = meanDist > 0 ? Math.sqrt(Math.max(0, variance)) / meanDist : 1;
          console.log(`[TRACING] Circularity CV=${cv.toFixed(3)} (circle ≈ 0.05-0.15, letter > 0.25)`);
          if (cv < 0.20) {
            console.log('[TRACING] REJECTED — stroke looks like a circle, not a letter trace');
            return false;
          }
        }
      }

      // Coverage: how much of the expected pattern was traced
      const coverage = visited.size / expected.size;
      // Precision: how much of what was drawn lands on expected cells
      const precision = allVisited.size > 0 ? visited.size / allVisited.size : 0;

      console.log(`[TRACING] Char="${targetChar}" | Points=${totalPoints} | Canvas=${w}x${h} | Offset=(${canvasOffset.current.x},${canvasOffset.current.y})`);
      console.log(`[TRACING] Expected=${expected.size} cells | Visited=${visited.size}/${allVisited.size} | Coverage=${(coverage*100).toFixed(1)}% | Precision=${(precision*100).toFixed(1)}%`);
      console.log(`[TRACING] Pass: coverage>=${MATCH_THRESHOLD*100}% && precision>=${PRECISION_THRESHOLD*100}% → ${coverage >= MATCH_THRESHOLD && precision >= PRECISION_THRESHOLD}`);

      return coverage >= MATCH_THRESHOLD && precision >= PRECISION_THRESHOLD;
    },
    [targetChar]
  );

  /** Trigger success animation + TTS */
  const triggerSuccess = useCallback(() => {
    successMessage.current =
      SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    setTracedSuccess(true);
    setTryAgainMsg(false);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start();
    Speech.speak('Good job!', { pitch: 1.5, rate: 0.85 });
  }, [successAnim]);

  /** Handle the "Check" button — evaluate and give feedback */
  const handleCheck = useCallback(() => {
    if (tracedSuccess) return;

    // Debug: show offset info so we can verify measurement works
    const totalPts = strokes.reduce((sum, s) => sum + s.length, 0);
    const firstPt = strokes[0]?.[0];
    console.log(`[TRACING] Check pressed. Strokes=${strokes.length}, TotalPts=${totalPts}, FirstPt=(${firstPt?.x?.toFixed(0)},${firstPt?.y?.toFixed(0)}), Offset=(${canvasOffset.current.x.toFixed(0)},${canvasOffset.current.y.toFixed(0)})`);

    if (evaluatePattern(strokes)) {
      triggerSuccess();
    } else {
      // Show "try again" hint briefly
      setTryAgainMsg(true);
      Speech.speak('Try again!', { pitch: 1.5, rate: 0.85 });
      setTimeout(() => setTryAgainMsg(false), 2000);
    }
  }, [strokes, tracedSuccess, evaluatePattern, triggerSuccess]);

  /** PanResponder for drawing */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          const x = pageX - canvasOffset.current.x;
          const y = pageY - canvasOffset.current.y;
          currentStroke.current = [{ x, y }];
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          const x = pageX - canvasOffset.current.x;
          const y = pageY - canvasOffset.current.y;
          currentStroke.current.push({ x, y });
          // Force re-render to show stroke in progress
          setStrokes((prev) => [...prev]);
        },
        onPanResponderRelease: () => {
          const finishedStroke = [...currentStroke.current];
          currentStroke.current = [];
          if (finishedStroke.length > 1) {
            setStrokes((prev) => {
              const updated = [...prev, finishedStroke];
              return updated;
            });
          }
        },
      }),
    []
  );

  /** Clear the canvas / Retry */
  const handleRetry = useCallback(() => {
    setStrokes([]);
    currentStroke.current = [];
    setTracedSuccess(false);
    setTryAgainMsg(false);
    successAnim.setValue(0);
  }, [successAnim]);

  /** Go to next character */
  const handleNext = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setStrokes([]);
    currentStroke.current = [];
    setTracedSuccess(false);
    setTryAgainMsg(false);
    successAnim.setValue(0);
  }, [successAnim]);

  /** Go to previous character */
  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setStrokes([]);
    currentStroke.current = [];
    setTracedSuccess(false);
    setTryAgainMsg(false);
    successAnim.setValue(0);
  }, [successAnim]);

  /** Speak the target character */
  const handleSpeak = useCallback(() => {
    speakCharacter(targetChar);
  }, [targetChar]);

  /** Render strokes as SVG-like paths (using View-based line segments) */
  const renderStrokes = () => {
    const allStrokes = [
      ...strokes,
      ...(currentStroke.current.length > 1 ? [currentStroke.current] : []),
    ];

    return allStrokes.map((stroke, si) =>
      stroke.slice(1).map((point, pi) => {
        const prev = stroke[pi];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={`s${si}-p${pi}`}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 4,
              backgroundColor: modeColor,
              borderRadius: 2,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        );
      })
    );
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
        <TouchableOpacity onPress={handleSpeak} style={styles.speakButton}>
          <Ionicons name="volume-high" size={24} color={modeColor} />
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {charSet.length}
        </Text>
      </View>

      {/* Drawing canvas */}
      <View style={styles.canvasWrapper}>
        {/* Drawing surface */}
        <View
          ref={canvasRef}
          style={styles.canvas}
          {...panResponder.panHandlers}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            canvasWidth.current = width;
            canvasHeight.current = height;
            // Use ref.measureInWindow for reliable absolute position on Android
            setTimeout(() => {
              canvasRef.current?.measureInWindow?.((x, y, w, h) => {
                if (x != null && y != null) {
                  canvasOffset.current = { x, y };
                  console.log('[TRACING] Canvas offset measured:', x, y, 'size:', w, h);
                }
              });
            }, 100);
          }}
        >
          {/* Target character (faded guide — inside canvas so it's visible) */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Text style={[styles.guideChar, { color: `${modeColor}30`, width: '100%', height: '100%' }]}>
              {targetChar}
            </Text>
          </View>
          {renderStrokes()}
        </View>

        {/* Hint or success message */}
        {tracedSuccess ? (
          <Animated.View
            style={[
              styles.successBanner,
              {
                backgroundColor: modeColor,
                transform: [
                  {
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
                opacity: successAnim,
              },
            ]}
          >
            <Text style={styles.successText}>{successMessage.current}</Text>
            <Text style={styles.successDetail}>
              You traced "{targetChar}" perfectly!
            </Text>
          </Animated.View>
        ) : tryAgainMsg ? (
          <Text style={[styles.hintText, { color: Colors.coral, fontFamily: Fonts.family.bold }]}>
            Almost! Keep tracing the {letters ? 'letter' : 'number'} "{targetChar}" 💪
          </Text>
        ) : (
          <Text style={styles.hintText}>
            Trace the {letters ? 'letter' : 'number'} "{targetChar}" above!
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { opacity: currentIndex === 0 ? 0.4 : 1 }]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back-circle" size={32} color={Colors.darkGray} />
          <Text style={styles.actionLabel}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleRetry}>
          <Ionicons name="refresh-circle" size={32} color={Colors.coral} />
          <Text style={styles.actionLabel}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.checkBtn, { backgroundColor: tracedSuccess ? Colors.midGray : modeColor }]}
          onPress={handleCheck}
          disabled={tracedSuccess || strokes.length === 0}
        >
          <Ionicons name="checkmark-circle" size={36} color={Colors.white} />
          <Text style={[styles.actionLabel, { color: Colors.white }]}>Check</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSpeak}>
          <Ionicons name="volume-high" size={32} color={Colors.skyBlue} />
          <Text style={styles.actionLabel}>Hear It</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
          <Ionicons name="arrow-forward-circle" size={32} color={modeColor} />
          <Text style={styles.actionLabel}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Character picker strip */}
      <View style={styles.charStrip}>
        {charSet.map((char, idx) => (
          <TouchableOpacity
            key={char}
            style={[
              styles.charChip,
              idx === currentIndex % charSet.length && {
                backgroundColor: modeColor,
              },
            ]}
            onPress={() => {
              setCurrentIndex(idx);
              setStrokes([]);
              currentStroke.current = [];
              setTracedSuccess(false);
              setTryAgainMsg(false);
              successAnim.setValue(0);
            }}
          >
            <Text
              style={[
                styles.charChipText,
                idx === currentIndex % charSet.length && { color: Colors.white },
              ]}
            >
              {char}
            </Text>
          </TouchableOpacity>
        ))}
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modeBadgeText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.white,
  },
  speakButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  progressText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
  },
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  guideChar: {
    position: 'absolute',
    fontFamily: Fonts.family.extraBold,
    fontSize: 220,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  canvas: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed' as const,
    backgroundColor: Colors.white,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  hintText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  successBanner: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  successText: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xl,
    color: Colors.white,
  },
  successDetail: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.white,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  checkBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  actionLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.darkGray,
  },
  charStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  charChip: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charChipText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.darkGray,
  },
});
