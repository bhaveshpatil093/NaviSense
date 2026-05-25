import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

interface StatusRingProps {
  statusType: 'clear' | 'obstacle' | 'danger' | 'disconnected';
  accessibilityLabel?: string;
}

const configMap = {
  clear: { color: Colors.accentGreen, text: 'ALL CLEAR' },
  obstacle: { color: Colors.accentOrange, text: 'OBSTACLE' },
  danger: { color: Colors.accentRed, text: 'DANGER' },
  disconnected: { color: Colors.border, text: 'OFFLINE' },
};

export const StatusRing: React.FC<StatusRingProps> = ({ statusType, accessibilityLabel }) => {
  const { color, text } = configMap[statusType];
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    if (statusType === 'danger' || statusType === 'obstacle') {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(borderOpacity);
      borderOpacity.value = 1;
    }
  }, [statusType, borderOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: color,
    opacity: borderOpacity.value,
  }));

  return (
    <View 
      style={[styles.container, { width: Layout.statusRingSize, height: Layout.statusRingSize }]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Device status: ${text}`}
    >
      <Animated.View style={[styles.animatedRing, animatedStyle, { borderColor: color }]} />
      <Text style={[styles.label, { color: statusType === 'disconnected' ? Colors.textMuted : color }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusFull,
  },
  animatedRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: Layout.radiusFull,
    borderWidth: 4,
  },
  label: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.sm,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
