import { useDeviceStore } from '../../store/deviceStore';
import { DeviceStatus } from '../../types/esp32';

describe('deviceStore', () => {
  beforeEach(() => {
    const store = useDeviceStore.getState();
    store.updateSettings({
      espIp: '192.168.4.1',
      deviceName: 'NaviSense-01',
      emergencyName: '',
      emergencyPhone: '',
      soundEnabled: true,
      vibrationEnabled: true,
      sensitivity: 'medium',
      onboardingComplete: false,
    });
    store.clearAlerts();
    store.setStatus(null);
  });

  it('setStatus with a non-null value updates the status and sets lastConnectedAt', () => {
    const store = useDeviceStore.getState();
    const mockStatus: DeviceStatus = { connected: true, fall_detected: false, cliff_detected: false, mode: 'day', battery: 100, obstacle: null, last_alert: '', timestamp: 0 };
    
    const beforeTime = Date.now();
    store.setStatus(mockStatus);
    const updatedStore = useDeviceStore.getState();
    
    expect(updatedStore.status).toEqual(mockStatus);
    expect(updatedStore.lastConnectedAt).toBeGreaterThanOrEqual(beforeTime);
  });

  it('setStatus(null) sets status to null', () => {
    const store = useDeviceStore.getState();
    store.setStatus(null);
    expect(useDeviceStore.getState().status).toBeNull();
  });

  it('addAlert prepends and caps at 100', () => {
    const store = useDeviceStore.getState();
    for (let i = 0; i < 105; i++) {
      store.addAlert({ timestamp: i, type: 'fall', sensor: 'mpu6050', severity: 'high' });
    }
    const updatedStore = useDeviceStore.getState();
    expect(updatedStore.alerts.length).toBe(100);
    expect(updatedStore.alerts[0].timestamp).toBe(104);
  });

  it('clearAlerts empties the array', () => {
    const store = useDeviceStore.getState();
    store.addAlert({ timestamp: 1, type: 'fall', sensor: 'mpu6050', severity: 'high' });
    store.clearAlerts();
    expect(useDeviceStore.getState().alerts.length).toBe(0);
  });

  it('removeAlert removes the correct item by timestamp', () => {
    const store = useDeviceStore.getState();
    store.addAlert({ timestamp: 1, type: 'fall', sensor: 'mpu6050', severity: 'high' });
    store.addAlert({ timestamp: 2, type: 'fall', sensor: 'mpu6050', severity: 'high' });
    
    store.removeAlert(1);
    const updatedStore = useDeviceStore.getState();
    expect(updatedStore.alerts.length).toBe(1);
    expect(updatedStore.alerts[0].timestamp).toBe(2);
  });

  it('updateSettings persists only the settings fields', () => {
    const store = useDeviceStore.getState();
    store.updateSettings({ deviceName: 'NewName' });
    expect(useDeviceStore.getState().deviceName).toBe('NewName');
  });
});
