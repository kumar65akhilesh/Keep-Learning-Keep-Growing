import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { LetterBubble } from '../components/common/LetterBubble';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useHistoryStore } from '../store/historyStore';
import { useOcrStore } from '../store/ocrStore';
import { getScans, deleteScan, searchScans, deleteAllScans } from '../services/history';
import type { ScanRecord } from '../types';

/**
 * History Screen — Displays past scan records grouped by date.
 *
 * Features:
 * - Search by recognized text
 * - Swipe/tap to delete
 * - Tap to reopen the result
 * - Gamification stats at the top
 */
export default function HistoryScreen() {
  const router = useRouter();
  const scans = useHistoryStore((s) => s.scans);
  const setScans = useHistoryStore((s) => s.setScans);
  const removeScan = useHistoryStore((s) => s.removeScan);
  const isLoading = useHistoryStore((s) => s.isLoading);
  const setIsLoading = useHistoryStore((s) => s.setIsLoading);
  const setCurrentResult = useOcrStore((s) => s.setCurrentResult);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  /** Load scans from database on mount */
  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getScans(100);
      setScans(records);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setScans, setIsLoading]);

  /** Search for scans by text */
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      await loadScans();
      return;
    }
    try {
      const results = await searchScans(query);
      setScans(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [loadScans, setScans]);

  /** Delete a single scan */
  const handleDelete = useCallback(
    (scan: ScanRecord) => {
      Alert.alert('Delete Scan', `Remove "${scan.recognizedText}" from history?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScan(scan.id);
              removeScan(scan.id);
            } catch (error) {
              console.error('Delete failed:', error);
            }
          },
        },
      ]);
    },
    [removeScan]
  );

  /** Clear all history */
  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All History', 'This will delete all saved scans.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAllScans();
            setScans([]);
          } catch (error) {
            console.error('Clear all failed:', error);
          }
        },
      },
    ]);
  }, [setScans]);

  /** Tap a scan to reopen its result */
  const handleScanPress = useCallback(
    (scan: ScanRecord) => {
      setCurrentResult({
        characters: scan.characters,
        mode: scan.mode,
        timestamp: new Date(scan.createdAt).getTime(),
        imageUri: scan.imageUri,
        rawText: scan.recognizedText,
      });
      router.push('/result');
    },
    [setCurrentResult, router]
  );

  /** Format a date string for section headers */
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /** Format time for display */
  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  /** Render a confidence star rating */
  const renderStars = (confidence: number): string => {
    const stars = Math.max(1, Math.min(5, Math.round(confidence * 5)));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  /** Render a single scan card */
  const renderScanItem = ({ item }: { item: ScanRecord }) => {
    const modeIcon = item.mode.includes('abc') ? '🔤' : '🔢';
    const modeLabel = item.mode.includes('abc') ? 'Letters' : 'Numbers';

    return (
      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => handleScanPress(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.85}
        accessibilityLabel={`Scan: ${item.recognizedText}`}
      >
        {/* Thumbnail */}
        <View style={styles.scanThumbnail}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.scanImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.scanImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={Colors.midGray} />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.scanDetails}>
          {/* Character bubbles */}
          <View style={styles.scanBubbles}>
            {item.characters.slice(0, 8).map((char, i) => (
              <LetterBubble
                key={`${char.text}-${i}`}
                character={char.text}
                index={i}
                size={28}
              />
            ))}
            {item.characters.length > 8 && (
              <Text style={styles.moreText}>+{item.characters.length - 8}</Text>
            )}
          </View>

          {/* Confidence */}
          <Text style={styles.scanStars}>{renderStars(item.confidence)}</Text>

          {/* Mode and time */}
          <View style={styles.scanMeta}>
            <Text style={styles.scanMode}>
              {modeIcon} {modeLabel}
            </Text>
            <Text style={styles.scanTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        {/* Delete hint */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          accessibilityLabel="Delete scan"
        >
          <Ionicons name="trash-outline" size={18} color={Colors.midGray} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.title}>📜 My Scans</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSearch((prev) => !prev)}
            style={styles.headerButton}
          >
            <Ionicons name="search" size={22} color={Colors.charcoal} />
          </TouchableOpacity>
          {scans.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={22} color={Colors.coral} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.midGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search letters..."
            placeholderTextColor={Colors.midGray}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      )}

      {/* Scan list */}
      {isLoading ? (
        <LoadingSpinner message="Loading your scans..." />
      ) : scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>
            Your recognized letters and numbers will appear here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderScanItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.charcoal,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  scanCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  scanThumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scanBubbles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  moreText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.midGray,
    marginLeft: Spacing.xs,
  },
  scanStars: {
    color: Colors.orange,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  scanMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  scanMode: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.darkGray,
  },
  scanTime: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.midGray,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
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
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
