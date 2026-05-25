import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

interface BatteryBarProps {
  level: number;
  showLabel?: boolean;
}

export const BatteryBar: React.FC<BatteryBarProps> = ({ level, showLabel = true }) => {
  let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'battery-high';
  let color: string = Colors.accentGreen;

  if (level > 60) {
    iconName = 'battery-high';
    color = Colors.accentGreen;
  } else if (level >= 30) {
    iconName = 'battery-medium';
    color = Colors.accentOrange;
  } else if (level >= 10) {
    iconName = 'battery-low';
    color = Colors.accentRed;
  } else {
    iconName = 'battery-alert';
    color = Colors.accentRed;
  }

  return (
    <View 
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Battery level ${Math.round(level)} percent`}
    >
      <MaterialCommunityIcons 
        name={iconName} 
        size={16} 
        color={color} 
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      {showLabel && (
        <Text style={[styles.label, { color }]}>{Math.round(level)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.xs,
  },
  label: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
  }
});
