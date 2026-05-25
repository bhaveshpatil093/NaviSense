import { renderHook, act } from '@testing-library/react-native';
import { useAlerts } from '../../hooks/useAlerts';
import { useDeviceStore } from '../../store/deviceStore';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() }
}));

jest.mock('../../utils/audio', () => ({
  playAlert: jest.fn()
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Vibration = { vibrate: jest.fn(), cancel: jest.fn() };
  return rn;
});

describe('useAlerts', () => {
  let mockTime = 1000;

  beforeEach(() => {
    jest.clearAllMocks();
    useDeviceStore.getState().clearAlerts();
    useDeviceStore.getState().setStatus(null);
    jest.spyOn(Date, 'now').mockImplementation(() => {
      mockTime += 1000;
      return mockTime;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a fall detection triggers addAlert with type "fall"', () => {
    renderHook(() => useAlerts());
    
    act(() => {
      useDeviceStore.getState().setStatus({
        connected: true,
        fall_detected: true,
        cliff_detected: false,
        mode: 'day',
        battery: 100,
        obstacle: null,
        last_alert: '',
        timestamp: 0
      });
    });

    const alerts = useDeviceStore.getState().alerts;
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('fall');
    expect(router.push).toHaveBeenCalledWith('/sos');
  });

  it('A cliff detection triggers addAlert with type "cliff"', () => {
    renderHook(() => useAlerts());
    
    act(() => {
      useDeviceStore.getState().setStatus({
        connected: true,
        fall_detected: false,
        cliff_detected: true,
        mode: 'day',
        battery: 100,
        obstacle: null,
        last_alert: '',
        timestamp: 0
      });
    });

    const alerts = useDeviceStore.getState().alerts;
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('cliff');
  });

  it('Resetting fall_detected to false resets the fallHandled ref', () => {
    const { rerender } = renderHook(() => useAlerts());
    
    act(() => {
      useDeviceStore.getState().setStatus({
        connected: true,
        fall_detected: true,
        cliff_detected: false,
        mode: 'day',
        battery: 100,
        obstacle: null,
        last_alert: '',
        timestamp: 0
      });
    });
    
    expect(useDeviceStore.getState().alerts.length).toBe(1);

    act(() => {
      useDeviceStore.getState().setStatus({
        connected: true,
        fall_detected: false,
        cliff_detected: false,
        mode: 'day',
        battery: 100,
        obstacle: null,
        last_alert: '',
        timestamp: 0
      });
    });
    
    rerender({});

    act(() => {
      useDeviceStore.getState().setStatus({
        connected: true,
        fall_detected: true,
        cliff_detected: false,
        mode: 'day',
        battery: 100,
        obstacle: null,
        last_alert: '',
        timestamp: 0
      });
    });

    expect(useDeviceStore.getState().alerts.length).toBe(2);
  });
});
