import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import SearchBar from '../components/SearchBar';
import { getAllEvents } from '../api/events';
import { colors } from '../constants/colors';
import { TAG_FILTERS, MODE_FILTERS } from '../constants/filters';
import { useEventFilters } from '../hooks/useEventFilters';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Event } from '../types/database';

type FeedNavProp = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5'];

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; events: Event[] }
  | { kind: 'error'; message: string };

export default function FeedScreen() {
  const navigation = useNavigation<FeedNavProp>();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<FetchState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const { filters, hydrated, setSearch, toggleTag, setMode, clearAll, hasActiveFilters } =
    useEventFilters();

  // Track if we've done the first load so filter changes trigger a re-fetch
  const didInitialLoad = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'filter') => {
      if (mode === 'initial') setState({ kind: 'loading' });
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'filter') setIsRefetching(true);

      try {
        const events = await getAllEvents({
          search: filters.search,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          mode: filters.mode,
        });
        setState({ kind: 'ready', events });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setState({ kind: 'error', message });
      } finally {
        if (mode === 'refresh') setRefreshing(false);
        if (mode === 'filter') setIsRefetching(false);
      }
    },
    [filters]
  );

  // Initial load — wait until filters are hydrated from storage
  useEffect(() => {
    if (!hydrated) return;
    if (!didInitialLoad.current) {
      didInitialLoad.current = true;
      load('initial');
    }
  }, [hydrated, load]);

  // Re-fetch when filters change (after initial load)
  useEffect(() => {
    if (!didInitialLoad.current) return;
    load('filter');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCardPress = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { eventId: event.id });
    },
    [navigation]
  );

  const handleRefresh = useCallback(() => {
    load('refresh');
  }, [load]);

  // ── Derived UI state ──────────────────────────────────────────────────
  const eventCount = state.kind === 'ready' ? state.events.length : 0;
  const subtitle =
    state.kind === 'ready'
      ? `${eventCount} ${eventCount === 1 ? 'event' : 'events'} found`
      : state.kind === 'loading'
        ? 'Loading events…'
        : 'Could not load events';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Hackmate</Text>
          {isRefetching ? <ActivityIndicator size="small" color={colors.accent} /> : null}
        </View>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <SearchBar value={filters.search} onChange={setSearch} />

      {/* ── Filter chips ───────────────────────────────────────────── */}
      <View style={styles.chipsSection}>
        <FilterChips
          options={TAG_FILTERS}
          selected={filters.tags}
          onChange={toggleTag}
          multi
        />
        <View style={styles.chipsSpacer} />
        <FilterChips
          options={MODE_FILTERS}
          selected={filters.mode}
          onChange={(slug) => setMode(slug as 'all' | 'online' | 'offline')}
        />
      </View>

      {/* ── Clear filters link ─────────────────────────────────────── */}
      {hasActiveFilters ? (
        <Pressable onPress={clearAll} style={styles.clearRow} hitSlop={8}>
          <Text style={styles.clearText}>Clear filters</Text>
        </Pressable>
      ) : null}

      {/* ── Content ────────────────────────────────────────────────── */}
      {state.kind === 'loading' ? (
        <FlashList
          data={SKELETON_KEYS}
          keyExtractor={(key) => key}
          contentContainerStyle={styles.listContent}
          renderItem={() => <EventCardSkeleton />}
          estimatedItemSize={280}
        />
      ) : state.kind === 'error' ? (
        <EmptyState
          title="Could not load events"
          subtitle={state.message}
          actionLabel="Try again"
          onAction={() => load('initial')}
        />
      ) : state.events.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No events match these filters' : 'No events yet'}
          subtitle={
            hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Pull down to refresh, or check back soon.'
          }
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearAll : undefined}
        />
      ) : (
        <FlashList
          data={state.events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => <EventCard event={item} onPress={handleCardPress} />}
          estimatedItemSize={280}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipsSection: {
    gap: 8,
    paddingVertical: 10,
  },
  chipsSpacer: {
    height: 0, // gap between the two chip rows handled by chipsSection gap
  },
  clearRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  clearText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
});
