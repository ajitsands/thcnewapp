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
import SvgPause from '../../../assets/svg/svgPause.svg';
import SvgPlay from '../../../assets/svg/svgPlaybutton.svg';
import RNFS from 'react-native-fs';
import {scaleFont} from '../../../utils/helper';
const audioRecorderPlayer = new AudioRecorderPlayer();

const AudioPlayerUI = ({track, isLocal, isAssets, onAudioRecorded}) => {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedPath, setRecordedPath] = useState('');

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonPositive: 'OK',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const onStartRecord = async () => {
    const granted = await requestPermission();
    if (!granted) return;

    try {
      const path = Platform.select({
        ios: 'recorded.m4a',
        android: undefined, // default path
      });
      if (isRecording) {
        toast.show('Already recording in progress.', {type: 'warning'});
        return;
      }
      await audioRecorderPlayer.startRecorder(path);
      setIsRecording(true);
      console.log('------------------------------------------', path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordingTime(e.currentPosition / 1000);
        return;
      });
    } catch (err) {
      console.warn('Recording error:', err);
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setRecordingTime(0);
      setRecordedPath(result);
      if (onAudioRecorded) {
        onAudioRecorded(result);
      }
    } catch (err) {
      console.warn('Stop recording error:', err);
    }
  };
  const checkRemoteFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, {method: 'HEAD'});
      return response.ok;
    } catch (error) {
      toast.show('Audio file not found ', {type: 'danger'});
      return false;
    }
  };

  const play = async () => {
    try {
      const path = recordedPath || track;
      console.log('------------------------------------------', path);
      let exists = false;

      // ✅ Check for local file
      if (path.startsWith('file://') || path.startsWith('/')) {
        exists = await RNFS.exists(path);
      } else {
        // ✅ Check for remote URL
        exists = await checkRemoteFileExists(path);
      }

      if (!exists) {
        toast.show('Audio file not found ', {type: 'danger'});
        return;
      }

      const msg = await audioRecorderPlayer.startPlayer(path);
      console.log(msg);
      if (!msg) {
        toast.show('Failed to start audio player', {type: 'danger'});
        return;
      }
      audioRecorderPlayer.addPlayBackListener(e => {
        setPosition(e.currentPosition / 1000);
        setDuration(e.duration / 1000);

        if (e.currentPosition >= e.duration) {
          stop();
        }
        return;
      });
      setIsPlaying(true);
    } catch (e) {
      toast.show('Unable to play the file', {type: 'danger'});
      console.log(e);
    }
  };

  const pause = async () => {
    await audioRecorderPlayer.pausePlayer();
    setIsPlaying(false);
  };

  const stop = async () => {
    await audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setIsPlaying(false);
    setPosition(0);
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const getFormattedTime = (sec: any) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {(recordedPath || (!isLocal && track)) && (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={isPlaying ? pause : play}
            style={styles.play}>
            {isPlaying ? (
              <SvgPause height={10} width={10} />
            ) : (
              <SvgPlay height={12} width={12} />
            )}
          </TouchableOpacity>

          <Text style={styles.timeText}>{getFormattedTime(position)}</Text>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            disabled={true}
            minimumTrackTintColor="#4a90e2"
            maximumTrackTintColor="#ccc"
            thumbTintColor={colors.grey}
          />

          <Text style={styles.timeText}>{getFormattedTime(duration)}</Text>
        </View>
      )}
      {!isAssets && (
        <View
          style={{
            padding: 2,
            borderRadius: 30,
            borderWidth: 1,
            margin: 5,
            borderColor: isRecording ? colors.red : colors.green,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: scaleFont(14),
              fontFamily: FontFamily.medium,
              color: isRecording ? colors.green : colors.black,
              marginLeft: '20%',
            }}>
            {isRecording
              ? getFormattedTime(recordingTime)
              : 'PRESS AND HOLD TO RECORD'}
          </Text>

          <Pressable
            onPressIn={() => onStartRecord()}
            onPressOut={() => onStopRecord()}
            style={{
              backgroundColor: isRecording ? colors.red : colors.green,
              height: 40,
              width: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialIcons name="mic" size={20} color={colors.white} />
          </Pressable>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F9FD',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#DCECFB',
  },
  icon: {
    fontSize: scaleFont(20),
    marginHorizontal: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: scaleFont(12),
    width: 40,
    textAlign: 'center',
  },
  play: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default AudioPlayerUI;
