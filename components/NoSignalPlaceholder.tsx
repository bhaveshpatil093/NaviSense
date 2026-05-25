import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, sizes } from '../constants/typography';
import { Layout } from '../constants/layout';

interface NoSignalPlaceholderProps {
  message?: string;
}

export const NoSignalPlaceholder: React.FC<NoSignalPlaceholderProps> = ({ 
  message = 'No signal from device' 
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="camera-off" 
        size={48} 
        color={Colors.textMuted} 
        style={styles.icon}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.xl,
    backgroundColor: Colors.bgPrimary,
  },
  icon: {
    marginBottom: Layout.md,
  },
  message: {
    fontFamily: Typography.bodyMedFont,
    fontSize: sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
