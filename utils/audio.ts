import { Audio } from 'expo-av';
import { logger } from './logger';

// Map of sound keys to their asset requires.
// Developer note: Replace the placeholder audio files in `assets/sounds/` with real audio files:
// - assets/sounds/fall_alert.mp3
// - assets/sounds/cliff_alert.mp3
// - assets/sounds/sos_active.mp3
const soundMap: Record<string, any> = {
  'fall_alert': require('../assets/sounds/fall_alert.mp3'),
  'cliff_alert': require('../assets/sounds/cliff_alert.mp3'),
  'sos_active': require('../assets/sounds/sos_active.mp3'),
};

export const configureAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    logger.error('configureAudio', error);
  }
};

export const playAlert = async (key: string) => {
  const asset = soundMap[key];
  if (!asset) {
    logger.error('playAlert', `Sound key '${key}' not found.`);
    return;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(asset);
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch((err) => {
          logger.error('playAlert unload', err);
        });
      }
    });

    await sound.playAsync();
  } catch (error) {
    logger.error('playAlert', error);
  }
};
