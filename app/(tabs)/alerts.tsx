import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ScrollView, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../../store/deviceStore';
import { AlertEvent } from '../../types/esp32';
import { Colors } from '../../constants/colors';
import { Typography, sizes } from '../../constants/typography';
import { Layout } from '../../constants/layout';

type FilterType = 'all' | 'fall' | 'cliff' | 'obstacle' | 'sos';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Fall', value: 'fall' },
  { label: 'Cliff', value: 'cliff' },
  { label: 'Obstacle', value: 'obstacle' },
  { label: 'SOS', value: 'sos' },
];

const formatTime = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'fall': return 'account-alert';
    case 'cliff': return 'arrow-down-bold-circle-outline';
    case 'obstacle': return 'radar';
    case 'sos': return 'phone-alert';
    default: return 'bell-outline';
  }
};

const getAlertColor = (type: string) => {
  if (type === 'sos' || type === 'fall') return Colors.accentRed;
  return Colors.accentOrange;
};

interface AlertItemProps {
  alert: AlertEvent;
  onRemove: (timestamp: number) => void;
}

export const AlertItem: React.FC<AlertItemProps> = ({ alert, onRemove }) => {
  const iconColor = getAlertColor(alert.type);

  return (
    <View 
      style={styles.itemContainer}
      accessibilityRole="text"
      accessibilityLabel={`${alert.type} detected by ${alert.sensor}, ${formatTime(alert.timestamp)}`}
    >
      <View 
        style={[styles.iconCircle, { backgroundColor: `${iconColor}22` }]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        <MaterialCommunityIcons name={getAlertIcon(alert.type) as any} size={24} color={iconColor} />
      </View>
      <View style={styles.itemCenter}>
        <Text style={styles.itemTitle}>{alert.type.toUpperCase()}</Text>
        <Text style={styles.itemSubtitle}>Sensor: {alert.sensor}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTime}>{formatTime(alert.timestamp)}</Text>
        <Pressable 
          style={styles.deleteButton} 
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            onRemove(alert.timestamp);
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${alert.type} alert`}
        >
          <MaterialCommunityIcons 
            name="delete-outline" 
            size={20} 
            color={Colors.textMuted} 
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default function AlertsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const alerts = useDeviceStore((s) => s.alerts);
  const clearAlerts = useDeviceStore((s) => s.clearAlerts);
  const removeAlert = useDeviceStore((s) => s.removeAlert);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (filter && ['all', 'fall', 'cliff', 'obstacle', 'sos'].includes(filter)) {
      setActiveFilter(filter as FilterType);
    }
  }, [filter]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return alerts;
    return alerts.filter((a) => a.type === activeFilter);
  }, [alerts, activeFilter]);

  const handleClearAll = () => {
    if (alerts.length === 0) return;
    Alert.alert(
      'Clear all alerts?',
      'This will permanently delete your alert history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          clearAlerts();
        } }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Alerts' }} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Pressable 
          onPress={handleClearAll} 
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear all alerts"
          accessibilityHint="Permanently deletes your alert history"
        >
          <Text style={[styles.clearText, alerts.length === 0 && styles.clearTextDisabled]}>
            Clear All
          </Text>
        </Pressable>
      </View>

      {/* Filter Row */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <Pressable
                key={f.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                  setActiveFilter(f.value);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${f.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.timestamp.toString()}
        contentContainerStyle={styles.listContent}
        accessibilityLabel="Alert history list"
        renderItem={({ item }) => (
          <AlertItem alert={item} onRemove={removeAlert} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="bell-off-outline" 
              size={48} 
              color={Colors.textMuted} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
            <Text style={styles.emptyText}>No alerts yet — all clear!</Text>
          </View>
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.lg,
    paddingVertical: Layout.md,
  },
  headerTitle: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xl,
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: Layout.xs,
  },
  clearText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.accentBlue,
  },
  clearTextDisabled: {
    color: Colors.textMuted,
  },
  filterWrapper: {
    paddingBottom: Layout.md,
  },
  filterScroll: {
    paddingHorizontal: Layout.lg,
    gap: Layout.sm,
  },
  filterChip: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderRadius: Layout.radiusFull,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  filterText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.bgPrimary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Layout.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: Layout.md,
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textMuted,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.md,
    paddingHorizontal: Layout.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.md,
  },
  itemCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Layout.sm,
  },
  itemTime: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: Layout.xs,
  },
});
