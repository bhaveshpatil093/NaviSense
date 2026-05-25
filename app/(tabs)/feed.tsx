import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../../store/deviceStore';
import { StatusDot } from '../../components/StatusDot';
import { NoSignalPlaceholder } from '../../components/NoSignalPlaceholder';
import { Chip } from '../../components/Chip';
import { DetectionPanel } from '../../components/DetectionPanel';
import { Colors } from '../../constants/colors';
import { Typography, sizes } from '../../constants/typography';
import { Layout } from '../../constants/layout';

const formatRelativeTime = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const getDetectionColor = (label: string): 'red' | 'orange' | 'green' | 'blue' | 'muted' => {
  if (label === 'vehicle' || label === 'animal') return 'red';
  if (label === 'pothole' || label === 'overhead') return 'orange';
  if (label === 'clear') return 'green';
  if (label === 'person') return 'blue';
  return 'muted';
};

export default function FeedScreen() {
  const espIp = useDeviceStore((s) => s.espIp);
  const status = useDeviceStore((s) => s.status);
  const detectionHistory = useDeviceStore((s) => s.detectionHistory);
  const latestDetection = detectionHistory.length > 0 ? detectionHistory[0] : null;

  const [streamError, setStreamError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  const streamUrl = `http://${espIp}/stream`;
  const isConnected = status !== null && status.connected;

  const handleReconnect = () => {
    setStreamError(false);
    setIsLoading(true);
    setWebViewKey((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Live Feed' }} />
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={32} 
            color={Colors.textPrimary} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Live Feed</Text>
        <StatusDot connected={isConnected} size={12} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Video Container */}
        <View style={styles.videoContainer}>
        {status === null || (!isConnected || streamError) ? (
          <NoSignalPlaceholder />
        ) : (
          <WebView
            key={webViewKey}
            source={{ uri: streamUrl }}
            style={styles.webview}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => {
              setIsLoading(false);
              setStreamError(false);
            }}
            onError={() => {
              setIsLoading(false);
              setStreamError(true);
            }}
          />
        )}
        
        {isLoading && !streamError && isConnected && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={Colors.accentBlue} />
          </View>
        )}
      </View>

      {/* Detection Card */}
      <View style={styles.detectionCard}>
        <Text style={styles.cardTitle}>Latest Detection</Text>
        {latestDetection ? (
          <View style={styles.detectionRow}>
            <Chip 
              label={latestDetection.label} 
              color={getDetectionColor(latestDetection.label)} 
            />
            <Text style={styles.confidenceText}>
              {Math.round(latestDetection.confidence * 100)}% Match
            </Text>
            <Text style={styles.timeText}>
              {formatRelativeTime(latestDetection.timestamp)}
            </Text>
          </View>
        ) : (
          <Text style={styles.mutedText}>No detection data yet</Text>
        )}
      </View>

      {/* Sensor Indicators */}
      <View style={styles.sensorRow}>
        {/* Ultrasonic / Obstacle */}
        <View style={styles.sensorItem}>
          <MaterialCommunityIcons 
            name="radar" 
            size={28} 
            color={status?.obstacle ? Colors.accentGreen : Colors.textMuted} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.sensorLabel}>Obstacle</Text>
        </View>
        
        {/* IR / Cliff */}
        <View style={styles.sensorItem}>
          <MaterialCommunityIcons 
            name="arrow-down-bold-circle-outline" 
            size={28} 
            color={(status && !status.cliff_detected) ? Colors.accentGreen : Colors.textMuted} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.sensorLabel}>Cliff</Text>
        </View>

        {/* Light / Day-Night Mode */}
        <View style={styles.sensorItem}>
          <MaterialCommunityIcons 
            name={status?.mode === 'night' ? 'weather-night' : 'white-balance-sunny'} 
            size={28} 
            color={status?.mode ? Colors.accentGreen : Colors.textMuted} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.sensorLabel}>Mode</Text>
        </View>
      </View>

      <DetectionPanel />
      </ScrollView>

      {/* Reconnect Button */}
      <View style={styles.footer}>
        <Pressable 
          style={styles.reconnectButton} 
          onPress={handleReconnect}
          accessibilityRole="button"
          accessibilityLabel="Reconnect Stream"
        >
          <MaterialCommunityIcons 
            name="refresh" 
            size={24} 
            color={Colors.textPrimary} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.reconnectText}>Reconnect Stream</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: Layout.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
  },
  backButton: {
    padding: Layout.xs,
  },
  headerTitle: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    color: Colors.textPrimary,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.bgCard,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionCard: {
    backgroundColor: Colors.bgCard,
    margin: Layout.lg,
    padding: Layout.lg,
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    marginBottom: Layout.md,
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.md,
  },
  confidenceText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  timeText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  mutedText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Layout.lg,
    marginTop: Layout.md,
  },
  sensorItem: {
    alignItems: 'center',
    gap: Layout.xs,
  },
  sensorLabel: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    padding: Layout.lg,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    padding: Layout.md,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.sm,
  },
  reconnectText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
});
