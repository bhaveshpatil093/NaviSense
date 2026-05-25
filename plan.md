# NaviSense — Build Plan

> This file defines what to build, in what order, and what done looks like for each task. Follow this sequence exactly. Do not jump ahead. Mark tasks complete as you go.

---

## How to Use This File

- Work through phases top to bottom
- Each task has a clear **goal**, **files to create/edit**, and **done criteria**
- Reference `design.md` for all UI decisions
- Reference `instructions.md` for all coding rules
- If a task feels unclear, re-read the relevant section in `design.md` before proceeding

---

## Phase 0 — Project Setup

### Task 0.1 — Initialize Expo project
**Goal:** Working blank Expo project with TypeScript and Expo Router

**Commands:**
```bash
npx create-expo-app@latest navisense-app --template tabs
cd navisense-app
npx expo install expo-router react-native-reanimated react-native-webview
npx expo install @react-native-async-storage/async-storage
npx expo install expo-notifications expo-av
npx expo install zustand
```

**Done when:**
- [x] `npx expo start` runs without errors
- [x] TypeScript strict mode is on in `tsconfig.json`
- [x] Expo Router is configured in `app.json`

---

### Task 0.2 — Create folder structure
**Goal:** All directories and placeholder files exist

**Create these empty folders:**
```
components/
hooks/
services/
store/
constants/
types/
utils/
assets/fonts/
```

**Done when:**
- [x] All folders exist
- [x] No code written yet — just structure

---

### Task 0.3 — Install and configure fonts
**Goal:** Space Mono and DM Sans load correctly

**Files:**
- Download `SpaceMono-Bold.ttf` and `DMSans-Regular.ttf`, `DMSans-Medium.ttf` into `assets/fonts/`
- Configure in `app/_layout.tsx` using `useFonts` from `expo-font`

**Done when:**
- [x] Fonts load on app start
- [x] No font warnings in console

---

### Task 0.4 — Create constants
**Goal:** Color, typography, and layout tokens exist and are importable

**Files to create:**
- `constants/colors.ts` — copy exact values from `design.md` Section 3
- `constants/typography.ts` — copy from `design.md` Section 4
- `constants/layout.ts` — copy from `design.md` Section 5

**Done when:**
- [x] All three files exist
- [x] No raw hex values anywhere except these three files
- [x] TypeScript compiles cleanly

---

### Task 0.5 — Create TypeScript types
**Goal:** All ESP32 response shapes are typed

**Files to create:**
- `types/esp32.ts` — `DeviceStatus`, `AlertEvent`, `DetectionLabel` interfaces (see `instructions.md` Section 2)

**Done when:**
- [x] All three interfaces defined
- [x] File compiles with no errors

---

## Phase 1 — State & Services Layer

### Task 1.1 — Create Zustand store
**Goal:** Global state store with device status, alerts, and persisted settings

**File to create:** `store/deviceStore.ts`  
**Reference:** `instructions.md` Section 3

**Done when:**
- [x] Store has `status`, `alerts`, `setStatus`, `addAlert`, `clearAlerts`
- [x] Settings fields exist: `espIp`, `deviceName`, `emergencyName`, `emergencyPhone`, `soundEnabled`, `vibrationEnabled`, `sensitivity`
- [x] Zustand persist middleware writes to AsyncStorage
- [x] No TypeScript errors

---

### Task 1.2 — Create ESP32 service
**Goal:** HTTP fetch wrappers for all 4 ESP32 endpoints

**File to create:** `services/esp32.ts`  
**Reference:** `instructions.md` Section 2

**Implement:**
- `getBaseUrl()` — reads IP from store
- `fetchWithTimeout(url, ms)` — 3-second timeout using AbortController
- `fetchStatus()` → `DeviceStatus`
- `fetchAlerts()` → `AlertEvent | null`
- `fetchDetection()` → `DetectionLabel | null`

**Done when:**
- [x] All 4 functions are exported
- [x] Every function has a return type annotation
- [x] Every function has try/catch (callers handle errors, not this layer)
- [x] `fetchWithTimeout` aborts after 3000ms

---

### Task 1.3 — Create useESP32 hook
**Goal:** Polling loop that updates store every 500ms

**File to create:** `hooks/useESP32.ts`  
**Reference:** `instructions.md` Section 2

**Done when:**
- [x] `setInterval` polls every 500ms
- [x] Interval is cleared on unmount
- [x] On error, `setStatus(null)` is called (not thrown)
- [x] Uses `Promise.allSettled` to fetch status + alerts + detection in parallel

---

### Task 1.4 — Create useAlerts hook
**Goal:** Side effects on fall/cliff detection — vibration, notification, SOS navigation

**File to create:** `hooks/useAlerts.ts`  
**Reference:** `instructions.md` Section 4

**Done when:**
- [x] Fall detected → vibration pattern + notification + `router.push('/sos')`
- [x] Cliff detected → vibration pattern + notification (no auto-SOS)
- [x] `useEffect` deps are `[status?.fall_detected, status?.cliff_detected]`
- [x] No infinite re-render loops

---

### Task 1.5 — Create notifications service
**Goal:** Notification permissions requested at startup

**File to create:** `services/notifications.ts`

```ts
import * as Notifications from 'expo-notifications';

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  await Notifications.requestPermissionsAsync();
};
```

**Done when:**
- [x] Function is exported and called from `app/_layout.tsx` on mount
- [x] Permission request appears on first launch

---

## Phase 2 — Core Components

### Task 2.1 — StatusRing component
**File:** `components/StatusRing.tsx`  
**Reference:** `design.md` Section 7

**Props:** `status: 'clear' | 'obstacle' | 'fall' | 'cliff' | 'offline'`

**Done when:**
- [x] 100px circle with correct border color per status
- [x] Correct icon and label per status (see table in `design.md` 6.1)
- [x] Pulse animation runs on `'clear'` using `react-native-reanimated`
- [x] No animation on danger states

---

### Task 2.2 — DeviceStrip component
**File:** `components/DeviceStrip.tsx`

**Shows:** device name, battery %, mode (day/night)  
**Reads from:** `useDeviceStore`  
**Handles:** `status === null` → shows "Disconnected"

**Done when:**
- [x] Displays all three values
- [x] Shows "--%" when battery is null/undefined
- [x] Uses `Colors.bgCard` background, `Layout.radiusMd` radius

---

### Task 2.3 — TileGrid component
**File:** `components/TileGrid.tsx`

**4 tiles:** Live Feed, AI Detect, Alerts (with unread badge), Settings  
**Each tile:** icon (24px), label below, `Colors.bgCard` background  
**Navigation:** each tile calls `router.push()` on press  
**Scale animation on press:** 0.97, 100ms

**Done when:**
- [ ] 2×2 grid renders correctly
- [ ] Alert badge shows unread count from store
- [ ] Badge hidden when count is 0
- [ ] All tiles navigate to correct screen

---

### Task 2.4 — SOSButton component
**File:** `components/SOSButton.tsx`

**Reference:** `design.md` Section 7

**Done when:**
- [ ] Full-width, 56px height
- [ ] `accentRed` background, white text
- [ ] Requires 1.5-second long press (not instant tap)
- [ ] Shows press-hold progress ring filling during hold
- [ ] On successful long press → `router.push('/sos')`
- [ ] `accessibilityLabel="Emergency SOS button, hold for 1.5 seconds to activate"`

---

### Task 2.5 — AlertBanner component
**File:** `components/AlertBanner.tsx`

**Props:** `type: AlertEvent['type']`, `message: string`, `onDismiss: () => void`

**Done when:**
- [x] Slides down from top using `react-native-reanimated`
- [x] Auto-dismisses after 5 seconds (except fall/cliff)
- [x] Correct color per alert type
- [x] Tappable anywhere to dismiss manually

---

### Task 2.6 — DetectionCard component
**File:** `components/DetectionCard.tsx`

**Reference:** `design.md` Section 7 + table in 6.2

**Done when:**
- [ ] Left colored icon circle, 36px
- [ ] Type label (bold) + direction + timestamp
- [ ] Correct color scheme per hazard type (see table in `design.md` 6.2)

---

### Task 2.7 — SensorChip component
**File:** `components/SensorChip.tsx`

**Props:** `label: string`, `active: boolean`, `color?: string`

**Done when:**
- [ ] 28px height pill chip
- [ ] Green text/border when active, muted when inactive
- [ ] Renders correctly in a horizontal row

---

## Phase 3 — Screens

### Task 3.1 — Root layout
**File:** `app/_layout.tsx`

**Done when:**
- [x] Fonts loaded via `useFonts`
- [x] `setupNotifications()` called on mount
- [x] First-launch check → redirect to `/onboarding` if needed
- [x] `ErrorBoundary` wraps the navigator
- [x] `Stack` navigator configured with `screenOptions={{ headerShown: false }}`

---

### Task 3.2 — Onboarding screen
**File:** `app/onboarding.tsx`

**3 steps (render all vertically, scroll through — no carousel for MVP):**
1. Welcome — app name, tagline, "Get started" button
2. ESP32 setup — IP input + "Test connection" button that calls `fetchStatus()` and shows result
3. Emergency contact — name + phone inputs

**Done when:**
- [ ] All 3 steps render
- [ ] "Test connection" shows success (green) or failure (red) inline
- [ ] On complete → sets `onboarding_complete` in AsyncStorage → navigates to `/(tabs)/`
- [ ] Emergency contact saved to store

---

### Task 3.3 — Home screen
**File:** `app/(tabs)/index.tsx`

**Reference:** `design.md` Section 6.1

**Done when:**
- [ ] Calls `useESP32()` and `useAlerts()`
- [ ] Header with connection status dot
- [ ] `DeviceStrip` shows live data
- [ ] `StatusRing` reflects current device status
- [ ] `TileGrid` with working navigation
- [ ] `SOSButton` at bottom
- [ ] `AlertBanner` appears when alerts arrive

---

### Task 3.4 — Live feed screen
**File:** `app/(tabs)/feed.tsx`

**Reference:** `design.md` Section 6.2

**Done when:**
- [ ] Back button navigates to home
- [ ] 3 `SensorChip` components show ultrasonic, LDR, IR status
- [ ] `WebView` loads MJPEG stream from `http://{espIp}/stream`
- [ ] AI detection badge overlays bottom-left of stream
- [ ] `NoSignalPlaceholder` shown when stream fails
- [ ] Last 5 `DetectionCard` items listed below stream

---

### Task 3.5 — Alert log screen
**File:** `app/(tabs)/alerts.tsx`

**Reference:** `design.md` Section 6.3

**Done when:**
- [ ] Filter tabs: All / Fall / Cliff / Obstacle — correctly filters `alerts` from store
- [ ] `FlatList` renders alert items in reverse-chronological order
- [ ] Swipe to dismiss individual alert
- [ ] "Clear all" button visible when list non-empty
- [ ] Empty state message when no alerts

---

### Task 3.6 — SOS screen
**File:** `app/sos.tsx`

**Reference:** `design.md` Section 6.4

**Done when:**
- [ ] Full-screen red (`sosBg`) background
- [ ] "SOS ACTIVE" heading
- [ ] Countdown ring animates from 10 to 0
- [ ] At 0 → `Linking.openURL('tel:' + emergencyPhone)`
- [ ] "Cancel — I am safe" button stops countdown and navigates back
- [ ] "Call [Name]" button opens dialer immediately
- [ ] "Share my location" opens maps app
- [ ] Warning shown if no emergency contact is set

---

### Task 3.7 — Settings screen
**File:** `app/(tabs)/settings.tsx`

**Reference:** `design.md` Section 6.5

**Done when:**
- [ ] All 4 sections render: Device, Alerts, Emergency, Appearance
- [ ] IP address input saves to store on blur
- [ ] Toggles update store immediately
- [ ] Emergency contact saves on blur
- [ ] About section shows version from `.env`

---

## Phase 4 — Polish & Accessibility

### Task 4.1 — Accessibility pass
**Goal:** Every interactive element meets WCAG 2.1 AA

**Checklist:**
- [ ] All buttons have `accessibilityLabel`
- [ ] All icons have `accessibilityLabel` or `accessibilityHidden={true}`
- [ ] Touch targets are minimum 48×48dp (`Layout.touchMinSize`)
- [ ] All `Text` components have `allowFontScaling={true}`
- [ ] Status is never conveyed by color alone (always icon + text + color)

---

### Task 4.2 — Alert sounds
**Goal:** Distinct audio tones per alert type using `expo-av`

**File:** `services/sounds.ts`

| Alert | Sound pattern |
|---|---|
| Fall | 3 short beeps (300ms on, 200ms off) |
| Cliff | 2 long beeps (600ms on, 200ms off) |
| Obstacle | 1 short beep |
| SOS active | Continuous alarm (looping) |

**Done when:**
- [ ] Sounds play when alert fires (if `soundEnabled === true` in settings)
- [ ] SOS alarm loops while SOS screen is open
- [ ] SOS alarm stops when SOS is cancelled

---

### Task 4.3 — Error states
**Goal:** Every error state renders correctly (no blank screens or crashes)

**Checklist:**
- [ ] `status === null` → grey status ring + "Offline" label on home
- [ ] Stream timeout → NoSignalPlaceholder on feed screen
- [ ] Invalid IP → inline red error text in settings
- [ ] No emergency contact → warning on SOS screen
- [ ] Empty alerts → empty state illustration on alerts screen

---

### Task 4.4 — Animations
**Goal:** All animations from `design.md` Section 10 implemented

**Checklist:**
- [ ] StatusRing pulse on 'clear' — 2000ms loop
- [ ] AlertBanner slide from top — 250ms
- [ ] SOS countdown ring — stroke animation
- [ ] Tile scale on press — 100ms
- [ ] Connection dot fade when scanning

---

## Phase 5 — Testing & Handoff

### Task 5.1 — Unit tests
**Files:** `__tests__/useESP32.test.ts`, `__tests__/deviceStore.test.ts`, `__tests__/esp32.test.ts`

**Test cases:**
- `fetchWithTimeout` aborts after 3000ms
- `setStatus(null)` sets disconnected state
- `addAlert` prepends to array and caps at 100 items
- `clearAlerts` empties array
- Fall detection triggers SOS navigation

**Done when:**
- [ ] All test cases pass
- [ ] `npx jest` runs without errors

---

### Task 5.2 — Device testing checklist

**Test on physical Android device (minimum):**
- [ ] Connect to ESP32 Access Point Wi-Fi
- [ ] App detects ESP32 and shows "Connected"
- [ ] Camera stream loads in under 3 seconds
- [ ] Fall detection triggers SOS screen
- [ ] SOS countdown works and opens dialer
- [ ] Settings changes persist after app restart
- [ ] App handles ESP32 going offline gracefully (no crash)
- [ ] All touch targets are comfortably tappable

---

### Task 5.3 — Build for demo

```bash
# Development build for physical device
npx expo run:android

# Or EAS build for APK
npx eas build -p android --profile preview
```

**Done when:**
- [ ] APK installs and runs on Android device
- [ ] No red screen errors
- [ ] App connects to real ESP32 hardware

---

## Summary: Phase Order

```
Phase 0: Setup         (~1 day)   Tasks 0.1–0.5
Phase 1: Services      (~2 days)  Tasks 1.1–1.5
Phase 2: Components    (~2 days)  Tasks 2.1–2.7
Phase 3: Screens       (~4 days)  Tasks 3.1–3.7
Phase 4: Polish        (~2 days)  Tasks 4.1–4.4
Phase 5: Testing       (~2 days)  Tasks 5.1–5.3
──────────────────────────────────────────────
Total                  ~13 days
```
