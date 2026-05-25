import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, Alert, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, interpolateColor } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useDeviceStore } from '../store/deviceStore';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

export default function SOSScreen() {
  const { reason } = useLocalSearchParams<{ reason: string }>();
  
  const emergencyPhone = useDeviceStore((s) => s.emergencyPhone);
  const emergencyName = useDeviceStore((s) => s.emergencyName);
  const vibrationEnabled = useDeviceStore((s) => s.vibrationEnabled);

  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sosSent = useRef<boolean>(false);

  const countdownProgress = useSharedValue(1.0);
  const numberScale = useSharedValue(1.0);

  let reasonText = 'Emergency Triggered';
  if (reason === 'manual') reasonText = 'Manual Trigger';
  if (reason === 'fall') reasonText = 'Fall Detected';
  if (reason === 'cliff') reasonText = 'Cliff Detected';

  const triggerEmergency = async () => {
    if (sosSent.current) return;
    
    if (emergencyPhone && emergencyPhone.trim() !== '') {
      try {
        sosSent.current = true;
        await Linking.openURL(`tel:${emergencyPhone}`);
      } catch (err) {
        sosSent.current = false;
        Alert.alert('Error', 'Could not open dialer.');
      }
    } else {
      Alert.alert(
        'No emergency contact set',
        'Please add one in Settings.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  useEffect(() => {
    // Attempt Notification
    const sendNotification = async () => {
      if (Constants.appOwnership === 'expo') {
        // Skip on Expo Go to avoid crashing on missing native module
        return;
      }
      try {
        const Notifications = require('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'SOS Triggered',
            body: `Reason: ${reasonText}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
          },
          trigger: null,
        });
      } catch (e) {
        // Silently fail if Expo Go limitations prevent it
      }
    };
    sendNotification();

    // Vibrate
    if (vibrationEnabled) {
      // Repeating pattern: wait 500ms, vibrate 1000ms
      Vibration.vibrate([500, 1000], true);
    }

    // Countdown Interval
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          Vibration.cancel();
          triggerEmergency();
          countdownProgress.value = withTiming(0, { duration: 1000 });
          return 0;
        }

        countdownProgress.value = withTiming((prev - 1) / 10, { duration: 1000 });
        numberScale.value = withSequence(
          withTiming(1.3, { duration: 100 }),
          withTiming(1.0, { duration: 100 })
        );

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Vibration.cancel();
    };
  }, []);

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Vibration.cancel();
    router.back();
  };

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      countdownProgress.value,
      [0, 1],
      [Colors.accentRed, Colors.accentOrange]
    ),
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      <Stack.Screen options={{ title: 'SOS' }} />
      <View style={styles.content}>
        <Text style={styles.heading}>⚠️ SOS ACTIVE</Text>
        <Text style={styles.reasonText}>{reasonText}</Text>
        
        <Animated.View style={[styles.ring, ringStyle]}>
          <Animated.Text style={[styles.countdownNumber, numberStyle]}>{countdown}</Animated.Text>
        </Animated.View>
        <Text style={styles.subtext}>Sending SOS in {countdown}s...</Text>
        
        <Pressable 
          style={styles.cancelButton} 
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel SOS"
          accessibilityHint="Stops the emergency countdown"
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>

        {emergencyName && emergencyPhone ? (
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>{emergencyName}</Text>
            <Pressable 
              style={styles.callButton} 
              onPress={triggerEmergency}
              accessibilityRole="button"
              accessibilityLabel={`Call ${emergencyName}`}
            >
              <MaterialCommunityIcons 
                name="phone" 
                size={20} 
                color={Colors.bgPrimary} 
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
              />
              <Text style={styles.callText}>Call Now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.warningRow}>
            <MaterialCommunityIcons 
              name="alert" 
              size={24} 
              color={Colors.accentRed} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
            <Text style={styles.warningText}>No emergency contact configured</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sosBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.xl,
  },
  heading: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xxl,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: Layout.sm,
    textAlign: 'center',
  },
  reasonText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    color: Colors.sosText,
    marginBottom: 60,
    textAlign: 'center',
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  countdownNumber: {
    fontFamily: Typography.headingFont,
    fontSize: 80,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  subtext: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.lg,
    color: Colors.sosText,
    marginBottom: 60,
  },
  cancelButton: {
    width: '100%',
    height: 60,
    backgroundColor: Colors.textPrimary,
    borderRadius: Layout.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.xl,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  cancelText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    color: Colors.sosBg,
    fontWeight: 'bold',
  },
  contactCard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Layout.radiusLg,
    padding: Layout.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contactName: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    marginBottom: Layout.md,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.textPrimary,
    paddingVertical: Layout.md,
    paddingHorizontal: Layout.xl,
    borderRadius: Layout.radiusFull,
    gap: Layout.sm,
  },
  callText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.bgPrimary,
    fontWeight: 'bold',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Layout.md,
    borderRadius: Layout.radiusMd,
    gap: Layout.sm,
    borderWidth: 1,
    borderColor: Colors.accentRed,
  },
  warningText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.sosText,
  },
});
