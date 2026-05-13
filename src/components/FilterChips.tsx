import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';

type Option = { slug: string; label: string };

// Overloads for multi vs single select
type MultiProps = {
  options: Option[];
  selected: string[];
  onChange: (slug: string) => void;
  multi: true;
};

type SingleProps = {
  options: Option[];
  selected: string;
  onChange: (slug: string) => void;
  multi?: false;
};

type Props = MultiProps | SingleProps;

function isSelected(selected: string | string[], slug: string): boolean {
  if (Array.isArray(selected)) return selected.includes(slug);
  return selected === slug;
}

export default function FilterChips({ options, selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((opt) => {
        const active = isSelected(selected, opt.slug);
        return (
          <Pressable
            key={opt.slug}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipInactive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onChange(opt.slug)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.surface,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
