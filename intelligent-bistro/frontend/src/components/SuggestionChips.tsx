import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, FontSize } from '../config/theme';

interface Props {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  compact?: boolean;
}

export default function SuggestionChips({ suggestions, onSelect, compact = false }: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, compact && styles.containerCompact]}
    >
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.chip, compact && styles.chipCompact]}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(s);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, compact && styles.chipTextCompact]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
  },
  containerCompact: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: FontSize.xs,
  },
});
