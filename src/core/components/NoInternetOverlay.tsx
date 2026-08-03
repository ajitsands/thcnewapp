import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {screenWidth, scaleFont} from '../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../themes/fonts';

export const NoInternetOverlay = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="wifi-off" size={18} color="#F87171" style={styles.icon} />
      <Text style={styles.text}>Offline Mode — Showing Cached Data</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: screenWidth,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0F172A',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#F8FAFC',
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
  },
});
