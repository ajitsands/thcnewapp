import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Vibration,
} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {useNavigation} from '@react-navigation/native';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {scaleFont, screenHeight, screenWidth} from '../../../utils/helper';
import AssetModal from '../components/assetModal';
import {navigate} from '../../../navigators';
import {useIsFocused} from '@react-navigation/native';
const frameSize = 250;
export const QRScannerScreen = () => {
  const [qrValue, setQrValue] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const lastTap = useRef(0);
  const isFocused=useIsFocused()
  const onReadCode = (event:any) => {
    if (qrValue !== event.nativeEvent.codeStringValue) {
      Vibration.vibrate();
      setQrValue(event.nativeEvent.codeStringValue);
    }
  };
  const toggleFlashlight = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Detected double tap within 300ms
      setFlashOn(prev => !prev);
    }
    lastTap.current = now;
  };
  const goToAssetDetails = () => {
    console.log('bbb',qrValue);
    if (qrValue) {
      navigate('AssetDetails', {assetCode: qrValue});
    }
     else {
      navigate('AssetDetails', {assetCode: 'THC-C0001-CY-1001-0YW'});
    }
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <View style={styles.scannerWrapper}>
        {isFocused&&
        <Camera
          style={StyleSheet.absoluteFill}
          // showFrame={true}
          scanBarcode={true}
          laserColor={'#FFD81F'}
          frameColor={'#0B2C51'}
          onReadCode={onReadCode}
          torchMode={flashOn ? 'on' : 'off'}
        />
        }
        <View style={[styles.mask, {height: (screenHeight - frameSize) / 2}]} />

        {/* Middle Section with Cutout */}
        <View style={styles.middleRow}>
          {/* Left Mask */}
          <View style={styles.side} />
          <View style={styles.qrFrame}>
            {/* QR Frame border */}
            <View style={styles.topLeft} />
            <View style={styles.topRight} />
            <View style={styles.bottomLeft} />
            <View style={styles.bottomRight} />
          </View>
          {/* <View style={styles.mask} /> */}
          <View style={styles.side} />
        </View>
        <View style={[styles.mask, {height: (screenHeight - frameSize) / 2}]} />

        <TouchableOpacity onPress={() => toggleFlashlight()}>
          <Text style={styles.flashText}>
            Double tap to open or close the flashlight
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.assetButton}
          onPress={() => {
            setVisible(true);
            // Show modal or input bottom sheet here
          }}>
          <Text style={styles.assetButtonText}>
            {qrValue || 'ASSET NUMBER'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={goToAssetDetails}>
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
  },
  scannerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
  },

  topBottomMask: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
  },

  flashText: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: colors.white,
    fontSize: scaleFont(13),
  },
  bottomContainer: {
    backgroundColor: colors.white,
    flex: 0.3,
  },
  assetButton: {
    backgroundColor: colors.red,
    borderWidth: 3,
    borderColor: '#959595',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    // marginHorizontal:20,
    margin: 20,
  },
  assetButtonText: {
    color: colors.white,
    fontSize: scaleFont(18),
  },
  infoButton: {
    marginHorizontal: 20,
    backgroundColor: '#33485E',
    borderWidth: 3,
    borderColor: '#959595',
    borderRadius: 12,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
  },
  image: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },

  qrFrame: {
    width: '100%',
    maxWidth: screenWidth - 50,
    height: 350,
    position: 'relative',
    // marginHorizontal: 20,
    borderRadius: 20, // ⬅️ Rounded corners
    // overflow: 'hidden', // ⬅️ Ensures child views respect the border radius
    // borderWidth: 2,
    // borderColor: colors.primary,
  },
  topLeft: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 15,
    borderColor: colors.red,
  },
  topRight: {
    borderTopRightRadius: 15,
    position: 'absolute',
    top: -5,
    right: -5,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: colors.primary,
    zIndex: 1,
  },
  bottomLeft: {
    borderBottomLeftRadius: 15,
    position: 'absolute',
    bottom: -5,
    left: -5,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: colors.primary,
    zIndex: 1,
  },
  bottomRight: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: colors.red,
    borderBottomRightRadius: 15,
    zIndex: 1,
  },
  centerLine: {
    position: 'absolute',
    width: 300,
    height: 4,
    backgroundColor: colors.primary,
    top: '50%',
    zIndex: 1,
    borderRadius: 5,
  },

  cutout: {
    width: 250,
    height: 250,
    borderWidth: 1,

    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayContainer: {
    position: 'absolute',
    top: '10%', // Adjust this to position the image
    marginLeft: '45%',
    transform: [{translateX: -50}], // Center the image horizontally
    zIndex: 10,
  },
  overlayImage: {
    width: 150, // Adjust the size of the overlay image
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  redSideLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'red',
    opacity: 0.5, // Optional: make it slightly transparent
    zIndex: 0,
  },
  side: {
    width: 30, // or however thick you want the red overlay
    height: 350, // should match qrFrame height
    backgroundColor: 'rgba(0,0,0,0.5)',
    // optional for transparency
  },
});

export default QRScannerScreen;
