import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useToast} from 'react-native-toast-notifications';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {formatImageUrl, scaleFont} from '../../../utils/helper';

interface AudioPlayerProps {
  track?: string;
  isLocal?: boolean;
  isAssets?: boolean;
  onAudioRecorded?: (path: string) => void;
}

const AudioPlayerUI = ({
  track,
  isLocal,
  isAssets,
  onAudioRecorded,
}: AudioPlayerProps) => {
  const toast = useToast();
  const audioRecorderPlayerRef = useRef<AudioRecorderPlayer | null>(null);
  if (!audioRecorderPlayerRef.current) {
    audioRecorderPlayerRef.current = new AudioRecorderPlayer();
  }
  const audioRecorderPlayer = audioRecorderPlayerRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedPath, setRecordedPath] = useState('');

  useEffect(() => {
    // Clear playback when a new track is loaded from parent
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }, [track]);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        return (
          grants['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Microphone permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const onStartRecord = async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        toast.show('Microphone permission required to record audio.', {
          type: 'warning',
        });
        return;
      }

      if (isPlaying) {
        try {
          await audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        } catch (_) {}
        setIsPlaying(false);
      }

      const path = Platform.select({
        ios: 'recorded.m4a',
        android: undefined,
      });

      const uri = await audioRecorderPlayer.startRecorder(path);
      setIsRecording(true);
      setRecordingTime(0);

      audioRecorderPlayer.addRecordBackListener((e: any) => {
        if (e && e.currentPosition !== undefined) {
          setRecordingTime(Math.floor(e.currentPosition / 1000));
        }
      });
      console.log('[AudioPlayerUI] Started recording to:', uri);
    } catch (err: any) {
      console.warn('Recording error:', err);
      setIsRecording(false);
      toast.show('Unable to start recording', {type: 'danger'});
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setRecordingTime(0);

      if (result) {
        console.log('[AudioPlayerUI] Recording saved at:', result);
        setRecordedPath(result);
        if (onAudioRecorded) {
          onAudioRecorded(result);
        }
      }
    } catch (err) {
      console.warn('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const play = async () => {
    try {
      let path = recordedPath || track;
      if (!path || typeof path !== 'string' || path.trim() === '') {
        toast.show('No audio file found to play.', {type: 'warning'});
        return;
      }

      if (!path.startsWith('file://') && !path.startsWith('/')) {
        const formatted = formatImageUrl(path);
        if (formatted) {
          path = formatted;
        }
      }

      console.log('[AudioPlayerUI] Starting playback for:', path);

      try {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      } catch (_) {}

      const msg = await audioRecorderPlayer.startPlayer(path);
      if (!msg) {
        toast.show('Unable to start audio playback.', {type: 'danger'});
        return;
      }

      setIsPlaying(true);

      audioRecorderPlayer.addPlayBackListener((e: any) => {
        if (e) {
          const currentPosSec = Math.floor((e.currentPosition || 0) / 1000);
          const durationSec = Math.floor((e.duration || 0) / 1000);
          setPosition(currentPosSec);
          if (durationSec > 0) {
            setDuration(durationSec);
          }

          if (e.currentPosition >= e.duration && e.duration > 0) {
            stop();
          }
        }
      });
    } catch (e: any) {
      console.log('Audio playback error:', e);
      toast.show('Unable to play the audio file.', {type: 'danger'});
      setIsPlaying(false);
    }
  };

  const pause = async () => {
    try {
      await audioRecorderPlayer.pausePlayer();
      setIsPlaying(false);
    } catch (e) {
      console.warn('Pause error:', e);
    }
  };

  const stop = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    } catch (e) {
      console.warn('Stop error:', e);
    } finally {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  useEffect(() => {
    return () => {
      try {
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
      } catch (_) {}
    };
  }, []);

  const getFormattedTime = (sec: number) => {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const minutes = Math.floor(safeSec / 60);
    const seconds = Math.floor(safeSec % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const hasAudioTrack = Boolean(
    recordedPath ||
      (track &&
        typeof track === 'string' &&
        track.trim() !== '' &&
        track !== 'null' &&
        track !== 'undefined' &&
        track !== 'NA'),
  );

  return (
    <View style={styles.wrapper}>
      {/* Audio Player Bar */}
      {hasAudioTrack && !isRecording && (
        <View style={styles.playerContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={isPlaying ? pause : play}
            style={styles.playBtn}>
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={16}
              color={colors.white}
            />
          </TouchableOpacity>

          <Text style={styles.timeText}>{getFormattedTime(position)}</Text>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            value={position}
            disabled={true}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="#CBD5E1"
            thumbTintColor={colors.primary}
          />

          <Text style={styles.timeText}>{getFormattedTime(duration)}</Text>
        </View>
      )}

      {/* Mic Record Button & Indicator */}
      {!isAssets && (
        <View
          style={[
            styles.recordContainer,
            isRecording && styles.recordingActiveContainer,
          ]}>
          <View style={styles.recordStatusRow}>
            {isRecording && <View style={styles.pulsingDot} />}
            <Text
              style={[
                styles.recordPromptText,
                isRecording && styles.recordingActiveText,
              ]}>
              {isRecording
                ? `Recording: ${getFormattedTime(recordingTime)}`
                : recordedPath
                ? 'HOLD TO RE-RECORD AUDIO'
                : 'PRESS AND HOLD TO RECORD'}
            </Text>
          </View>

          <Pressable
            onPressIn={onStartRecord}
            onPressOut={onStopRecord}
            style={({pressed}) => [
              styles.micButton,
              isRecording && styles.micButtonRecording,
              pressed && styles.micButtonPressed,
            ]}>
            <MaterialIcons
              name={isRecording ? 'graphic-eq' : 'mic'}
              size={20}
              color={colors.white}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  playerContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  timeText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.header,
    width: 38,
    textAlign: 'center',
  },
  playBtn: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  recordContainer: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingActiveContainer: {
    borderColor: colors.red,
    backgroundColor: '#FEF2F2',
  },
  recordStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginRight: 8,
  },
  recordPromptText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.3,
  },
  recordingActiveText: {
    color: colors.red,
  },
  micButton: {
    backgroundColor: colors.primary,
    height: 38,
    width: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  micButtonRecording: {
    backgroundColor: colors.red,
    shadowColor: colors.red,
  },
  micButtonPressed: {
    opacity: 0.85,
    transform: [{scale: 0.96}],
  },
});

export default AudioPlayerUI;
