// NoInternetOverlay.js
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {screenWidth} from '../../utils/helper';
import {useToast} from 'react-native-toast-notifications';

export const NoInternetOverlay = () => {
  const [isConnected, setIsConnected] = useState(true);
  const toast = useToast();
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;
  console.log('connected', isConnected);
  toast.show('No Internet Connection');
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: screenWidth,
    paddingVertical: 10,
    backgroundColor: '#ff4444',
    zIndex: 9999,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
