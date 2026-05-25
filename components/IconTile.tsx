import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconTileProps {
  icon: string;
  label: string;
  onPress: () => void;
  badgeCount?: number;
}

export const IconTile: React.FC<IconTileProps> = ({ icon, label, onPress, badgeCount }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 100 }))}
      style={[styles.tile, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={badgeCount ? `${label}, ${badgeCount} unread` : label}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={28} 
        color={Colors.accentBlue} 
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={styles.label}>{label}</Text>

      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    padding: Layout.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
    flex: 1,
    minHeight: 100,
  },
  label: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.accentRed,
    borderRadius: Layout.radiusFull,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.xs,
  },
});
