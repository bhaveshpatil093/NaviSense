import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface StatusDotProps {
  connected: boolean;
  size?: number;
}

export const StatusDot: React.FC<StatusDotProps> = ({ connected, size = 10 }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (connected) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }
  }, [connected, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        {
          width: size,
          height: size,
          backgroundColor: connected ? Colors.accentGreen : Colors.accentRed,
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    borderRadius: Layout.radiusFull,
  },
});
