import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../store/deviceStore';
import { testConnection } from '../services/esp32';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Dot Component
const StepDot = ({ active }: { active: boolean }) => {
  const scale = useSharedValue(active ? 1.2 : 1);

  useEffect(() => {
    scale.value = withTiming(active ? 1.2 : 1, { duration: 200 });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: active ? Colors.accentBlue : Colors.borderStrong,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function OnboardingScreen() {
  const store = useDeviceStore();
  const [step, setStep] = useState(0);

  const [ipInput, setIpInput] = useState('192.168.4.1');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(-SCREEN_WIDTH * step, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [step]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    // temporarily inject the ip to test it since it's not saved yet
    useDeviceStore.getState().updateSettings({ espIp: ipInput });
    
    const success = await testConnection();
    
    // restore original IP if test failed? No, we can just leave it or overwrite on finish.
    // It's safe to keep it since we overwrite on Finish anyway.
    
    setIsTesting(false);
    setTestResult(success ? 'success' : 'error');
    setTimeout(() => setTestResult(null), 3000);
  };

  const finishSetup = () => {
    store.updateSettings({
      espIp: ipInput,
      emergencyName: contactName,
      emergencyPhone: contactPhone,
      onboardingComplete: true,
    });
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      <Stack.Screen options={{ title: 'Onboarding' }} />
      {/* Header with Step Indicator */}
      <View style={styles.header}>
        <View style={styles.dotContainer}>
          <StepDot active={step === 0} />
          <StepDot active={step === 1} />
          <StepDot active={step === 2} />
        </View>
        
        {step > 0 ? (
          <Pressable 
            style={styles.skipButton} 
            onPress={finishSetup}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipButtonPlaceholder} />
        )}
      </View>

      {/* Animated Slider Container */}
      <Animated.View style={[styles.slider, sliderStyle]}>
        
        {/* STEP 0: Welcome */}
        <View style={styles.stepWrapper}>
          <View style={styles.centeredContent}>
            <MaterialCommunityIcons 
              name="eye-outline" 
              size={64} 
              color={Colors.accentBlue} 
              style={styles.heroIcon} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
            <Text style={styles.logoText}>NaviSense</Text>
            <Text style={styles.subtitle}>Smart navigation for the visually impaired</Text>
            
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={Colors.accentGreen} 
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
                <Text style={styles.featureText}>Real-time AI obstacle & cliff detection</Text>
              </View>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={Colors.accentGreen} 
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
                <Text style={styles.featureText}>Automatic SOS alerting if a fall occurs</Text>
              </View>
            </View>
          </View>
          
          <Pressable 
            style={styles.primaryButton} 
            onPress={() => setStep(1)}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>

        {/* STEP 1: Device Setup */}
        <View style={styles.stepWrapper}>
          <View style={styles.topContent}>
            <Text style={styles.heading}>Connect your cane</Text>
            <Text style={styles.helperText}>Enter the ESP32 IP address to connect to the smart cane.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ESP32 IP Address</Text>
              <TextInput
                style={styles.input}
                value={ipInput}
                onChangeText={setIpInput}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="ESP32 IP Address"
                importantForAccessibility="yes"
              />
            </View>

            <Pressable 
              style={styles.testButton} 
              onPress={handleTestConnection} 
              disabled={isTesting}
              accessibilityRole="button"
              accessibilityLabel="Test Connection"
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

            <Text style={styles.footerHelper}>Default IP when connected to the cane's Wi-Fi hotspot.</Text>
          </View>
          
          <Pressable 
            style={styles.primaryButton} 
            onPress={() => setStep(2)}
            accessibilityRole="button"
            accessibilityLabel="Next step"
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </Pressable>
        </View>

        {/* STEP 2: Emergency Contact */}
        <View style={styles.stepWrapper}>
          <View style={styles.topContent}>
            <Text style={styles.heading}>Set emergency contact</Text>
            <Text style={styles.subHeading}>This person will be called automatically if a fall is detected.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="John Doe"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Contact Name"
                importantForAccessibility="yes"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="+1 234 567 8900"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Phone Number"
                importantForAccessibility="yes"
              />
            </View>
          </View>

          <Pressable 
            style={styles.primaryButton} 
            onPress={finishSetup}
            accessibilityRole="button"
            accessibilityLabel="Finish Setup"
          >
            <Text style={styles.primaryButtonText}>Finish Setup</Text>
          </Pressable>
        </View>

      </Animated.View>
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
    paddingHorizontal: Layout.xl,
    paddingVertical: Layout.md,
    height: 60,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: Layout.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  skipButton: {
    padding: Layout.xs,
  },
  skipButtonPlaceholder: {
    width: 40,
  },
  skipText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textSecondary,
  },
  slider: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
  },
  stepWrapper: {
    width: SCREEN_WIDTH,
    paddingHorizontal: Layout.xl,
    paddingBottom: Layout.xl,
    justifyContent: 'space-between',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    marginBottom: Layout.md,
  },
  logoText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xxl,
    color: Colors.textPrimary,
    marginBottom: Layout.sm,
  },
  subtitle: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.xl,
  },
  features: {
    width: '100%',
    gap: Layout.md,
    backgroundColor: Colors.bgCard,
    padding: Layout.lg,
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  featureText: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  topContent: {
    flex: 1,
    paddingTop: Layout.xl,
  },
  heading: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.xl,
    color: Colors.textPrimary,
    marginBottom: Layout.sm,
  },
  subHeading: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textSecondary,
    marginBottom: Layout.xl,
    lineHeight: 22,
  },
  helperText: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    color: Colors.textSecondary,
    marginBottom: Layout.xl,
  },
  inputGroup: {
    marginBottom: Layout.lg,
  },
  label: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusMd,
    padding: Layout.md,
    color: Colors.textPrimary,
    fontFamily: Typography.bodyFont,
    fontSize: sizes.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: sizes.md,
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
  footerHelper: {
    fontFamily: Typography.bodyFont,
    fontSize: sizes.sm,
    color: Colors.textMuted,
    marginTop: Layout.sm,
  },
  primaryButton: {
    backgroundColor: Colors.accentBlue,
    paddingVertical: Layout.md,
    borderRadius: Layout.radiusFull,
    alignItems: 'center',
    shadowColor: Colors.accentBlue,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    color: Colors.textPrimary,
  },
});
