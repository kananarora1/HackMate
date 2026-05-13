import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import ImageViewing from 'react-native-image-viewing';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '../components/EmptyState';
import { colors } from '../constants/colors';
import { getEventById } from '../api/events';
import { useBookmarks } from '../hooks/useBookmarks';
import { formatEventDate } from '../lib/dates';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Event } from '../types/database';

type DetailRoute = RouteProp<RootStackParamList, 'EventDetail'>;
type DetailNav = NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; event: Event }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

const TAG_PALETTE = [
  '#E5F4EE',
  '#E8F0FB',
  '#FDF1DC',
  '#FBE6E5',
  '#EFE9FA',
  '#E1F2F1',
];
const TAG_TEXT_PALETTE = [
  '#1D9E75',
  '#2A6FBF',
  '#B7791F',
  '#B43A3A',
  '#5A41B0',
  '#1F7A75',
];

function hashIndex(seed: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % mod;
}

export default function EventDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DetailNav>();
  const insets = useSafeAreaInsets();
  const { eventId } = route.params;

  const [state, setState] = useState<FetchState>({ kind: 'loading' });
  const [viewerOpen, setViewerOpen] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarks(eventId);

  useEffect(() => {
    let cancelled = false;
    getEventById(eventId)
      .then((event) => {
        if (cancelled) return;
        setState(event ? { kind: 'ready', event } : { kind: 'missing' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setState({ kind: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const event = state.kind === 'ready' ? state.event : null;

  const handleRegister = useCallback(() => {
    if (!event) return;
    Linking.openURL(event.source_url).catch(() => {
      // swallow — user-visible failure handled by OS
    });
  }, [event]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    const message = `${event.title}\n\n${event.source_url}`;
    try {
      await Share.share({ message, url: event.source_url, title: event.title });
    } catch {
      // user cancelled or share unavailable
    }
  }, [event]);

  const viewerImages = useMemo(
    () => (event?.poster_url ? [{ uri: event.poster_url }] : []),
    [event?.poster_url]
  );

  if (state.kind === 'loading') {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.kind === 'missing') {
    return (
      <View style={styles.fullCenter}>
        <EmptyState
          title="Event not found"
          subtitle="It may have been removed."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.fullCenter}>
        <EmptyState
          title="Could not load event"
          subtitle={state.message}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const e = state.event;
  const aspectRatio = e.poster_aspect_ratio ?? 0.8;
  const dateText = e.start_date ? formatEventDate(e.start_date, e.end_date) : null;
  const locationText = e.is_online ? 'Online' : e.city ?? e.location_text ?? null;
  const tags = e.tags ?? [];
  const description = (e.description ?? '').trim();

  const facts: string[] = [];
  if (dateText) facts.push(dateText);
  if (locationText) facts.push(locationText);
  if (e.prize_pool_text) facts.push(e.prize_pool_text);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => e.poster_url && setViewerOpen(true)}>
          <View style={[styles.posterWrap, { aspectRatio }]}>
            {e.poster_url ? (
              <Image
                source={{ uri: e.poster_url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.posterFallback]}>
                <Text style={styles.posterFallbackText} numberOfLines={4}>
                  {e.title}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.title}>{e.title}</Text>
          {e.organizer ? <Text style={styles.organizer}>{e.organizer}</Text> : null}

          {facts.length > 0 ? (
            <View style={styles.factsRow}>
              {facts.map((f) => (
                <View key={f} style={styles.factChip}>
                  <Text style={styles.factChipText}>{f}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {tags.map((tag) => {
                const idx = hashIndex(tag, TAG_PALETTE.length);
                return (
                  <View
                    key={tag}
                    style={[styles.tagPill, { backgroundColor: TAG_PALETTE[idx] }]}
                  >
                    <Text style={[styles.tagPillText, { color: TAG_TEXT_PALETTE[idx] }]}>
                      {tag}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {description.length > 0 ? (
            <View style={styles.descriptionBlock}>
              <Markdown style={markdownStyles}>{description}</Markdown>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          style={styles.iconButton}
          onPress={toggleBookmark}
        >
          <Text style={styles.iconGlyph}>{isBookmarked ? '★' : '☆'}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Share event" style={styles.iconButton} onPress={handleShare}>
          <Text style={styles.iconGlyph}>↗</Text>
        </Pressable>
        <Pressable style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register →</Text>
        </Pressable>
      </View>

      {e.poster_url ? (
        <ImageViewing
          images={viewerImages}
          imageIndex={0}
          visible={viewerOpen}
          onRequestClose={() => setViewerOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullCenter: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  posterWrap: {
    width: '100%',
    backgroundColor: colors.border,
  },
  posterFallback: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  posterFallbackText: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.surface,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  organizer: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -10,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  factChipText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionBlock: {
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  iconGlyph: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  registerButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60%',
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  heading1: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  link: {
    color: colors.info,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  code_inline: {
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 4,
    borderRadius: 4,
    color: colors.textPrimary,
  },
  fence: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 6,
    fontSize: 12,
    color: colors.textPrimary,
  },
  blockquote: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
  },
});
