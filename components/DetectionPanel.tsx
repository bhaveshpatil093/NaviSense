import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDeviceStore } from '../store/deviceStore';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

const formatRelativeTime = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const getIconName = (label: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  switch (label) {
    case 'vehicle': return 'car';
    case 'animal': return 'paw';
    case 'person': return 'account';
    case 'pothole': return 'alert-circle';
    case 'overhead': return 'arrow-up-circle';
    case 'clear': return 'check-circle';
    default: return 'help-circle';
  }
};

const getIconColor = (label: string) => {
  if (label === 'vehicle' || label === 'animal') return Colors.accentRed;
  if (label === 'pothole' || label === 'overhead') return Colors.accentOrange;
  if (label === 'clear') return Colors.accentGreen;
  if (label === 'person') return Colors.accentBlue;
  return Colors.textMuted;
};

const toTitleCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const DetectionPanel: React.FC = () => {
  const detectionHistory = useDeviceStore((s) => s.detectionHistory);
  const topDetections = detectionHistory.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Detection Log</Text>
        <Pressable 
          onPress={() => router.push('/(tabs)/alerts?filter=detection')}
          accessibilityRole="button"
          accessibilityLabel="See all detection alerts"
        >
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      </View>

      {topDetections.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="radar" 
            size={48} 
            color={Colors.textMuted} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.emptyText}>Waiting for detection data...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {topDetections.map((item, index) => (
            <View key={item.timestamp + index}>
              <View style={styles.card}>
                <MaterialCommunityIcons 
                  name={getIconName(item.label)} 
                  size={32} 
                  color={getIconColor(item.label)} 
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={styles.cardBody}>
                  <Text style={styles.labelText}>{toTitleCase(item.label)}</Text>
                  <Text style={styles.confidenceText}>
                    {Math.round(item.confidence * 100)}% Confidence
                  </Text>
                </View>
                <Text style={styles.timeText}>{formatRelativeTime(item.timestamp)}</Text>
              </View>
              {index < topDetections.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.lg,
    marginBottom: Layout.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.md,
  },
  heading: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.accentBlue,
  },
  emptyState: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.md,
  },
  emptyText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textMuted,
  },
  listContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    gap: Layout.md,
  },
  cardBody: {
    flex: 1,
  },
  labelText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  confidenceText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
  timeText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
