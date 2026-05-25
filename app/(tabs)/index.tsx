import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useDeviceStore } from '../../store/deviceStore';
import { useESP32 } from '../../hooks/useESP32';
import { useAlerts } from '../../hooks/useAlerts';
import { Colors } from '../../constants/colors';
import { Typography, sizes } from '../../constants/typography';
import { Layout } from '../../constants/layout';

import { StatusDot } from '../../components/StatusDot';
import { DeviceStrip } from '../../components/DeviceStrip';
import { StatusRing } from '../../components/StatusRing';
import { Chip } from '../../components/Chip';
import { IconTile } from '../../components/IconTile';
import { SOSButton } from '../../components/SOSButton';
import { AlertBanner } from '../../components/AlertBanner';
import { ObstacleOverlay } from '../../components/ObstacleOverlay';
import { DisconnectedBanner } from '../../components/DisconnectedBanner';
import { DeviceStatus } from '../../types/esp32';

// Helper to derive StatusRing status type
const deriveStatus = (status: DeviceStatus | null) => {
  if (!status || !status.connected) return 'disconnected';
  if (status.fall_detected || status.cliff_detected) return 'danger';
  if (status.obstacle !== null) return 'obstacle';
  return 'clear';
};

const formatMinutesAgo = (ts: number) => {
  const diffMinutes = Math.floor((Date.now() - ts) / 60000);
  if (diffMinutes < 1) return 'Just now';
  return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
};

export default function HomeScreen() {
  // Activate polling and alerts logic
  useESP32();
  useAlerts();

  // Read from store using individual selectors
  const status = useDeviceStore((s) => s.status);
  const isConnecting = useDeviceStore((s) => s.isConnecting);
  const currentBanner = useDeviceStore((s) => s.currentBanner);
  const setBanner = useDeviceStore((s) => s.setBanner);
  const alerts = useDeviceStore((s) => s.alerts);
  const deviceName = useDeviceStore((s) => s.deviceName);
  const lastConnectedAt = useDeviceStore((s) => s.lastConnectedAt);

  // Satisfy strict TS unused checks while adhering to required selectors
  void isConnecting;
  void deviceName;

  const statusType = deriveStatus(status);
  const unreadAlerts = alerts.length;

  let ringA11yLabel = 'Device status: All clear';
  if (statusType === 'disconnected') ringA11yLabel = 'Device status: Offline';
  if (statusType === 'danger') {
    if (status?.fall_detected) ringA11yLabel = 'Device status: Fall detected';
    else if (status?.cliff_detected) ringA11yLabel = 'Device status: Cliff detected';
  }
  if (statusType === 'obstacle' && status?.obstacle) {
    ringA11yLabel = `Device status: obstacle detected at ${status.obstacle.distance_cm} centimetres to the ${status.obstacle.direction}`;
  }

  const ringScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withSequence(
      withTiming(0.95, { duration: 75 }),
      withTiming(1, { duration: 75 })
    );
  }, [statusType, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <Stack.Screen options={{ title: 'Home' }} />
      <DisconnectedBanner />

      {/* Absolute Overlay Banner */}
      {currentBanner !== null && (
        <View style={styles.bannerOverlay}>
          <AlertBanner 
            alert={currentBanner} 
            onDismiss={() => setBanner(null)} 
          />
        </View>
      )}

      <ObstacleOverlay 
        obstacle={status?.obstacle || null} 
        onDismiss={() => {}} 
      />


      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>NaviSense</Text>
        <StatusDot connected={status?.connected || false} size={12} />
      </View>

      {/* Device Strip */}
      <View style={styles.stripWrapper}>
        <DeviceStrip />
        {status === null && lastConnectedAt !== null && (
          <Text style={styles.lastSeenText}>Last seen {formatMinutesAgo(lastConnectedAt)}</Text>
        )}
      </View>

      {/* Main Status Area */}
      <View style={styles.mainStatus}>
        <Animated.View style={ringStyle}>
          <StatusRing statusType={statusType} accessibilityLabel={ringA11yLabel} />
        </Animated.View>
        
        {statusType === 'obstacle' && status && status.obstacle !== null && (
          <View style={styles.obstacleInfo}>
            <Chip label={status.obstacle.direction || 'front'} color="orange" />
            <Text style={styles.distanceText}>{status.obstacle.distance_cm} cm away</Text>
          </View>
        )}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <IconTile 
            icon="camera" 
            label="Live Feed" 
            onPress={() => router.push('/(tabs)/feed')} 
          />
          <IconTile 
            icon="eye-outline" 
            label="AI Detection" 
            onPress={() => router.push('/(tabs)/alerts?filter=ai')} 
          />
        </View>
        <View style={styles.gridRow}>
          <IconTile 
            icon="bell-outline" 
            label="Alerts" 
            badgeCount={unreadAlerts}
            onPress={() => router.push('/(tabs)/alerts')} 
          />
          <IconTile 
            icon="cog-outline" 
            label="Settings" 
            onPress={() => router.push('/(tabs)/settings')} 
          />
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.footer}>
        <SOSButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.lg,
    paddingVertical: Layout.md,
  },
  logo: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xl,
    color: Colors.textPrimary,
  },
  stripWrapper: {
    paddingHorizontal: Layout.lg,
    marginBottom: Layout.xl,
  },
  lastSeenText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Layout.sm,
  },
  mainStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.lg,
    gap: Layout.sm,
  },
  distanceText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textSecondary,
  },
  grid: {
    paddingHorizontal: Layout.lg,
    gap: Layout.md,
    marginBottom: Layout.xl,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Layout.md,
  },
  footer: { // added bottom padding for safe area
    paddingTop: Layout.sm,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
