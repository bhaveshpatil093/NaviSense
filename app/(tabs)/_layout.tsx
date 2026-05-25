import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useDeviceStore } from '../../store/deviceStore';

export default function TabLayout() {
  const alertsCount = useDeviceStore((state) => state.alerts.length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.accentBlue,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons 
              name="home" 
              color={color} 
              size={24} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons 
              name="camera" 
              color={color} 
              size={24} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: alertsCount > 0 ? (alertsCount > 99 ? '99+' : alertsCount) : undefined,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons 
              name="bell-outline" 
              color={color} 
              size={24} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons 
              name="cog-outline" 
              color={color} 
              size={24} 
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          ),
        }}
      />
    </Tabs>
  );
}
