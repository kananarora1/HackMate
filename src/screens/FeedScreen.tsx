import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import EmptyState from '../components/EmptyState';
import { getAllEvents } from '../api/events';
import { colors } from '../constants/colors';
import type { Event } from '../types/database';

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5'];

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; events: Event[] }
  | { kind: 'error'; message: string };

export default function FeedScreen() {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setState({ kind: 'loading' });
    if (mode === 'refresh') setRefreshing(true);
    try {
      const events = await getAllEvents();
      setState({ kind: 'ready', events });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState({ kind: 'error', message });
    } finally {
      if (mode === 'refresh') setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const handleCardPress = useCallback((event: Event) => {
    console.log('event tapped:', event.id);
  }, []);

  const handleRefresh = useCallback(() => {
    load('refresh');
  }, [load]);

  const eventCount = state.kind === 'ready' ? state.events.length : 0;
  const subtitle =
    state.kind === 'ready'
      ? `${eventCount} ${eventCount === 1 ? 'event' : 'events'} nearby`
      : state.kind === 'loading'
        ? 'Loading events…'
        : 'Could not load events';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hackmate</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {state.kind === 'loading' ? (
        <FlashList
          data={SKELETON_KEYS}
          keyExtractor={(key) => key}
          contentContainerStyle={styles.listContent}
          renderItem={() => <EventCardSkeleton />}
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
          title="No events yet"
          subtitle="Pull down to refresh, or check back soon."
        />
      ) : (
        <FlashList
          data={state.events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => <EventCard event={item} onPress={handleCardPress} />}
        />
      )}

      <StatusBar style="dark" />
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
    paddingBottom: 12,
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
});
