import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getAllEvents } from '../api/events';

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; count: number }
  | { kind: 'error'; message: string };

export default function HelloScreen() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    getAllEvents()
      .then((events) => {
        if (!cancelled) setStatus({ kind: 'ready', count: events.length });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus({ kind: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hackmate</Text>
      <Text style={styles.subtitle}>Setup complete</Text>

      <View style={styles.statusBlock}>
        {status.kind === 'loading' && (
          <>
            <ActivityIndicator />
            <Text style={styles.statusText}>Loading events…</Text>
          </>
        )}
        {status.kind === 'ready' && (
          <Text style={styles.statusText}>Loaded {status.count} events from Supabase</Text>
        )}
        {status.kind === 'error' && (
          <Text style={styles.errorText}>Error: {status.message}</Text>
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
  },
});
