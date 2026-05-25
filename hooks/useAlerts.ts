import { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import { router } from 'expo-router';
import { playAlert } from '../utils/audio';
import { useDeviceStore } from '../store/deviceStore';
import Constants from 'expo-constants';

let Notifications: any = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    // Ignore
  }
}

export const useAlerts = () => {
  const status = useDeviceStore((s) => s.status);
  const vibrationEnabled = useDeviceStore((s) => s.vibrationEnabled);
  const soundEnabled = useDeviceStore((s) => s.soundEnabled);
  const addAlert = useDeviceStore((s) => s.addAlert);

  const fallHandled = useRef<boolean>(false);
  const cliffHandled = useRef<boolean>(false);

  useEffect(() => {
    if (status?.fall_detected) {
      if (!fallHandled.current) {
        fallHandled.current = true;
        
        addAlert({
          type: 'fall',
          severity: 'high',
          sensor: 'MPU6050',
          timestamp: Date.now(),
        });

        if (vibrationEnabled) {
          Vibration.vibrate([0, 300, 200, 300, 200, 300]);
        }

        if (soundEnabled) {
          playAlert('fall_alert');
        }

        if (Notifications) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: '⚠️ Fall Detected',
              body: 'NaviSense detected a fall',
            },
            trigger: null,
          }).catch(() => {});
        }

        router.push('/sos');
      }
    } else {
      fallHandled.current = false;
    }
  }, [status?.fall_detected, vibrationEnabled, soundEnabled, addAlert]);

  useEffect(() => {
    if (status?.cliff_detected) {
      if (!cliffHandled.current) {
        cliffHandled.current = true;

        addAlert({
          type: 'cliff',
          severity: 'high',
          sensor: 'IR',
          timestamp: Date.now(),
        });

        if (vibrationEnabled) {
          Vibration.vibrate([0, 500, 100, 500]);
        }

        if (soundEnabled) {
          playAlert('cliff_alert');
        }

        if (Notifications) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: '⚠️ Cliff Detected',
              body: 'NaviSense detected a drop-off.',
            },
            trigger: null,
          }).catch(() => {});
        }
      }
    } else {
      cliffHandled.current = false;
    }
  }, [status?.cliff_detected, vibrationEnabled, soundEnabled, addAlert]);
};
