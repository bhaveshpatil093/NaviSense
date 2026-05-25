import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useDeviceStore } from '../store/deviceStore';
import { StatusDot } from './StatusDot';
import { BatteryBar } from './BatteryBar';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

export const DeviceStrip: React.FC = () => {
  const deviceName = useDeviceStore((s) => s.deviceName);
  const status = useDeviceStore((s) => s.status);
  const isConnecting = useDeviceStore((s) => s.isConnecting);

  const isConnected = status !== null && status.connected;

  return (
    <View style={styles.container}>
      <Text style={styles.deviceName} numberOfLines={1}>
        {deviceName}
      </Text>

      <View style={styles.statusContainer}>
        {isConnecting ? (
          <ActivityIndicator size="small" color={Colors.accentBlue} style={styles.loader} />
        ) : (
          <StatusDot connected={isConnected} size={8} />
        )}
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      <View style={styles.batteryContainer}>
        {status !== null && status.battery !== undefined ? (
          <BatteryBar level={status.battery} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Layout.headerHeight,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.lg,
  },
  deviceName: {
    flex: 1,
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
  },
  statusText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  loader: {
    transform: [{ scale: 0.8 }],
  },
  batteryContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
