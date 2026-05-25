import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../../store/deviceStore';
import { testConnection } from '../../services/esp32';
import { Colors } from '../../constants/colors';
import { Typography, sizes } from '../../constants/typography';
import { Layout } from '../../constants/layout';

import { SectionHeader } from '../../components/SectionHeader';

export default function SettingsScreen() {
  const store = useDeviceStore();
  
  // Shadow state for inputs to buffer changes
  const [tempEspIp, setTempEspIp] = useState(store.espIp);
  const [tempDeviceName, setTempDeviceName] = useState(store.deviceName);
  const [tempEmergencyName, setTempEmergencyName] = useState(store.emergencyName);
  const [tempEmergencyPhone, setTempEmergencyPhone] = useState(store.emergencyPhone);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Sync state if store updates from elsewhere
  useEffect(() => {
    setTempEspIp(store.espIp);
    setTempDeviceName(store.deviceName);
    setTempEmergencyName(store.emergencyName);
    setTempEmergencyPhone(store.emergencyPhone);
  }, [store.espIp, store.deviceName, store.emergencyName, store.emergencyPhone]);

  // Saves buffered input to the Zustand store
  const handleSave = () => {
    store.updateSettings({
      espIp: tempEspIp,
      deviceName: tempDeviceName,
      emergencyName: tempEmergencyName,
      emergencyPhone: tempEmergencyPhone,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Ensure the latest typed IP is saved before testing
    handleSave();
    
    const success = await testConnection();
    setIsTesting(false);
    setTestResult(success ? 'success' : 'error');
    
    setTimeout(() => {
      setTestResult(null);
    }, 3000);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Onboarding',
      'Are you sure you want to reset the app? You will need to go through setup again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: () => {
            store.updateSettings({ onboardingComplete: false });
            router.replace('/onboarding');
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Device Setup */}
        <SectionHeader title="Device Setup" />
        <View style={styles.card}>
          <Text style={styles.label}>ESP32 IP Address</Text>
          <TextInput
            style={styles.input}
            value={tempEspIp}
            onChangeText={setTempEspIp}
            onBlur={handleSave}
            keyboardType="numeric"
            placeholder="192.168.4.1"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="ESP32 IP Address"
            importantForAccessibility="yes"
          />
          
          <Pressable 
            style={styles.testButton} 
            onPress={handleTestConnection} 
            disabled={isTesting}
            accessibilityRole="button"
            accessibilityLabel="Test Connection"
            accessibilityHint="Tests connection to the smart cane"
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={Colors.bgPrimary} />
            ) : (
              <Text style={styles.testButtonText}>Test Connection</Text>
            )}
          </Pressable>
          
          {testResult === 'success' && (
            <View style={[styles.testResultChip, styles.testSuccess]}>
              <Text style={styles.testSuccessText}>Connected ✓</Text>
            </View>
          )}
          {testResult === 'error' && (
            <View style={[styles.testResultChip, styles.testError]}>
              <Text style={styles.testErrorText}>Unreachable ✗</Text>
            </View>
          )}

          <View style={styles.divider} />
          
          <Text style={styles.label}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={tempDeviceName}
            onChangeText={setTempDeviceName}
            onBlur={handleSave}
            placeholder="NaviSense-01"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Device Name"
            importantForAccessibility="yes"
          />
        </View>

        {/* Alerts */}
        <SectionHeader title="Alerts" />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sound Alerts</Text>
            <Switch
              value={store.soundEnabled}
              onValueChange={(val) => store.updateSettings({ soundEnabled: val })}
              trackColor={{ false: Colors.borderStrong, true: Colors.accentBlue }}
              thumbColor={Colors.textPrimary}
              accessibilityRole="switch"
              accessibilityLabel="Sound Alerts"
              accessibilityState={{ checked: store.soundEnabled }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Vibration</Text>
            <Switch
              value={store.vibrationEnabled}
              onValueChange={(val) => store.updateSettings({ vibrationEnabled: val })}
              trackColor={{ false: Colors.borderStrong, true: Colors.accentBlue }}
              thumbColor={Colors.textPrimary}
              accessibilityRole="switch"
              accessibilityLabel="Vibration"
              accessibilityState={{ checked: store.vibrationEnabled }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.sensitivityRow}>
            <Text style={styles.rowLabel}>Sensitivity</Text>
            <View style={styles.chipsContainer}>
              {['low', 'medium', 'high'].map((level) => {
                const isActive = store.sensitivity === level;
                return (
                  <Pressable
                    key={level}
                    style={[styles.sensitivityChip, isActive && styles.sensitivityChipActive]}
                    onPress={() => store.updateSettings({ sensitivity: level as 'low' | 'medium' | 'high' })}
                    accessibilityRole="button"
                    accessibilityLabel={`${level} sensitivity`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.sensitivityText, isActive && styles.sensitivityTextActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Emergency */}
        <SectionHeader title="Emergency" />
        <View style={styles.card}>
          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={styles.input}
            value={tempEmergencyName}
            onChangeText={setTempEmergencyName}
            onBlur={handleSave}
            placeholder="John Doe"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Contact Name"
            importantForAccessibility="yes"
          />
          <View style={styles.divider} />
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={tempEmergencyPhone}
            onChangeText={setTempEmergencyPhone}
            onBlur={handleSave}
            keyboardType="phone-pad"
            placeholder="+1 234 567 8900"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Phone Number"
            importantForAccessibility="yes"
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>App Version</Text>
            <Text style={styles.readOnlyValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Team</Text>
            <Text style={styles.readOnlyValue}>PS29 — Pune Solvathon 2026</Text>
          </View>
          <View style={styles.divider} />
          <Pressable 
            style={styles.readOnlyRow}
            accessibilityRole="button"
            accessibilityLabel="View Documentation"
          >
            <Text style={styles.readOnlyLabel}>View Documentation</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={Colors.textMuted} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <Pressable 
          style={styles.resetButton} 
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Reset Onboarding"
          accessibilityHint="Resets the app and takes you back to setup"
        >
          <Text style={styles.resetText}>Reset Onboarding</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: Layout.lg,
    paddingBottom: Layout.xl,
  },
  header: {
    paddingVertical: Layout.md,
    marginBottom: Layout.sm,
  },
  headerTitle: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xl,
    color: Colors.textPrimary,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusLg,
    padding: Layout.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
  },
  label: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgElevated,
    borderRadius: Layout.radiusMd,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  testButton: {
    backgroundColor: Colors.textPrimary,
    padding: Layout.md,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    marginBottom: Layout.md,
  },
  testButtonText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.bgPrimary,
  },
  testResultChip: {
    padding: Layout.sm,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    marginBottom: Layout.md,
  },
  testSuccess: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
  },
  testSuccessText: {
    color: Colors.accentGreen,
    fontFamily: Typography.bodyMedFont,
  },
  testError: {
    backgroundColor: 'rgba(235, 87, 87, 0.2)',
  },
  testErrorText: {
    color: Colors.accentRed,
    fontFamily: Typography.bodyMedFont,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Layout.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.xs,
  },
  rowLabel: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  sensitivityRow: {
    marginTop: Layout.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: Layout.sm,
    marginTop: Layout.md,
  },
  sensitivityChip: {
    flex: 1,
    paddingVertical: Layout.sm,
    alignItems: 'center',
    borderRadius: Layout.radiusMd,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  sensitivityChipActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  sensitivityText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
  sensitivityTextActive: {
    color: Colors.textPrimary,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.xs,
  },
  readOnlyLabel: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
  },
  readOnlyValue: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
  },
  resetButton: {
    marginTop: Layout.xl,
    paddingVertical: Layout.md,
    alignItems: 'center',
  },
  resetText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.accentRed,
  },
});
