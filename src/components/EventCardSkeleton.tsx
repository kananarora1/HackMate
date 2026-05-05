import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

const SKELETON_GRAY = '#ECECE8';

export default function EventCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.poster} />
      <View style={styles.footer}>
        <View style={[styles.bar, styles.titleBar]} />
        <View style={[styles.bar, styles.metaBar]} />
      </View>
    </View>
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
  poster: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: SKELETON_GRAY,
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  bar: {
    backgroundColor: SKELETON_GRAY,
    borderRadius: 4,
    height: 12,
  },
  titleBar: {
    width: '70%',
    height: 14,
  },
  metaBar: {
    width: '50%',
    height: 10,
  },
});
