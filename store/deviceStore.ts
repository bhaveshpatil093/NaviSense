import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceStatus, AlertEvent, DetectionLabel } from '../types/esp32';

export let storeHydrated = false;

export interface SettingsState {
  espIp: string;
  deviceName: string;
  emergencyName: string;
  emergencyPhone: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  onboardingComplete: boolean;
}

export interface RuntimeState {
  status: DeviceStatus | null;
  alerts: AlertEvent[];
  detectionHistory: DetectionLabel[];
  isConnecting: boolean;
  currentBanner: AlertEvent | null;
  hasSeenHomeHint: boolean;
  lastConnectedAt: number | null;
}

export interface DeviceState extends SettingsState, RuntimeState {
  setStatus: (status: DeviceStatus | null) => void;
  addAlert: (alert: AlertEvent) => void;
  addDetection: (detection: DetectionLabel) => void;
  clearAlerts: () => void;
  removeAlert: (timestamp: number) => void;
  setConnecting: (isConnecting: boolean) => void;
  setBanner: (banner: AlertEvent | null) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  setHasSeenHomeHint: () => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      // Runtime state
      status: null,
      alerts: [],
      detectionHistory: [],
      isConnecting: false,
      currentBanner: null,
      hasSeenHomeHint: false,
      lastConnectedAt: null,

      // Settings state
      espIp: '192.168.4.1',
      deviceName: 'NaviSense-01',
      emergencyName: '',
      emergencyPhone: '',
      soundEnabled: true,
      vibrationEnabled: true,
      sensitivity: 'medium',
      onboardingComplete: false,

      // Actions
      setStatus: (status) => set((state) => {
        if (status && status.connected) {
          return { status, lastConnectedAt: Date.now() };
        }
        return { status };
      }),
      addAlert: (alert) => set((state) => {
        if (state.alerts.length > 0) {
          const mostRecent = state.alerts[0];
          if (mostRecent.type === alert.type && mostRecent.timestamp === alert.timestamp) {
            return state;
          }
        }
        const newAlerts = [alert, ...state.alerts].slice(0, 100);
        return { alerts: newAlerts, currentBanner: alert };
      }),
      addDetection: (detection) => set((state) => ({
        detectionHistory: [detection, ...state.detectionHistory].slice(0, 50)
      })),
      clearAlerts: () => set({ alerts: [] }),
      removeAlert: (timestamp) => set((state) => ({
        alerts: state.alerts.filter((a) => a.timestamp !== timestamp)
      })),
      setConnecting: (isConnecting) => set({ isConnecting }),
      setBanner: (currentBanner) => set({ currentBanner }),
      updateSettings: (settings) => set(settings),
      setHasSeenHomeHint: () => set({ hasSeenHomeHint: true })
    }),
    {
      name: 'navisense-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        espIp: state.espIp,
        deviceName: state.deviceName,
        emergencyName: state.emergencyName,
        emergencyPhone: state.emergencyPhone,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        sensitivity: state.sensitivity,
        onboardingComplete: state.onboardingComplete
      }),
      onRehydrateStorage: () => {
        return () => {
          storeHydrated = true;
        };
      }
    }
  )
);

export const selectIsConnected = (state: DeviceState) => {
  return state.status !== null && state.status.connected === true;
};
