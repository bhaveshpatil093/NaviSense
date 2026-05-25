import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

interface ChipProps {
  label: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'muted';
}

const colorMap = {
  blue: Colors.accentBlue,
  green: Colors.accentGreen,
  orange: Colors.accentOrange,
  red: Colors.accentRed,
  muted: Colors.textMuted,
};

export const Chip: React.FC<ChipProps> = ({ label, color }) => {
  const baseColor = colorMap[color];
  const bgColor = `${baseColor}33`; // Approx 20% opacity hex suffix

  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <Text style={[styles.label, { color: baseColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: Layout.chipHeight,
    paddingHorizontal: Layout.md,
    borderRadius: Layout.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    textTransform: 'uppercase',
  },
});
