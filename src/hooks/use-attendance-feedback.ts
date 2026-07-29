import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const presentSound = require('@/assets/sounds/present.wav');
const absentSound = require('@/assets/sounds/absent.wav');

export type AttendanceFeedbackKind = 'present' | 'absent' | 'open' | 'saved';

function replay(player: { seekTo: (seconds: number) => void; play: () => void }) {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Ignore playback failures (unsupported devices / autoplay policies).
  }
}

/**
 * Short haptic + UI click sounds for attendance cell interactions.
 */
export function useAttendanceFeedback() {
  const presentPlayer = useAudioPlayer(presentSound);
  const absentPlayer = useAudioPlayer(absentSound);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  const trigger = (kind: AttendanceFeedbackKind) => {
    switch (kind) {
      case 'present':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        replay(presentPlayer);
        break;
      case 'absent':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        replay(absentPlayer);
        break;
      case 'open':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'saved':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        replay(absentPlayer);
        break;
    }
  };

  return { trigger };
}
