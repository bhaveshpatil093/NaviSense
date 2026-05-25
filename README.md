<h1 align="center">
  <img src="assets/icon.png" width="96" height="96" alt="NaviSense Icon" /><br/>
  NaviSense
</h1>

<p align="center">
  <strong>Smart Cane Companion App for the Visually Impaired</strong><br/>
  A real-time assistive technology mobile application powered by ESP32
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54.0-blue?logo=expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey" />
</p>

---

## 📖 Overview

**NaviSense** is a React Native companion app for a smart assistive cane designed for visually impaired users. It communicates with an **ESP32 microcontroller** over Wi-Fi to provide real-time obstacle detection, fall detection, cliff detection, AI-powered object recognition, and emergency SOS functionality.

The app was built as part of **PS29 — Pune Solvathon 2026**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🟢 **Live Device Status** | Real-time connection and sensor status from the ESP32 cane |
| ⚠️ **Obstacle Detection** | Distance and direction of detected obstacles (left / front / right) |
| 🔴 **Fall & Cliff Detection** | Immediate alert banners for dangerous situations |
| 🤖 **AI Object Recognition** | Camera-based detection feed — vehicles, people, animals, potholes |
| 🆘 **SOS Emergency Button** | Countdown-based SOS with auto-dial to emergency contact |
| 🔋 **Battery Monitoring** | Live battery percentage from the cane |
| 🔔 **Alert History** | Timestamped, filterable log of all sensor alerts |
| 🔒 **Offline-first** | Settings and alert history persist across sessions via AsyncStorage |
| ♿ **Accessible** | Full VoiceOver / TalkBack support with proper `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` on every interactive element |

---

## 📱 Screenshots

> Coming soon — run the app locally to see it in action.

---

## 🏗️ Architecture

```
NaviSense/
├── app/                        # Expo Router file-based navigation
│   ├── _layout.tsx             # Root layout (fonts, splash, error boundary)
│   ├── onboarding.tsx          # First-run setup screen
│   ├── sos.tsx                 # SOS emergency screen
│   └── (tabs)/                 # Tab navigator
│       ├── _layout.tsx         # Tab bar configuration
│       ├── index.tsx           # Home screen (status, ring, quick grid)
│       ├── feed.tsx            # Camera / AI detection live feed
│       ├── alerts.tsx          # Alert history with filtering
│       └── settings.tsx        # Device and emergency settings
│
├── components/                 # Reusable UI components
│   ├── AlertBanner.tsx         # Slide-in alert notification
│   ├── BatteryBar.tsx          # Battery level indicator
│   ├── Chip.tsx                # Pill-shaped label chip
│   ├── DetectionPanel.tsx      # AI detection result panel
│   ├── DeviceStrip.tsx         # Device name + battery strip
│   ├── DisconnectedBanner.tsx  # Offline reconnecting banner
│   ├── ErrorBoundary.tsx       # React error boundary wrapper
│   ├── IconTile.tsx            # Home screen quick-action tile
│   ├── NoSignalPlaceholder.tsx # Empty state for no connection
│   ├── ObstacleOverlay.tsx     # Directional obstacle overlay
│   ├── SOSButton.tsx           # Animated SOS trigger button
│   ├── SectionHeader.tsx       # Settings section heading
│   ├── StatusDot.tsx           # Connection indicator dot
│   └── StatusRing.tsx          # Main animated status ring
│
├── services/
│   └── esp32.ts                # HTTP polling service (fetch with timeout)
│
├── hooks/
│   ├── useESP32.ts             # Polling loop hook (500 ms interval)
│   └── useAlerts.ts            # Alert sound + vibration logic
│
├── store/
│   └── deviceStore.ts          # Zustand global state + AsyncStorage persistence
│
├── constants/
│   ├── colors.ts               # Design token colour palette
│   ├── typography.ts           # Font families and size scale
│   └── layout.ts               # Spacing, radius, and touch-target constants
│
├── types/
│   └── esp32.ts                # TypeScript interfaces (DeviceStatus, AlertEvent…)
│
├── utils/
│   ├── audio.ts                # expo-av sound playback helpers
│   └── logger.ts               # Lightweight tagged logger
│
├── __tests__/                  # Jest unit tests
│   ├── store/deviceStore.test.ts
│   ├── hooks/useAlerts.test.ts
│   └── services/esp32.test.ts
│
└── __mocks__/                  # Jest manual mocks
    ├── react-native-reanimated.ts
    ├── expo-notifications.ts
    └── @react-native-async-storage/
```

### Data Flow

```
ESP32 Cane  ──Wi-Fi──▶  services/esp32.ts  ──▶  useESP32 hook
                              │                        │
                         HTTP GET /status         setStatus()
                         HTTP GET /alerts         addAlert()
                         HTTP GET /detection      addDetection()
                              │
                              ▼
                    store/deviceStore.ts  (Zustand + AsyncStorage)
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
               index.tsx  alerts.tsx  feed.tsx   …all screens
```

### State Management

The app uses **Zustand** with the `persist` middleware. State is split into two domains:

- **RuntimeState** — ephemeral: `status`, `alerts`, `detectionHistory`, `isConnecting`, `currentBanner`
- **SettingsState** — persisted via AsyncStorage: `espIp`, `deviceName`, `emergencyName`, `emergencyPhone`, `soundEnabled`, `vibrationEnabled`, `sensitivity`, `onboardingComplete`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 |
| Language | TypeScript 5.9 |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| State | [Zustand](https://zustand-demo.pmnd.rs) v5 |
| Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) v4 |
| Audio | [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) |
| Notifications | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| Camera/WebView | [react-native-webview](https://github.com/react-native-webview/react-native-webview) |
| Testing | Jest + @testing-library/react-native |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/go) app on your phone, **or** a configured iOS/Android simulator

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bhaveshpatil093/NaviSense.git
cd NaviSense

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start -c
```

Scan the QR code with **Expo Go** (Android) or your iPhone Camera (iOS).

### Running on a specific platform

```bash
npm run android   # Android emulator or device
npm run ios       # iOS simulator or device
npm run web       # Web browser (limited features)
```

---

## ⚙️ Configuration

On first launch, the app shows an **Onboarding screen** where you configure:

| Setting | Default | Description |
|---|---|---|
| ESP32 IP Address | `192.168.4.1` | Wi-Fi IP of your NaviSense cane |
| Device Name | `NaviSense-01` | Friendly display name |
| Emergency Contact Name | — | Name shown on the SOS screen |
| Emergency Phone Number | — | Number dialled during SOS |

Settings can be updated anytime from the **Settings tab**.

---

## 📡 ESP32 API Contract

The app polls three HTTP endpoints on the ESP32 every **500 ms**:

### `GET /status`
```json
{
  "connected": true,
  "battery": 78,
  "mode": "day",
  "fall_detected": false,
  "cliff_detected": false,
  "obstacle": {
    "direction": "front",
    "distance_cm": 45
  },
  "last_alert": null,
  "timestamp": 1716640000000
}
```

### `GET /alerts`
```json
{
  "type": "obstacle",
  "severity": "high",
  "sensor": "ultrasonic-front",
  "timestamp": 1716640000000
}
```

### `GET /detection`
```json
{
  "label": "vehicle",
  "confidence": 0.91,
  "timestamp": 1716640000000
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

Test files live in `__tests__/` and cover:
- `deviceStore` — state mutations and deduplication logic
- `useAlerts` — sound/vibration trigger conditions
- `esp32` service — fetch timeout and error handling

---

## 📂 Key Files Reference

| File | Purpose |
|---|---|
| [`app/_layout.tsx`](app/_layout.tsx) | Root layout — font loading, splash screen, error boundary |
| [`store/deviceStore.ts`](store/deviceStore.ts) | Single source of truth for all app state |
| [`services/esp32.ts`](services/esp32.ts) | All HTTP communication with the cane |
| [`hooks/useESP32.ts`](hooks/useESP32.ts) | Polling lifecycle — starts on mount, cleans up on unmount |
| [`hooks/useAlerts.ts`](hooks/useAlerts.ts) | Triggers sounds and vibrations on new alerts |
| [`constants/colors.ts`](constants/colors.ts) | Full design-token colour palette |
| [`constants/layout.ts`](constants/layout.ts) | Spacing scale, border radii, min touch sizes |

---

## 🤝 Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

---

## 👥 Team

**PS29 — Pune Solvathon 2026**

Built with ❤️ to make the world more accessible.
