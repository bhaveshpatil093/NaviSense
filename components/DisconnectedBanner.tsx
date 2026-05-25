import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceStore } from '../store/deviceStore';
import { Colors } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

export const DisconnectedBanner: React.FC = () => {
  const status = useDeviceStore((s) => s.status);
  const isConnecting = useDeviceStore((s) => s.isConnecting);
  const insets = useSafeAreaInsets();

  if (status !== null || isConnecting) {
    return null;
  }

  return (
    <View style={[styles.banner, { marginTop: insets.top }]}> 
      <MaterialCommunityIcons 
        name="wifi-off" 
        size={16} 
        color={Colors.accentOrange} 
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={styles.text}>Device offline — reconnecting...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    paddingVertical: Layout.sm,
    gap: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  text: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.sm,
    color: Colors.textSecondary,
  },
});
