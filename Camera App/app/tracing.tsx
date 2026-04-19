import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import { isLetterMode } from '../utils/characterFilter';
import { speakCharacter } from '../services/tts';
import * as Speech from 'expo-speech';
import { getStrokes, sampleStroke, type StrokePoint } from '../utils/strokePaths';

// ─── Config ───────────────────────────────────────────────────────
const PROXIMITY_THRESHOLD = 0.12;
const STROKE_COMPLETE_RATIO = 0.60;
const MIN_STROKE_POINTS = 5;

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

interface Point { x: number; y: number; }

// ─── Component ────────────────────────────────────────────────────
export default function TracingScreen() {
  const router = useRouter();
  const mode = useOcrStore((s) => s.mode);
  const letters = isLetterMode(mode);

  const charSet = useMemo(
    () => (letters ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : '123456789'.split('')),
    [letters],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const targetChar = charSet[currentIndex % charSet.length];
  const modeColor = letters ? Colors.grassGreen : Colors.purple;
  const modeLabel = letters ? '✏️ Trace ABC' : '✏️ Trace 123';

  const charStrokes = useMemo(() => getStrokes(targetChar) ?? [], [targetChar]);
  const totalStrokeCount = charStrokes.length;

  const [activeStrokeIdx, setActiveStrokeIdx] = useState(0);
  const [completedStrokes, setCompletedStrokes] = useState<boolean[]>(
    () => new Array(totalStrokeCount).fill(false),
  );
  const currentStroke = useRef<Point[]>([]);
  const [userStrokes, setUserStrokes] = useState<Point[][]>([]);
  const [allDone, setAllDone] = useState(false);
  const [tryAgainMsg, setTryAgainMsg] = useState(false);

  const canvasWidth = useRef(320);
  const canvasHeight = useRef(320);
  const canvasOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<View>(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const successMessage = useRef(SUCCESS_MESSAGES[0]);

  useEffect(() => {
    const count = charStrokes.length;
    setActiveStrokeIdx(0);
    setCompletedStrokes(new Array(count).fill(false));
    setUserStrokes([]);
    setAllDone(false);
    setTryAgainMsg(false);
    currentStroke.current = [];
    successAnim.setValue(0);
  }, [targetChar, charStrokes.length, successAnim]);

  const guideSamples = useMemo(() => {
    return charStrokes.map((stroke) => sampleStroke(stroke, 50));
  }, [charStrokes]);

  const toPixel = useCallback(
    (pt: StrokePoint): Point => ({
      x: pt.x * canvasWidth.current,
      y: pt.y * canvasHeight.current,
    }),
    [],
  );

  const evaluateCurrentStroke = useCallback(
    (drawnPoints: Point[]) => {
      if (drawnPoints.length < MIN_STROKE_POINTS) return false;
      const samples = guideSamples[activeStrokeIdx];
      if (!samples || samples.length === 0) return false;
      const w = canvasWidth.current;
      const h = canvasHeight.current;
      const thresh = PROXIMITY_THRESHOLD * Math.max(w, h);
      let nearCount = 0;
      for (const gpt of samples) {
        const gx = gpt.x * w;
        const gy = gpt.y * h;
        for (const dp of drawnPoints) {
          const dist = Math.sqrt((dp.x - gx) ** 2 + (dp.y - gy) ** 2);
          if (dist <= thresh) { nearCount++; break; }
        }
      }
      const ratio = nearCount / samples.length;
      console.log(`[TRACING] Stroke ${activeStrokeIdx + 1}/${totalStrokeCount} | Near=${nearCount}/${samples.length} (${(ratio * 100).toFixed(0)}%) | Need ${(STROKE_COMPLETE_RATIO * 100).toFixed(0)}%`);
      return ratio >= STROKE_COMPLETE_RATIO;
    },
    [activeStrokeIdx, guideSamples, totalStrokeCount],
  );

  const triggerCharSuccess = useCallback(() => {
    successMessage.current = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    setAllDone(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }).start();
    Speech.speak('Good job!', { pitch: 1.5, rate: 0.85 });
  }, [successAnim]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !allDone,
        onMoveShouldSetPanResponder: () => !allDone,
        onPanResponderGrant: (evt) => {
          if (allDone) return;
          const { pageX, pageY } = evt.nativeEvent;
          currentStroke.current = [{ x: pageX - canvasOffset.current.x, y: pageY - canvasOffset.current.y }];
        },
        onPanResponderMove: (evt) => {
          if (allDone) return;
          const { pageX, pageY } = evt.nativeEvent;
          currentStroke.current.push({ x: pageX - canvasOffset.current.x, y: pageY - canvasOffset.current.y });
          setUserStrokes((prev) => [...prev]);
        },
        onPanResponderRelease: () => {
          if (allDone) return;
          const finished = [...currentStroke.current];
          currentStroke.current = [];
          if (finished.length < 2) return;
          if (evaluateCurrentStroke(finished)) {
            setCompletedStrokes((prev) => { const next = [...prev]; next[activeStrokeIdx] = true; return next; });
            setUserStrokes((prev) => [...prev, finished]);
            setTryAgainMsg(false);
            if (activeStrokeIdx + 1 >= totalStrokeCount) {
              triggerCharSuccess();
            } else {
              setActiveStrokeIdx((i) => i + 1);
              Speech.speak('Nice!', { pitch: 1.4, rate: 1.0 });
            }
          } else {
            setTryAgainMsg(true);
            Speech.speak('Try again!', { pitch: 1.3, rate: 1.0 });
            setTimeout(() => setTryAgainMsg(false), 1800);
          }
        },
      }),
    [allDone, activeStrokeIdx, evaluateCurrentStroke, totalStrokeCount, triggerCharSuccess],
  );

  const resetChar = useCallback(() => {
    setActiveStrokeIdx(0);
    setCompletedStrokes(new Array(charStrokes.length).fill(false));
    setUserStrokes([]);
    setAllDone(false);
    setTryAgainMsg(false);
    currentStroke.current = [];
    successAnim.setValue(0);
  }, [charStrokes.length, successAnim]);

  const handleNext = useCallback(() => setCurrentIndex((i) => i + 1), []);
  const handlePrev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const handleSpeak = useCallback(() => speakCharacter(targetChar), [targetChar]);

  const renderGuidePath = (samples: StrokePoint[], strokeIdx: number) => {
    const isCompleted = completedStrokes[strokeIdx];
    const isActive = strokeIdx === activeStrokeIdx && !allDone;
    const color = isCompleted ? modeColor : isActive ? modeColor : Colors.lightGray;
    const opacity = isCompleted ? 1.0 : isActive ? 0.7 : 0.25;
    const dotSize = isActive ? 7 : 5;
    return samples.map((pt, i) => {
      const px = toPixel(pt);
      if (!isCompleted && i % 2 !== 0) return null;
      return (
        <View
          key={`g${strokeIdx}-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: px.x - dotSize / 2,
            top: px.y - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            opacity,
          }}
        />
      );
    });
  };

  const renderActiveMarkers = () => {
    if (allDone || !guideSamples[activeStrokeIdx]) return null;
    const samples = guideSamples[activeStrokeIdx];
    const start = toPixel(samples[0]);
    const end = toPixel(samples[samples.length - 1]);
    return (
      <>
        <View pointerEvents="none" style={[markerStyles.dot, { left: start.x - 12, top: start.y - 12, backgroundColor: Colors.grassGreen }]}>
          <Text style={markerStyles.dotText}>{'▶'}</Text>
        </View>
        <View pointerEvents="none" style={[markerStyles.dot, { left: end.x - 10, top: end.y - 10, backgroundColor: Colors.coral, width: 20, height: 20 }]}>
          <View style={markerStyles.stopSquare} />
        </View>
      </>
    );
  };

  const renderUserStrokes = () => {
    const all = [...userStrokes, ...(currentStroke.current.length > 1 ? [currentStroke.current] : [])];
    return all.map((stroke, si) =>
      stroke.slice(1).map((point, pi) => {
        const prev = stroke[pi];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`u${si}-${pi}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 5,
              backgroundColor: modeColor,
              borderRadius: 2.5,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        );
      }),
    );
  };

  const strokeLabel = allDone ? 'All strokes done!' : `Stroke ${activeStrokeIdx + 1} of ${totalStrokeCount}`;

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{targetChar}  {'·'}  {currentIndex + 1} / {charSet.length}</Text>
      </View>

      <View style={styles.strokeDotsRow}>
        {charStrokes.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.strokeDot,
              completedStrokes[idx]
                ? { backgroundColor: modeColor }
                : idx === activeStrokeIdx && !allDone
                  ? { backgroundColor: modeColor, opacity: 0.4 }
                  : { backgroundColor: Colors.lightGray },
            ]}
          />
        ))}
        <Text style={styles.strokeLabel}>{strokeLabel}</Text>
      </View>

      <View style={styles.canvasWrapper}>
        <View
          ref={canvasRef}
          style={styles.canvas}
          {...panResponder.panHandlers}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            canvasWidth.current = width;
            canvasHeight.current = height;
            setTimeout(() => {
              canvasRef.current?.measureInWindow?.((x, y) => {
                if (x != null && y != null) {
                  canvasOffset.current = { x, y };
                  console.log('[TRACING] Canvas offset:', x, y);
                }
              });
            }, 150);
          }}
        >
          {guideSamples.map((samples, idx) => renderGuidePath(samples, idx))}
          {renderActiveMarkers()}
          {renderUserStrokes()}
        </View>

        {allDone ? (
          <Animated.View
            style={[
              styles.successBanner,
              {
                backgroundColor: modeColor,
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                opacity: successAnim,
              },
            ]}
          >
            <Text style={styles.successText}>{successMessage.current}</Text>
            <Text style={styles.successDetail}>You traced "{targetChar}" perfectly!</Text>
          </Animated.View>
        ) : tryAgainMsg ? (
          <Text style={[styles.hintText, { color: Colors.coral, fontFamily: Fonts.family.bold }]}>
            Follow the dotted line more closely! 💪
          </Text>
        ) : (
          <Text style={styles.hintText}>Trace from {'▶'} to {'■'} along the dots!</Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { opacity: currentIndex === 0 ? 0.4 : 1 }]} onPress={handlePrev} disabled={currentIndex === 0}>
          <Ionicons name="arrow-back-circle" size={32} color={Colors.darkGray} />
          <Text style={styles.actionLabel}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={resetChar}>
          <Ionicons name="refresh-circle" size={32} color={Colors.coral} />
          <Text style={styles.actionLabel}>Retry</Text>
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

      <View style={styles.charStrip}>
        {charSet.map((char, idx) => (
          <TouchableOpacity
            key={char}
            style={[styles.charChip, idx === currentIndex % charSet.length && { backgroundColor: modeColor }]}
            onPress={() => setCurrentIndex(idx)}
          >
            <Text style={[styles.charChipText, idx === currentIndex % charSet.length && { color: Colors.white }]}>{char}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const markerStyles = StyleSheet.create({
  dot: { position: 'absolute', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  dotText: { color: Colors.white, fontSize: 12, fontFamily: Fonts.family.bold },
  stopSquare: { width: 8, height: 8, borderRadius: 1, backgroundColor: Colors.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softWhite },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modeBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  modeBadgeText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, color: Colors.white },
  speakButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressRow: { alignItems: 'center', paddingBottom: 2 },
  progressText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.midGray },
  strokeDotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: Spacing.sm },
  strokeDot: { width: 10, height: 10, borderRadius: 5 },
  strokeLabel: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.xs, color: Colors.midGray, marginLeft: 6 },
  canvasWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  canvas: { width: '100%', maxWidth: 320, aspectRatio: 1, borderRadius: BorderRadius.xl, borderWidth: 2, borderColor: Colors.lightGray, borderStyle: 'dashed' as const, backgroundColor: Colors.white, overflow: 'hidden' as const },
  hintText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.md, color: Colors.midGray, marginTop: Spacing.md, textAlign: 'center' },
  successBanner: { marginTop: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.full, alignItems: 'center' },
  successText: { fontFamily: Fonts.family.extraBold, fontSize: Fonts.size.xl, color: Colors.white },
  successDetail: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.md, color: Colors.white, marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xxl, paddingVertical: Spacing.md },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.xs, color: Colors.darkGray },
  charStrip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  charChip: { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  charChipText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.sm, color: Colors.darkGray },
});
