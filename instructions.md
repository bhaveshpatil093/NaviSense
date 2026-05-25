# NaviSense — Coding Instructions

> This file is the source of truth for how code must be written in this project. Every file, component, hook, and service must follow these rules. Read this before writing any code.

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | SDK 51 |
| Router | Expo Router v3 | file-based |
| Language | TypeScript | strict mode |
| State | Zustand | latest |
| Storage | AsyncStorage | `@react-native-async-storage/async-storage` |
| Animations | react-native-reanimated | v3 |
| Notifications | expo-notifications | latest |
| Camera stream | WebView | `react-native-webview` |
| HTTP | Native `fetch` | no axios |
| Audio | expo-av | latest |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) | bundled |

---

## 2. ESP32 Communication

### Base URL

Stored in settings, never hardcoded:

```ts
// services/esp32.ts
import { useSettingsStore } from '../store/deviceStore';

const getBaseUrl = () => {
  const ip = useSettingsStore.getState().espIp;
  return `http://${ip}`;
};
```

### Endpoints

| Endpoint | Method | Returns | Poll interval |
|---|---|---|---|
| `/status` | GET | JSON device status | 500ms |
| `/stream` | GET | MJPEG stream | continuous (WebView) |
| `/alerts` | GET | JSON latest alert | 500ms |
| `/detection` | GET | JSON AI label | 1000ms |

### Status response shape

```ts
// types/esp32.ts
export interface DeviceStatus {
  connected: boolean;
  battery: number;           // 0–100
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
  confidence: number;        // 0–1
  timestamp: number;
}
```

### Polling logic

```ts
// hooks/useESP32.ts
import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { fetchStatus, fetchAlerts, fetchDetection } from '../services/esp32';

export const useESP32 = () => {
  const setStatus = useDeviceStore(s => s.setStatus);
  const addAlert  = useDeviceStore(s => s.addAlert);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const [status, alert, detection] = await Promise.all([
        fetchStatus(),
        fetchAlerts(),
        fetchDetection(),
      ]);
      setStatus(status);
      if (alert) addAlert(alert);
    } catch {
      setStatus(null);   // null = disconnected
    }
  };

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);
};
```

### Fetch wrapper (always use this, never raw fetch in components)

```ts
// services/esp32.ts
const TIMEOUT_MS = 3000;

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const fetchStatus = async (): Promise<DeviceStatus> => {
  const res = await fetchWithTimeout(`${getBaseUrl()}/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
```

Always wrap ESP32 calls in try/catch. Never let network errors crash the UI.

---

## 3. State Management

### Zustand store

```ts
// store/deviceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStatus, AlertEvent } from '../types/esp32';

interface DeviceState {
  // Connection
  status: DeviceStatus | null;
  setStatus: (s: DeviceStatus | null) => void;

  // Alerts
  alerts: AlertEvent[];
  addAlert: (a: AlertEvent) => void;
  clearAlerts: () => void;

  // Settings (persisted)
  espIp: string;
  deviceName: string;
  emergencyName: string;
  emergencyPhone: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  setSettings: (partial: Partial<DeviceState>) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      status: null,
      setStatus: (status) => set({ status }),

      alerts: [],
      addAlert: (alert) => set(s => ({
        alerts: [alert, ...s.alerts].slice(0, 100)  // keep last 100
      })),
      clearAlerts: () => set({ alerts: [] }),

      espIp: '192.168.4.1',         // default ESP32 AP IP
      deviceName: 'NaviSense-01',
      emergencyName: '',
      emergencyPhone: '',
      soundEnabled: true,
      vibrationEnabled: true,
      sensitivity: 'medium',
      setSettings: (partial) => set(partial),
    }),
    {
      name: 'navisense-storage',
      storage: {
        getItem: async (key) => AsyncStorage.getItem(key),
        setItem: async (key, value) => AsyncStorage.setItem(key, value),
        removeItem: async (key) => AsyncStorage.removeItem(key),
      },
    }
  )
);
```

**Rules:**
- Settings are persisted to AsyncStorage automatically via Zustand persist middleware
- `status: null` means device is disconnected — treat this everywhere in UI
- Never store sensitive data (passwords, tokens) — the app has none
- Keep alerts capped at 100 items

---

## 4. SOS Logic

```ts
// hooks/useAlerts.ts
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useDeviceStore } from '../store/deviceStore';

export const useAlerts = () => {
  const status = useDeviceStore(s => s.status);
  const addAlert = useDeviceStore(s => s.addAlert);

  useEffect(() => {
    if (!status) return;

    if (status.fall_detected) {
      addAlert({ type: 'fall', severity: 'high', sensor: 'MPU6050', timestamp: Date.now() });
      Vibration.vibrate([0, 300, 200, 300, 200, 300]);
      Notifications.scheduleNotificationAsync({
        content: { title: '⚠️ Fall Detected', body: 'NaviSense detected a fall. Opening SOS.' },
        trigger: null,
      });
      router.push('/sos');   // auto-navigate to SOS screen
    }

    if (status.cliff_detected) {
      addAlert({ type: 'cliff', severity: 'high', sensor: 'IR', timestamp: Date.now() });
      Vibration.vibrate([0, 500, 100, 500]);
      Notifications.scheduleNotificationAsync({
        content: { title: '⚠️ Cliff Detected', body: 'NaviSense detected a drop-off.' },
        trigger: null,
      });
    }
  }, [status?.fall_detected, status?.cliff_detected]);
};
```

**SOS screen behaviour (`app/sos.tsx`):**
1. Start 10-second countdown on mount
2. On countdown reaching 0 → `Linking.openURL('tel:' + emergencyPhone)`
3. On "Cancel" press → `router.back()`
4. Show "No contact set" warning if `emergencyPhone` is empty

---

## 5. Camera Stream

```tsx
// Inside app/(tabs)/feed.tsx
import WebView from 'react-native-webview';
import { useDeviceStore } from '../../store/deviceStore';

const espIp = useDeviceStore(s => s.espIp);
const streamUrl = `http://${espIp}/stream`;

<WebView
  source={{ uri: streamUrl }}
  style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 10 }}
  onError={() => setStreamError(true)}
  onLoad={() => setStreamError(false)}
  scrollEnabled={false}
  bounces={false}
/>
```

Show a `NoSignalPlaceholder` component when `streamError === true` or `status === null`.

---

## 6. TypeScript Rules

- **Strict mode on** — `"strict": true` in tsconfig.json
- No `any` types — use `unknown` and narrow with type guards
- All component props must have explicit interfaces
- All API response shapes are typed in `types/esp32.ts`
- Use `type` for shapes, `interface` for component props
- No implicit returns in functions — always explicit return types
- Enums are forbidden — use `as const` objects instead

```ts
// Good
const ALERT_TYPES = {
  FALL: 'fall',
  CLIFF: 'cliff',
  OBSTACLE: 'obstacle',
} as const;
type AlertType = typeof ALERT_TYPES[keyof typeof ALERT_TYPES];

// Bad
enum AlertType { FALL, CLIFF, OBSTACLE }
```

---

## 7. Component Rules

- Every component is a named export (no default exports except screens)
- Props interface is defined directly above the component
- No inline styles except for truly dynamic values (e.g., animated width)
- Static styles always use `StyleSheet.create({})`
- Colors always imported from `constants/colors.ts`
- Spacing always imported from `constants/layout.ts`
- Components never fetch data — data flows down from hooks

```tsx
// Good
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface DetectionCardProps {
  type: DetectionLabel['label'];
  direction: string | null;
  timestamp: number;
}

export const DetectionCard = ({ type, direction, timestamp }: DetectionCardProps) => {
  return (
    <View style={styles.card}>
      ...
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.radiusMd,
    padding: Layout.md,
  },
});
```

---

## 8. Screens (Expo Router)

- Screens are default exports (required by Expo Router)
- Screens only contain layout — logic lives in hooks
- Every screen calls `useESP32()` at root level to keep polling active
- Every screen has a `<Stack.Screen options={{ title: '...' }} />` at top

```tsx
// Good screen structure
export default function HomeScreen() {
  useESP32();           // starts polling
  useAlerts();          // handles alert side effects

  const status = useDeviceStore(s => s.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header />
      <DeviceStrip />
      <StatusRing status={deriveStatus(status)} />
      <TileGrid />
      <SOSButton />
    </SafeAreaView>
  );
}
```

---

## 9. Error Handling

- All network calls are wrapped in try/catch
- Errors are never surfaced as console.error in production — use a `logger.ts` utility
- Component errors are caught by an `ErrorBoundary` wrapping the root layout
- `status === null` is the canonical "disconnected" state — handle it in every component that reads status

```ts
// utils/logger.ts
export const logger = {
  error: (context: string, error: unknown) => {
    if (__DEV__) console.error(`[${context}]`, error);
    // Future: send to Sentry or similar
  },
};
```

---

## 10. Permissions

Request at startup (in `app/_layout.tsx`):

```ts
import * as Notifications from 'expo-notifications';

// Notifications (for fall/cliff alerts)
await Notifications.requestPermissionsAsync();

// No camera permission needed — stream is via WebView (ESP32 serves it)
// No location permission for MVP — deferred to v2
```

---

## 11. Onboarding (First Launch)

Detect via AsyncStorage key `onboarding_complete`:

```ts
const isFirstLaunch = !(await AsyncStorage.getItem('onboarding_complete'));
if (isFirstLaunch) router.replace('/onboarding');
```

Onboarding screens (3 steps):
1. Welcome + product intro
2. Enter ESP32 IP address + test connection button
3. Set emergency contact name + phone

On completion: `AsyncStorage.setItem('onboarding_complete', 'true')` → `router.replace('/(tabs)/')`

---

## 12. Testing

- Component unit tests: Jest + React Native Testing Library
- Test files: `__tests__/` directory next to the file being tested
- Naming: `ComponentName.test.tsx`
- Test coverage required for: `useESP32`, `useAlerts`, `deviceStore`, `esp32.ts`
- No tests required for pure layout components in MVP

---

## 13. Environment

Create `.env` at project root (do not commit to git):

```
EXPO_PUBLIC_DEFAULT_ESP_IP=192.168.4.1
EXPO_PUBLIC_APP_VERSION=1.0.0
```

Access in code:
```ts
const defaultIp = process.env.EXPO_PUBLIC_DEFAULT_ESP_IP ?? '192.168.4.1';
```
