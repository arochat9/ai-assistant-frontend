# AI Assistant Mobile App

React Native + Expo app with real-time voice conversation using OpenAI Realtime API.

## Setup

```bash
cd mobile-app
npm install
```

## Production

run npx expo run:ios --device --configuration Release

- device lets you choose your device
- configuration release is production build

Also maybe run npx expo prebuild if you need to update the icon

- and go into xcode -> product -> clean build folder (clears cache I think?)

## Development

run npx expo run:ios

### Run on iOS Simulator

```bash
npm start
# Press 'i' to open iOS simulator
```

### Run on Physical Device (requires native build)

```bash
npx expo prebuild --clean
npx expo run:ios --device
```

### Backend Required

The app connects to the middleware WebSocket for voice mode:

```bash
cd ../middleware
npm run dev  # Runs on http://localhost:3000
```

## Voice Mode

Uses `react-native-audio-api` for both recording and playback (single audio library to avoid iOS audio session conflicts).

**Flow:**

1. Tap orb → starts recording (24kHz PCM)
2. Tap again → sends audio to OpenAI Realtime API via WebSocket
3. Receives streaming audio response → plays back via AudioBufferQueueSourceNode

**Key files:**

- `src/components/VoiceMode.tsx` - Voice UI component
- `src/hooks/useRealtimeAudio.ts` - Audio recording/playback hook
- `middleware/src/utils/realtimeWebSocket.ts` - WebSocket proxy to OpenAI

## Rebuild Native Code

After changing native dependencies or config:

```bash
npx expo prebuild --clean
npx expo run:ios
```
