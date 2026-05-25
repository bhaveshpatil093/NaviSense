import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

export const SOSButton = () => {
  return (
    <Pressable 
      style={styles.button}
      onPress={() => router.push('/sos?reason=manual')}
      accessibilityRole="button"
      accessibilityLabel="SOS emergency button"
      accessibilityHint="Activates emergency countdown and contacts your emergency contact"
    >
      <MaterialCommunityIcons 
        name="phone-alert" 
        size={24} 
        color={Colors.textPrimary} 
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={styles.text}>SOS</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.accentRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: Layout.radiusLg,
    marginHorizontal: Layout.lg,
    marginBottom: Layout.xl,
    gap: Layout.sm,
  },
  text: {
    color: Colors.textPrimary,
    fontFamily: Typography.headingFont,
    fontSize: sizes.lg,
    fontWeight: 'bold',
  },
});
