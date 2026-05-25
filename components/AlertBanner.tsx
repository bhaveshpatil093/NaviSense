import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';
import { AlertEvent } from '../types/esp32';

interface AlertBannerProps {
  alert: AlertEvent;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss }) => {
  const translateY = useSharedValue(-100);

  const handleDismiss = () => {
    translateY.value = withTiming(-100, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  };

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15 });
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isRed = alert.type === 'fall' || alert.type === 'sos';
  const bgColor = isRed ? Colors.accentRed : Colors.accentOrange;

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return 'Older';
  };

  const title = alert.type.toUpperCase();

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: bgColor }, animatedStyle]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Sensor: {alert.sensor} • {formatTime(alert.timestamp)}
        </Text>
      </View>
      <Pressable 
        onPress={handleDismiss} 
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss alert banner"
      >
        <MaterialCommunityIcons 
          name="close" 
          size={24} 
          color={Colors.textPrimary} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    padding: Layout.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Layout.xs,
  },
  title: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textPrimary,
    opacity: 0.9,
  },
  closeButton: {
    padding: Layout.sm,
  },
});
