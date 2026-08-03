import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {scaleFont, screenHeight, screenWidth} from '../../../utils/helper';
import AssetModal from '../components/assetModal';
import {navigate} from '../../../navigators';
import {useIsFocused} from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';

const frameSize = 260;

export const QRScannerScreen = () => {
  const [qrValue, setQrValue] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const isFocused = useIsFocused();

  const onReadCode = (event: any) => {
    if (qrValue !== event.nativeEvent.codeStringValue) {
      Vibration.vibrate(100);
      setQrValue(event.nativeEvent.codeStringValue);
    }
  };

  const toggleFlashlight = () => {
    setFlashOn(prev => !prev);
  };

  const goToAssetDetails = () => {
    if (qrValue) {
      navigate('AssetDetails', {assetCode: qrValue});
    } else {
      navigate('AssetDetails', {assetCode: 'THC-C0001-CY-1001-0YW'});
    }
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />

      {/* Main Camera & Viewfinder Container */}
      <View style={styles.scannerWrapper}>
        {isFocused && (
          <Camera
            style={StyleSheet.absoluteFill}
            scanBarcode={true}
            laserColor={colors.secondary}
            frameColor={colors.primary}
            onReadCode={onReadCode}
            torchMode={flashOn ? 'on' : 'off'}
          />
        )}

        {/* Semi-transparent Overlay Masks */}
        <View style={styles.topMask} />

        <View style={styles.middleRow}>
          <View style={styles.sideMask} />
          
          {/* Scanner Framing Box */}
          <View style={styles.qrFrame}>
            <View style={styles.topLeft} />
            <View style={styles.topRight} />
            <View style={styles.bottomLeft} />
            <View style={styles.bottomRight} />
          </View>

          <View style={styles.sideMask} />
        </View>

        <View style={styles.bottomMask}>
          {/* Flashlight Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.flashButton, flashOn && styles.flashButtonActive]}
            onPress={toggleFlashlight}>
            <MaterialIcons
              name={flashOn ? 'flash-on' : 'flash-off'}
              size={20}
              color={flashOn ? colors.primary : colors.white}
            />
            <Text
              style={[
                styles.flashText,
                flashOn && {color: colors.primary, fontFamily: FontFamily.bold},
              ]}>
              {flashOn ? 'Torch On' : 'Torch Off'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.guideText}>
            Align QR or Barcode within the frame to scan
          </Text>
        </View>
      </View>

      {/* Bottom Control Card */}
      <View style={styles.bottomCard}>
        {/* Scanned Code Display Badge */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.codeBadge}
          onPress={() => setVisible(true)}>
          <MaterialIcons name="qr-code-scanner" size={22} color={colors.primary} />
          <Text style={styles.codeBadgeText} numberOfLines={1}>
            {qrValue ? qrValue : 'Tap to enter asset code manually'}
          </Text>
          <MaterialIcons name="edit" size={18} color={colors.grey} />
        </TouchableOpacity>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.infoButton}
          onPress={goToAssetDetails}>
          <MaterialIcons name="search" size={22} color={colors.white} />
          <Text style={styles.infoButtonText}>GET ASSET INFORMATION</Text>
        </TouchableOpacity>
      </View>

      {visible && (
        <AssetModal visible={visible} toggle={() => setVisible(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scannerWrapper: {
    flex: 1,
  },
  topMask: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  middleRow: {
    flexDirection: 'row',
    height: frameSize,
    alignItems: 'center',
  },
  sideMask: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    paddingTop: 24,
  },
  qrFrame: {
    width: frameSize,
    height: frameSize,
    position: 'relative',
    borderRadius: 20,
  },
  topLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
    borderColor: colors.secondary,
  },
  topRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
    borderColor: colors.secondary,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
    borderColor: colors.secondary,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
    borderColor: colors.secondary,
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  flashButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  flashText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    marginLeft: 8,
  },
  guideText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  bottomCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeBadgeText: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginHorizontal: 10,
  },
  infoButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  infoButtonText: {
    color: colors.white,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});

export default QRScannerScreen;
