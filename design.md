# NaviSense — App Design Document

> This file governs all UI/UX decisions. Every screen, component, color, and spacing choice must follow this document. Do not deviate without updating this file first.

---

## 1. Project Overview

**App name:** NaviSense  
**Platform:** React Native (Expo SDK 51+)  
**Target OS:** Android 8.0+ (API 26), iOS 13+  
**Purpose:** Companion mobile app for the NaviSense smart cane system for visually impaired users. Connects to ESP32 hardware over local Wi-Fi, streams live camera feed, displays AI hazard detection labels, and triggers emergency SOS alerts.

---

## 2. Folder Structure

```
navisense-app/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx           # Home screen
│   │   ├── feed.tsx            # Live camera feed
│   │   ├── alerts.tsx          # Alert log
│   │   └── settings.tsx        # Settings
│   ├── sos.tsx                 # SOS full-screen (modal)
│   ├── onboarding.tsx          # First-launch setup
│   └── _layout.tsx             # Root layout
├── components/
│   ├── StatusRing.tsx          # Animated connection/status indicator
│   ├── AlertBanner.tsx         # In-app alert overlay
│   ├── DetectionCard.tsx       # Single AI detection item
│   ├── SensorChip.tsx          # Sensor status indicator chip
│   ├── SOSButton.tsx           # Large emergency trigger button
│   ├── TileGrid.tsx            # 2×2 home screen navigation tiles
│   └── DeviceStrip.tsx         # Battery + connection info bar
├── hooks/
│   ├── useESP32.ts             # Polling loop, connection state
│   ├── useAlerts.ts            # Alert queue + notifications
│   └── useSettings.ts          # AsyncStorage settings
├── services/
│   ├── esp32.ts                # HTTP fetch wrappers for ESP32 endpoints
│   └── notifications.ts        # Expo Notifications setup
├── store/
│   └── deviceStore.ts          # Zustand global state
├── constants/
│   ├── colors.ts               # All color tokens
│   ├── typography.ts           # Font sizes, weights
│   └── layout.ts               # Spacing, radius constants
├── assets/
│   └── fonts/                  # Space Mono, DM Sans
└── app.json
```

---

## 3. Color System

All colors are defined in `constants/colors.ts`. Never use raw hex values inside components — always import from this file.

```ts
// constants/colors.ts
export const Colors = {
  // Backgrounds
  bgPrimary:    '#0D0F14',   // main screen background
  bgCard:       '#1A1D25',   // card and tile surfaces
  bgElevated:   '#22263A',   // modals, popovers

  // Accent
  accentBlue:   '#2D9CDB',   // connected state, links, primary CTA
  accentGreen:  '#27AE60',   // all clear, safe, success
  accentOrange: '#F2994A',   // caution, obstacle warning
  accentRed:    '#EB5757',   // danger, SOS, fall detected

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A8B8',
  textMuted:     '#4A5060',

  // Borders
  border:        '#2A2D38',
  borderStrong:  '#3A3F52',

  // SOS screen
  sosBg:         '#7F1D1D',
  sosText:       '#FCA5A5',
  sosAccent:     '#FCA5A5',
};
```

**Semantic usage rules:**
- `accentGreen` → all-clear status, safe detections, connected indicator
- `accentOrange` → obstacle warning, caution states
- `accentRed` → fall detected, cliff detected, SOS active, danger labels
- `accentBlue` → navigation links, settings values, reconnect button
- Never use color as the only signal — always pair with an icon or text label

---

## 4. Typography

```ts
// constants/typography.ts
export const Typography = {
  // Display / headings
  headingFont:  'SpaceMono-Bold',      // headings, status labels
  bodyFont:     'DMSans-Regular',      // all body text, labels
  bodyMedFont:  'DMSans-Medium',       // emphasized body text

  sizes: {
    xs:   9,
    sm:   11,
    base: 13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
  },
};
```

**Rules:**
- Screen titles: `headingFont`, size `lg`, color `textPrimary`
- Card labels: `bodyFont`, size `sm`, color `textSecondary`
- Alert headings: `bodyMedFont`, size `md`, color appropriate accent
- Status ring label: `headingFont`, size `xs`, uppercase
- SOS heading: `headingFont`, size `xxl`, color `sosText`
- Minimum rendered font size: **11px** — never go below

---

## 5. Spacing & Layout

```ts
// constants/layout.ts
export const Layout = {
  // Base 8px grid
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,

  // Border radius
  radiusSm:  6,
  radiusMd:  10,
  radiusLg:  14,
  radiusFull: 999,   // circles, pills

  // Component sizes
  tileHeight:    80,
  sosButtonHeight: 56,
  chipHeight:    28,
  touchMinSize:  48,   // WCAG minimum touch target
};
```

All padding and margin values must be multiples of 4. Never use arbitrary values like 7 or 13.

---

## 6. Screen Designs

### 6.1 Home Screen (`app/(tabs)/index.tsx`)

**Layout (top to bottom):**
1. **Header row** — "NaviSense" logo text (left) + connection dot + status text (right)
2. **Device strip** — `DeviceStrip` component: device name, battery %, current mode (day/night)
3. **Status ring** — `StatusRing` component, 100px diameter, centered, animated pulse on "ALL CLEAR"
4. **2×2 Tile grid** — `TileGrid` with 4 tiles: Live Feed, AI Detect, Alerts (with badge), Settings
5. **SOS button** — `SOSButton`, full width, 56px height, always visible at bottom

**Status ring states:**

| State | Border color | Icon | Label |
|---|---|---|---|
| All clear | `accentGreen` | check-circle | ALL CLEAR |
| Obstacle | `accentOrange` | alert-circle | OBSTACLE |
| Fall detected | `accentRed` | alert-triangle | FALL |
| Cliff | `accentRed` | trending-down | CLIFF |
| Disconnected | `border` | wifi-off | OFFLINE |

---

### 6.2 Live Feed Screen (`app/(tabs)/feed.tsx`)

**Layout:**
1. **Back button** + "Live feed" title row
2. **Sensor status row** — 3 `SensorChip` components (Ultrasonic ×3, LDR, IR)
3. **Camera view** — 16:9 `WebView` loading MJPEG stream from `http://{ip}/stream`
   - Overlaid bottom-left: AI detection badge (colored pill with hazard label)
   - Overlaid top-right: streaming indicator dot (red pulsing when live)
   - Shows "No signal" placeholder when disconnected
4. **"Detections" section label**
5. **Detection card list** — last 5 `DetectionCard` items, scrollable

**Detection badge colors:**

| Hazard type | Badge bg | Icon |
|---|---|---|
| Vehicle / Animal | `accentRed` bg (10% opacity) + red text | car / paw |
| Pothole / Overhead | `accentOrange` bg (10% opacity) + orange text | alert-triangle |
| Person | `accentBlue` bg (10% opacity) + blue text | user |
| Clear path | `accentGreen` bg (10% opacity) + green text | check |

---

### 6.3 Alert Log Screen (`app/(tabs)/alerts.tsx`)

**Layout:**
1. Title "Alerts" + clear-all button (top right, only if list non-empty)
2. **Filter tabs** — All / Fall / Cliff / Obstacle / SOS (horizontal scroll)
3. **Alert list** — `FlatList` of alert items
4. **Empty state** — centered icon + "No alerts — all clear" text

**Alert item structure:**
- Left: colored icon circle (16px icon, 36px circle)
- Center: alert type (bold) + description text + timestamp
- Right: swipe-to-dismiss (React Native Swipeable)

---

### 6.4 SOS Screen (`app/sos.tsx`)

This is a **full-screen modal** that overlays everything. Background: `sosBg` (#7F1D1D).

**Layout (centered, full screen):**
1. "SOS ACTIVE" heading — `headingFont`, xxl size, `sosText`
2. Trigger reason — "Fall detected · MPU6050" — sm size, `sosText` 80% opacity
3. **Countdown ring** — 64px circle, animated countdown from 10 to 0 in seconds
4. Helper text — "Sending alert in Xs…"
5. **Cancel button** — outlined, `sosText` border and text — "Cancel — I am safe"
6. **Call button** — `accentGreen` bg — "Call [Contact Name]" + phone number below
7. **Share location button** — `bgCard` — map-pin icon + "Share my location"

**Trigger conditions (auto-open this screen):**
- Fall detected alert received from ESP32
- Manual tap on SOS button (home screen)

**Auto-send logic:**
- Countdown runs 10 seconds
- If not cancelled → opens native phone dialer via `Linking.openURL('tel:...')`

---

### 6.5 Settings Screen (`app/(tabs)/settings.tsx`)

Sections (each with a muted uppercase section label):

**Device**
- ESP32 IP Address — text input
- Device name — text input
- Re-scan button (runs network scan)

**Alerts**
- Sound alerts — toggle
- Vibration — toggle
- Sensitivity — segmented control: Low / Medium / High

**Emergency Contact**
- Name — text input
- Phone number — phone input

**Appearance**
- Dark mode — toggle (always on for MVP, light mode is v2)
- Day/Night mode override — toggle

**About**
- App version, team name, build date

---

## 7. Component Specs

### `StatusRing`
```
Props: status: 'clear' | 'obstacle' | 'fall' | 'cliff' | 'offline'
Size: 100px diameter
Animation: CSS-style pulse on 'clear' (scale 1.0 → 1.05 → 1.0, 2s loop)
No animation on danger states — static for immediate readability
```

### `AlertBanner`
```
Props: type, message, onDismiss
Position: top of screen, below status bar
Height: 52px
Auto-dismiss: 5 seconds (except fall/cliff — persist until tapped)
Animation: slide down from top, slide up on dismiss
```

### `SOSButton`
```
Props: onPress
Size: full width, 56px height
Color: accentRed bg, white text
Icon: alert-triangle (left of text)
Text: "SOS" — headingFont, lg
Long-press required: 1.5 seconds hold to prevent accidental trigger
Show press-hold progress ring around button border while holding
```

### `DetectionCard`
```
Props: type, direction, timestamp
Left icon circle: 36px, colored per hazard type
Type label: bodyMedFont, md
Timestamp + direction: bodyFont, xs, textSecondary
```

---

## 8. Navigation Structure

```
Root Navigator (Stack)
├── Onboarding (shown only on first launch)
└── Main (Tab Navigator)
    ├── Tab 1: Home (index)
    ├── Tab 2: Live Feed
    ├── Tab 3: Alerts
    └── Tab 4: Settings

Modal (overlaid on top of everything)
└── SOS Screen (triggered programmatically, not via tab)
```

Tab bar: dark bg (`bgPrimary`), active tab icon in `accentBlue`, inactive in `textMuted`. No labels on tab bar — icons only (with accessibility labels).

---

## 9. Accessibility Requirements

- All interactive elements: minimum 48×48dp touch target (`Layout.touchMinSize`)
- Color is **never** the sole indicator — every status has an icon AND text AND color
- All buttons have `accessibilityLabel` props
- All icons have `accessibilityLabel` or `aria-hidden` equivalent
- Alert sounds play via `expo-av` — distinct tones per alert type:
  - Fall: 3 short rapid beeps
  - Cliff: 2 long beeps
  - SOS: continuous alarm tone
- Screen reader order must match visual order (avoid absolute positioning reordering)
- Font sizes respect system accessibility scaling (`allowFontScaling: true` on all `Text`)

---

## 10. Animations

| Element | Animation | Duration |
|---|---|---|
| Status ring (clear) | Pulse scale 1→1.05→1 | 2000ms loop |
| Alert banner | Slide from top | 250ms ease-out |
| SOS countdown ring | Stroke-dashoffset sweep | 1000ms per second |
| Tile press | Scale 0.97 on press | 100ms |
| Connection dot | Fade in/out | 500ms loop when scanning |

---

## 11. Error & Edge States

| Scenario | UI response |
|---|---|
| ESP32 not reachable | Grey status ring, "Offline" label, retry button in device strip |
| Camera stream timeout | "No signal" placeholder with reconnect button |
| Invalid IP in settings | Inline error text below input, red border |
| Empty alerts list | Centered illustration + "All clear" text |
| SOS contact not set | SOS screen shows "No emergency contact set" + link to settings |
| Battery data missing | Show "--%" instead of crashing |
