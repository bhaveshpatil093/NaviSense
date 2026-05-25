import { useEffect, useRef } from 'react';
import { fetchStatus, fetchAlerts, fetchDetection, POLL_INTERVAL_STATUS } from '../services/esp32';
import { useDeviceStore } from '../store/deviceStore';
import { logger } from '../utils/logger';

export const useESP32 = (options = { enablePolling: true }) => {
  const setStatus = useDeviceStore((s) => s.setStatus);
  const addAlert = useDeviceStore((s) => s.addAlert);
  const addDetection = useDeviceStore((s) => s.addDetection);
  const setConnecting = useDeviceStore((s) => s.setConnecting);
  const espIp = useDeviceStore((s) => s.espIp);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef<boolean>(true);

  const poll = async () => {
    try {
      const [statusResult, alertResult, detectionResult] = await Promise.allSettled([
        fetchStatus(),
        fetchAlerts(),
        fetchDetection(),
      ]);

      if (statusResult.status === 'fulfilled') {
        if (isMounted.current) setStatus(statusResult.value);
      } else {
        if (isMounted.current) setStatus(null);
      }

      if (alertResult.status === 'fulfilled' && alertResult.value !== null) {
        if (isMounted.current) addAlert(alertResult.value);
      }

      if (detectionResult.status === 'fulfilled' && detectionResult.value !== null) {
        if (isMounted.current) addDetection(detectionResult.value);
      }
    } catch (error) {
      if (isMounted.current) setStatus(null);
      logger.error('useESP32 poll', error);
    }
  };

  useEffect(() => {
    if (!options.enablePolling) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_STATUS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      isMounted.current = false;
    };
  }, [espIp]);

  useEffect(() => {
    if (!options.enablePolling) return;
    const init = async () => {
      setConnecting(true);
      await poll();
      if (isMounted.current) {
        setConnecting(false);
      }
    };
    init();
  }, []);

  return { pollOnce: poll };
};
