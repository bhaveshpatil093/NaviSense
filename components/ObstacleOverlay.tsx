import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';
import { DeviceStatus } from '../types/esp32';

interface ObstacleOverlayProps {
  obstacle: DeviceStatus['obstacle'];
  onDismiss: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ObstacleOverlay: React.FC<ObstacleOverlayProps> = ({ obstacle, onDismiss }) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  
  // Keep track of the last obstacle so we can animate it out smoothly even when it becomes null
  const [lastObstacle, setLastObstacle] = React.useState<DeviceStatus['obstacle']>(null);

  useEffect(() => {
    if (obstacle) {
      setLastObstacle(obstacle);
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [obstacle, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const currentObstacle = obstacle || lastObstacle;

  if (!currentObstacle) return null;

  const { direction, distance_cm } = currentObstacle;

  const getDistanceColor = (distance: number) => {
    if (distance < 30) return Colors.accentRed;
    if (distance <= 80) return Colors.accentOrange;
    return Colors.accentGreen;
  };

  const getSegmentStyle = (segDir: string) => {
    const isActive = direction === segDir;
    return {
      color: isActive ? Colors.textPrimary : 'rgba(255,255,255,0.4)',
      size: isActive ? 48 : 32,
    };
  };

  const leftStyle = getSegmentStyle('left');
  const frontStyle = getSegmentStyle('front');
  const rightStyle = getSegmentStyle('right');

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable 
        style={styles.closeButton} 
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss obstacle warning"
      >
        <MaterialCommunityIcons 
          name="close" 
          size={24} 
          color={Colors.textPrimary} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>

      <Text style={styles.heading}>OBSTACLE DETECTED</Text>

      <View style={styles.directionalRow}>
        <View style={styles.segment}>
          <MaterialCommunityIcons 
            name="arrow-left-bold" 
            size={leftStyle.size} 
            color={leftStyle.color} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </View>
        <View style={styles.segment}>
          <MaterialCommunityIcons 
            name="alert" 
            size={frontStyle.size} 
            color={frontStyle.color} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </View>
        <View style={styles.segment}>
          <MaterialCommunityIcons 
            name="arrow-right-bold" 
            size={rightStyle.size} 
            color={rightStyle.color} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </View>

      <Text style={[styles.distanceText, { color: getDistanceColor(distance_cm) }]}>
        {distance_cm} cm away
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Layout.xl,
    left: Layout.lg,
    right: Layout.lg,
    backgroundColor: 'rgba(242, 153, 74, 0.9)', // accentOrange at 90% opacity
    borderRadius: Layout.radiusLg,
    padding: Layout.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: Layout.md,
    right: Layout.md,
    padding: Layout.sm,
  },
  heading: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: Layout.lg,
  },
  directionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.xl,
    marginBottom: Layout.xl,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  distanceText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xxl,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
