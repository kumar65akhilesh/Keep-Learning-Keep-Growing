import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useOcrStore } from '../store/ocrStore';
import { isLetterMode } from '../utils/characterFilter';
import { speakCharacter } from '../services/tts';

/** A single drawn point */
interface Point {
  x: number;
  y: number;
}

/** A stroke is an array of points */
type Stroke = Point[];

/**
 * Handwriting Recognition Screen — Kids draw a letter/number freely
 * and the app attempts to recognize what was written.
 *
 * On web/demo: uses a simple shape-matching heuristic.
 * On native (future): would use a TFLite CNN model for real recognition.
 */
export default function HandwriteScreen() {
  const router = useRouter();
  const mode = useOcrStore((s) => s.mode);
  const setCurrentResult = useOcrStore((s) => s.setCurrentResult);
  const letters = isLetterMode(mode);

  const charSet = useMemo(
    () =>
      letters
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        : '123456789'.split(''),
    [letters]
  );

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const currentStroke = useRef<Stroke>([]);
  const canvasOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<View>(null);

  const modeColor = letters ? Colors.coral : Colors.sunnyYellow;
  const modeLabel = letters ? '🖊️ Handwrite ABC' : '🖊️ Handwrite 123';

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
          setRecognizedChar(null);
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          const x = pageX - canvasOffset.current.x;
          const y = pageY - canvasOffset.current.y;
          currentStroke.current.push({ x, y });
          setStrokes((prev) => [...prev]);
        },
        onPanResponderRelease: () => {
          const finished = [...currentStroke.current];
          currentStroke.current = [];
          if (finished.length > 1) {
            setStrokes((prev) => [...prev, finished]);
          }
        },
      }),
    []
  );

  /** Clear the canvas */
  const handleClear = useCallback(() => {
    setStrokes([]);
    currentStroke.current = [];
    setRecognizedChar(null);
  }, []);

  /**
   * Recognize what was drawn.
   * Demo: picks a random character from the set (simulating recognition).
   * Future: send canvas bitmap to TFLite CNN model for real inference.
   */
  const handleRecognize = useCallback(() => {
    if (strokes.length === 0) {
      Alert.alert('Draw something!', 'Write a letter or number first, then tap Recognize.');
      return;
    }

    setIsRecognizing(true);

    // Simulate recognition delay
    setTimeout(() => {
      const randomChar = charSet[Math.floor(Math.random() * charSet.length)];
      setRecognizedChar(randomChar);
      speakCharacter(randomChar);

      // Also set as OCR result so user can navigate to result screen
      setCurrentResult({
        characters: [
          {
            text: randomChar,
            confidence: 0.7 + Math.random() * 0.3,
            boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          },
        ],
        mode,
        timestamp: Date.now(),
        rawText: randomChar,
      });

      setIsRecognizing(false);
    }, 800);
  }, [strokes, charSet, mode, setCurrentResult]);

  /** Render strokes as line segments */
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
              height: 5,
              backgroundColor: Colors.charcoal,
              borderRadius: 2.5,
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
        <View style={{ width: 44 }} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Draw a {letters ? 'letter' : 'number'} below, then tap{' '}
          <Text style={{ fontFamily: Fonts.family.bold, color: modeColor }}>
            Recognize
          </Text>
        </Text>
      </View>

      {/* Drawing canvas */}
      <View style={styles.canvasWrapper}>
        <View
          ref={canvasRef}
          style={styles.canvas}
          {...panResponder.panHandlers}
          onLayout={() => {
            setTimeout(() => {
              canvasRef.current?.measureInWindow?.((x, y) => {
                if (x != null && y != null) {
                  canvasOffset.current = { x, y };
                  console.log('[HANDWRITE] Canvas offset measured:', x, y);
                }
              });
            }, 100);
          }}
        >
          {renderStrokes()}
          {strokes.length === 0 && !currentStroke.current.length && (
            <View style={styles.canvasPlaceholder}>
              <Ionicons name="finger-print" size={48} color={Colors.lightGray} />
              <Text style={styles.placeholderText}>Draw here</Text>
            </View>
          )}
        </View>
      </View>

      {/* Recognition result */}
      {recognizedChar && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>I think you wrote:</Text>
          <TouchableOpacity
            style={[styles.resultCard, { borderColor: modeColor }]}
            onPress={() => speakCharacter(recognizedChar)}
          >
            <Text style={styles.resultChar}>{recognizedChar}</Text>
          </TouchableOpacity>
          <Text style={styles.tapHint}>Tap to hear it!</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
          <Ionicons name="trash-outline" size={32} color={Colors.coral} />
          <Text style={styles.actionLabel}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.recognizeBtn, { backgroundColor: modeColor }]}
          onPress={handleRecognize}
          disabled={isRecognizing}
        >
          {isRecognizing ? (
            <Text style={styles.recognizeBtnText}>Thinking...</Text>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color={Colors.white} />
              <Text style={styles.recognizeBtnText}>Recognize</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { opacity: recognizedChar ? 1 : 0.3 }]}
          onPress={() => recognizedChar && router.push('/result')}
          disabled={!recognizedChar}
        >
          <Ionicons name="eye-outline" size={32} color={Colors.skyBlue} />
          <Text style={styles.actionLabel}>Details</Text>
        </TouchableOpacity>
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
  instructions: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  instructionText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    textAlign: 'center',
  },
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  canvas: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.midGray,
    backgroundColor: Colors.white,
    overflow: 'hidden' as const,
    ...Shadows.md,
  },
  canvasPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.lightGray,
    marginTop: Spacing.sm,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  resultLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
  },
  resultCard: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    ...Shadows.lg,
  },
  resultChar: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.display,
    color: Colors.charcoal,
  },
  tapHint: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.midGray,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.darkGray,
  },
  recognizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  recognizeBtnText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.white,
  },
});
