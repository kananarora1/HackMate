import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { formatEventDate, getDeadlineBadge, type DeadlineSeverity } from '../lib/dates';
import type { Event } from '../types/database';

type Props = {
  event: Event;
  onPress?: (event: Event) => void;
};

const SOURCE_LABELS: Record<string, string> = {
  devfolio: 'Devfolio',
  devpost: 'Devpost',
  luma: 'Luma',
  instagram: 'Instagram',
  manual: 'Manual',
};

const FALLBACK_PALETTE = [
  '#1D9E75',
  '#378ADD',
  '#EF9F27',
  '#E24B4A',
  '#7A57D1',
  '#2EA8A1',
];

function pickFallbackColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function severityColor(severity: DeadlineSeverity): string {
  switch (severity) {
    case 'danger':
      return colors.danger;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.info;
    case 'neutral':
    default:
      return colors.textSecondary;
  }
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source.toLowerCase()] ?? source;
}

function buildMetaLine(event: Event): string {
  const parts: string[] = [];
  if (event.start_date) {
    parts.push(formatEventDate(event.start_date, event.end_date));
  }
  if (event.is_online) {
    parts.push('Online');
  } else if (event.city) {
    parts.push(event.city);
  } else if (event.location_text) {
    parts.push(event.location_text);
  }
  if (event.organizer) {
    parts.push(event.organizer);
  }
  return parts.join(' · ');
}

export default function EventCard({ event, onPress }: Props) {
  const aspectRatio = event.poster_aspect_ratio ?? 0.8;
  const badge = getDeadlineBadge(event.registration_deadline);
  const meta = buildMetaLine(event);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(event)}
    >
      <View style={[styles.posterWrap, { aspectRatio }]}>
        {event.poster_url ? (
          <Image
            source={{ uri: event.poster_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.fallback,
              { backgroundColor: pickFallbackColor(event.id) },
            ]}
          >
            <Text style={styles.fallbackText} numberOfLines={4}>
              {event.title}
            </Text>
          </View>
        )}

        <View style={[styles.pill, styles.sourcePill]}>
          <Text style={styles.pillText}>{sourceLabel(event.source)}</Text>
        </View>

        {badge ? (
          <View
            style={[
              styles.pill,
              styles.deadlinePill,
              { backgroundColor: severityColor(badge.severity) },
            ]}
          >
            <Text style={[styles.pillText, styles.deadlinePillText]}>{badge.text}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  posterWrap: {
    width: '100%',
    backgroundColor: colors.border,
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.surface,
    textAlign: 'center',
  },
  pill: {
    position: 'absolute',
    top: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sourcePill: {
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  deadlinePill: {
    right: 10,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.surface,
    letterSpacing: 0.2,
  },
  deadlinePillText: {
    color: colors.surface,
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
