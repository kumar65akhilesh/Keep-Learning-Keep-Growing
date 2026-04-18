import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';
import { useOcrStore } from '../store/ocrStore';
import { isLetterMode } from '../utils/characterFilter';
import type { RecognitionMode } from '../types';

/**
 * Settings Screen — Configure app behavior and preferences.
 *
 * Sections:
 * - Recognition: default mode, auto-save
 * - Voice: speaking speed (turtle/rabbit slider), spell-out toggle
 * - Appearance: sound effects toggle
 * - Stats: total characters found (gamification)
 */
export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const totalFound = useOcrStore((s) => s.totalCharactersFound);

  /** Toggle the default recognition mode */
  const handleModeChange = useCallback(
    (mode: RecognitionMode) => {
      settings.setDefaultMode(mode);
    },
    [settings]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.title}>⚙️ Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recognition Section */}
        <Text style={styles.sectionHeader}>🎯 Recognition</Text>
        <View style={styles.section}>
          {/* Default mode */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default Mode</Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  settings.defaultMode === 'read-abc' && styles.modeOptionActive,
                  settings.defaultMode === 'read-abc' && { backgroundColor: Colors.skyBlue },
                ]}
                onPress={() => handleModeChange('read-abc')}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    settings.defaultMode === 'read-abc' && styles.modeOptionTextActive,
                  ]}
                >
                  Read ABC
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  settings.defaultMode === 'read-123' && styles.modeOptionActive,
                  settings.defaultMode === 'read-123' && { backgroundColor: Colors.orange },
                ]}
                onPress={() => handleModeChange('read-123')}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    settings.defaultMode === 'read-123' && styles.modeOptionTextActive,
                  ]}
                >
                  Read 123
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-save */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-save scans</Text>
            <Switch
              value={settings.autoSave}
              onValueChange={settings.setAutoSave}
              trackColor={{ false: Colors.lightGray, true: Colors.grassGreen }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Voice Section */}
        <Text style={styles.sectionHeader}>🔊 Voice</Text>
        <View style={styles.section}>
          {/* Speaking speed */}
          <View style={styles.settingColumn}>
            <Text style={styles.settingLabel}>Speaking Speed</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderEmoji}>🐢</Text>
              <View style={styles.sliderWrapper}>
                {/* Note: @react-native-community/slider needs to be installed.
                    Using a placeholder view if not available. */}
                <View style={styles.sliderPlaceholder}>
                  <View
                    style={[
                      styles.sliderTrack,
                      { width: `${((settings.speechRate - 0.3) / 1.7) * 100}%` },
                    ]}
                  />
                  <View style={styles.sliderThumbRow}>
                    <TouchableOpacity
                      style={styles.speedButton}
                      onPress={() =>
                        settings.setSpeechRate(Math.max(0.3, settings.speechRate - 0.1))
                      }
                    >
                      <Ionicons name="remove" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <Text style={styles.speedValue}>
                      {settings.speechRate.toFixed(1)}x
                    </Text>
                    <TouchableOpacity
                      style={styles.speedButton}
                      onPress={() =>
                        settings.setSpeechRate(Math.min(2.0, settings.speechRate + 0.1))
                      }
                    >
                      <Ionicons name="add" size={18} color={Colors.charcoal} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text style={styles.sliderEmoji}>🐇</Text>
            </View>
          </View>

          {/* Spell out letters */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Spell out letters</Text>
              <Text style={styles.settingHint}>Say "A, B, C" instead of "ABC"</Text>
            </View>
            <Switch
              value={settings.spellOutLetters}
              onValueChange={settings.setSpellOutLetters}
              trackColor={{ false: Colors.lightGray, true: Colors.skyBlue }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionHeader}>🎨 Appearance</Text>
        <View style={styles.section}>
          {/* Sound effects */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Sound effects</Text>
              <Text style={styles.settingHint}>Fun sounds on recognition</Text>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={settings.setSoundEffects}
              trackColor={{ false: Colors.lightGray, true: Colors.purple }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionHeader}>📊 Stats</Text>
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalFound}</Text>
              <Text style={styles.statLabel}>Characters Found 🏆</Text>
            </View>
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>🔍 Letter Lens v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Learn letters & numbers with your camera!</Text>
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
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    color: Colors.charcoal,
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
  sectionHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.charcoal,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
  },
  settingColumn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
  },
  settingLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.charcoal,
  },
  settingHint: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.midGray,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  modeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modeOptionActive: {
    ...Shadows.sm,
  },
  modeOptionText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
  },
  modeOptionTextActive: {
    color: Colors.white,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  sliderEmoji: {
    fontSize: 24,
  },
  sliderWrapper: {
    flex: 1,
  },
  sliderPlaceholder: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: Colors.skyBlue,
    borderRadius: 4,
  },
  sliderThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  speedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedValue: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.charcoal,
    minWidth: 40,
    textAlign: 'center',
  },
  statsRow: {
    padding: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.family.extraBold,
    fontSize: Fonts.size.xxxl,
    color: Colors.orange,
  },
  statLabel: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.md,
    color: Colors.darkGray,
    marginTop: Spacing.xs,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    gap: Spacing.xs,
  },
  appInfoText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.midGray,
  },
  appInfoSubtext: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.midGray,
  },
});
