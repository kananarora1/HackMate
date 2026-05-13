import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { colors } from '../constants/colors';

type Props = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search events…',
  debounceMs = 300,
}: Props) {
  // Local state for the raw (immediate) input value
  const [raw, setRaw] = useState(value);

  // Sync when parent resets value (e.g. clearAll)
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      setRaw(value);
      prevValue.current = value;
    }
  }, [value]);

  const debounced = useDebouncedValue(raw, debounceMs);

  // Fire onChange only when debounced value actually changes
  const prevDebounced = useRef(debounced);
  useEffect(() => {
    if (debounced !== prevDebounced.current) {
      prevDebounced.current = debounced;
      onChange(debounced);
    }
  }, [debounced, onChange]);

  const hasText = raw.length > 0;

  return (
    <View style={styles.container}>
      {/* Magnifying glass */}
      <Text style={styles.icon}>🔍</Text>

      <TextInput
        style={styles.input}
        value={raw}
        onChangeText={setRaw}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never" // we render our own clear button
      />

      {/* Clear button */}
      {hasText ? (
        <Pressable
          onPress={() => {
            setRaw('');
            onChange('');
          }}
          style={styles.clearButton}
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0, // removes Android top padding
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  clearIcon: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});
