import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { CaptureButton } from '../components/camera/CaptureButton';
import { LiveResultStrip } from '../components/camera/LiveResultStrip';
import { OcrOverlay } from '../components/camera/OcrOverlay';
import { useOcrStore } from '../store/ocrStore';
import { useSettingsStore } from '../store/settingsStore';
import { recognizeFromUri } from '../services/ocr';
import { isLetterMode } from '../utils/characterFilter';
import { preprocessImage } from '../services/imagePreprocessing';
import { speakCharacter } from '../services/tts';
import type { RecognizedCharacter } from '../types';

const isWeb = Platform.OS === 'web';

// Only import expo-camera on native platforms
let CameraView: any = null;
let useCameraPermissions: any = null;
if (!isWeb) {
  const cameraModule = require('expo-camera');
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.55;

/**
 * Camera Screen — Live camera preview with OCR recognition.
 *
 * Displays the active recognition mode (ABC or 123) at the top,
 * shows detected characters as colored overlays on the preview,
 * and provides a capture button for detailed recognition.
 */
export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, setPermission] = useState<{ granted: boolean } | null>(
    isWeb ? { granted: false } : null
  );
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const mode = useOcrStore((s) => s.mode);
  const liveCharacters = useOcrStore((s) => s.liveCharacters);
  const setCurrentResult = useOcrStore((s) => s.setCurrentResult);
  const setIsProcessing = useOcrStore((s) => s.setIsProcessing);
  const soundEffects = useSettingsStore((s) => s.soundEffects);

  // Request camera permission on mount (native only)
  useEffect(() => {
    if (isWeb) return;
    if (useCameraPermissions) {
      // This is handled in the render below via the hook
    }
  }, []);

  // Use a wrapper for camera permissions on native
  const [nativePermission, requestNativePermission] = isWeb
    ? [{ granted: false }, () => Promise.resolve({ granted: false })]
    : useCameraPermissions();

  useEffect(() => {
    if (!isWeb && nativePermission && !nativePermission.granted) {
      requestNativePermission();
    }
  }, [nativePermission]);

  const currentPermission = isWeb ? { granted: false } : nativePermission;

  /**
   * Handle capture button press:
   * 1. Take a photo
   * 2. Preprocess the image
   * 3. Run OCR with mode filter
   * 4. Navigate to result screen
   */
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setIsProcessing(true);

      // Take the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }

      // Preprocess for better OCR accuracy
      const processedUri = await preprocessImage(photo.uri, {
        targetWidth: 1280,
        quality: 0.9,
      });

      // Run OCR with mode-specific filtering
      const result = await recognizeFromUri(processedUri, mode);
      setCurrentResult(result);

      // Navigate to result screen
      router.push('/result');
    } catch (error) {
      Alert.alert(
        'Recognition Failed',
        'Could not recognize characters. Please try again with better lighting.'
      );
      console.error('Capture error:', error);
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  }, [mode, isCapturing, setCurrentResult, setIsProcessing, router]);

  /** Toggle between front and back camera */
  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  /** Toggle flash */
  const toggleFlash = useCallback(() => {
    setFlash((prev) => !prev);
  }, []);

  /** Handle tapping a detected character bubble (speaks it aloud) */
  const handleCharacterPress = useCallback(
    (char: RecognizedCharacter) => {
      speakCharacter(char.text);
    },
    []
  );

  // Permission not granted or web platform
  if (isWeb) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.midGray} />
        <Text style={styles.permissionTitle}>Camera Not Available</Text>
        <Text style={styles.permissionText}>
          Camera requires a native device. Use an Android emulator or physical phone to test OCR features.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            // Demo mode: create a mock result so user can see the Result screen
            setCurrentResult({
              characters: [
                { text: isLetterMode(mode) ? 'A' : '1', confidence: 0.98, boundingBox: { x: 0.1, y: 0.1, width: 0.1, height: 0.15 } },
                { text: isLetterMode(mode) ? 'B' : '2', confidence: 0.95, boundingBox: { x: 0.3, y: 0.1, width: 0.1, height: 0.15 } },
                { text: isLetterMode(mode) ? 'C' : '3', confidence: 0.92, boundingBox: { x: 0.5, y: 0.1, width: 0.1, height: 0.15 } },
                { text: isLetterMode(mode) ? 'D' : '4', confidence: 0.88, boundingBox: { x: 0.7, y: 0.1, width: 0.1, height: 0.15 } },
                { text: isLetterMode(mode) ? 'E' : '5', confidence: 0.85, boundingBox: { x: 0.2, y: 0.4, width: 0.1, height: 0.15 } },
              ],
              mode,
              timestamp: Date.now(),
              rawText: isLetterMode(mode) ? 'ABCDE' : '12345',
            });
            router.push('/result');
          }}
        >
          <Text style={styles.permissionButtonText}>
            Try Demo Mode →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionButton, { backgroundColor: Colors.midGray, marginTop: Spacing.md }]} onPress={() => router.back()}>
          <Text style={styles.permissionButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentPermission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.midGray} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Letter Lens needs your camera to recognize {isLetterMode(mode) ? 'letters' : 'numbers'}.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestNativePermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const modeLabel = isLetterMode(mode) ? '🔤 Read ABC' : '🔢 Read 123';
  const modeColor = isLetterMode(mode) ? Colors.skyBlue : Colors.orange;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.charcoal} />
        </TouchableOpacity>

        <View style={[styles.modeBadge, { backgroundColor: modeColor }]}>
          <Text style={styles.modeBadgeText}>{modeLabel}</Text>
        </View>

        <View style={styles.topBarSpacer} />
      </View>

      {/* Camera preview */}
      <View style={styles.previewContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash ? 'on' : 'off'}
        />

        {/* OCR overlay on top of camera */}
        <OcrOverlay
          characters={liveCharacters}
          previewWidth={SCREEN_WIDTH - Spacing.lg * 2}
          previewHeight={PREVIEW_HEIGHT}
        />

        {/* Scanning indicator */}
        <View style={styles.scanningIndicator}>
          <View style={[styles.scanDot, { backgroundColor: modeColor }]} />
          <Text style={styles.scanText}>
            Looking for {isLetterMode(mode) ? 'letters A–Z' : 'numbers 1–9'}
          </Text>
        </View>
      </View>

      {/* Live result strip */}
      <LiveResultStrip
        characters={liveCharacters}
        onCharacterPress={handleCharacterPress}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleFacing}
          style={styles.controlButton}
          accessibilityLabel="Flip camera"
        >
          <Ionicons name="camera-reverse-outline" size={28} color={Colors.charcoal} />
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>

        <CaptureButton onCapture={handleCapture} disabled={isCapturing} />

        <TouchableOpacity
          onPress={toggleFlash}
          style={styles.controlButton}
          accessibilityLabel={flash ? 'Turn off flash' : 'Turn on flash'}
        >
          <Ionicons
            name={flash ? 'flash' : 'flash-outline'}
            size={28}
            color={flash ? Colors.orange : Colors.charcoal}
          />
          <Text style={styles.controlLabel}>Flash</Text>
        </TouchableOpacity>
      </View>

      {/* Loading overlay during capture */}
      {isCapturing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>🔍</Text>
            <Text style={styles.loadingText}>
              Finding {isLetterMode(mode) ? 'letters' : 'numbers'}...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softWhite,
  },
  topBar: {
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
  topBarSpacer: {
    width: 44,
  },
  previewContainer: {
    marginHorizontal: Spacing.lg,
    height: PREVIEW_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.charcoal,
    ...Shadows.lg,
  },
  camera: {
    flex: 1,
  },
  scanningIndicator: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  scanText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.darkGray,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxxl,
  },
  controlButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  controlLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.darkGray,
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softWhite,
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  permissionTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.skyBlue,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  permissionButtonText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.white,
  },
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.charcoal,
  },
});
