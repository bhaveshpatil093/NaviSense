import { useDeviceStore } from '../store/deviceStore';
import { DeviceStatus, AlertEvent, DetectionLabel } from '../types/esp32';
import { logger } from '../utils/logger';

export const TIMEOUT_MS = 3000;
export const POLL_INTERVAL_STATUS = 500;
export const POLL_INTERVAL_DETECTION = 1000;

const fetchWithTimeout = async (url: string, customTimeout?: number): Promise<Response> => {
  const timeout = customTimeout ?? TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    throw new Error(`Fetch failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timer);
  }
};

const getBaseUrl = () => {
  const espIp = useDeviceStore.getState().espIp;
  if (!espIp || espIp.trim() === '') return 'http://0.0.0.0';
  return `http://${espIp}`;
};

export const fetchStatus = async (): Promise<DeviceStatus> => {
  try {
    const res = await fetchWithTimeout(`${getBaseUrl()}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    logger.error('fetchStatus', error);
    throw error;
  }
};

export const fetchAlerts = async (): Promise<AlertEvent | null> => {
  try {
    const res = await fetchWithTimeout(`${getBaseUrl()}/alerts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.type) return null;
    return data as AlertEvent;
  } catch (error) {
    logger.error('fetchAlerts', error);
    throw error;
  }
};

export const fetchDetection = async (): Promise<DetectionLabel | null> => {
  try {
    const res = await fetchWithTimeout(`${getBaseUrl()}/detection`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.label) return null;
    return data as DetectionLabel;
  } catch (error) {
    logger.error('fetchDetection', error);
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await fetchWithTimeout(`${getBaseUrl()}/status`, 2000);
    return res.ok;
  } catch (error) {
    logger.error('testConnection', error);
    return false;
  }
};
