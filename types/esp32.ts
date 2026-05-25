export interface DeviceStatus {
  connected: boolean;
  battery: number;
  mode: 'day' | 'night';
  fall_detected: boolean;
  cliff_detected: boolean;
  obstacle: {
    direction: 'left' | 'front' | 'right' | null;
    distance_cm: number;
  } | null;
  last_alert: string | null;
  timestamp: number;
}

export interface AlertEvent {
  type: 'fall' | 'cliff' | 'obstacle' | 'sos';
  severity: 'low' | 'medium' | 'high';
  sensor: string;
  timestamp: number;
}

export interface DetectionLabel {
  label: 'vehicle' | 'animal' | 'person' | 'pothole' | 'overhead' | 'clear';
  confidence: number;
  timestamp: number;
}
