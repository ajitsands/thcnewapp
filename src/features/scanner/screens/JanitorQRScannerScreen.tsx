import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont, screenWidth} from '../../../utils/helper';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useAppDispatch, useAppSelector} from '../../../store';
import {verifyAssetAndLocation, getJanitorSettings} from '../../../store/reducers/janitorExecutionReducer';
import {calculateDistanceMeters, getCurrentLocation, formatDistance} from '../../../utils/geoHelper';
import moment from 'moment';

const frameSize = 260;

export const JanitorQRScannerScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();

  const reduxSettings = useAppSelector((state: any) => state?.janitorExecution?.settings);
  const activeSettings = route.params?.settings || reduxSettings || {};

  const minRadiusMeters =
    Number(activeSettings?.min_radius_meters) > 0
      ? Number(activeSettings.min_radius_meters)
      : 50;

  const allowGpsBypass =
    String(activeSettings?.allow_gps_bypass || 'NO').toUpperCase() === 'YES';

  const lateThresholdMinutes =
    Number(activeSettings?.late_time_minutes) >= 0
      ? Number(activeSettings.late_time_minutes)
      : 15;

  const {
    assignment,
    expectedAssetCode = '',
    targetLat = 0,
    targetLng = 0,
    checklistId,
    assignmentId,
    slotsDetail,
    selectedDate,
  } = route.params || {};

  // Date restriction evaluation: Only current date tasks can be scanned
  const todayDate = moment().format('YYYY-MM-DD');
  const taskDate = selectedDate
    ? (moment(selectedDate, ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601], true).isValid()
        ? moment(selectedDate, ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601], true).format('YYYY-MM-DD')
        : moment(selectedDate).format('YYYY-MM-DD'))
    : todayDate;

  const isToday = taskDate === todayDate;
  const isPast = taskDate < todayDate;
  const isFuture = taskDate > todayDate;

  const [isDateRestricted, setIsDateRestricted] = useState(!isToday);
  const [flashOn, setFlashOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatusText, setVerificationStatusText] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  // Scan & Location state
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [lastDeviceLat, setLastDeviceLat] = useState<number | null>(null);
  const [lastDeviceLng, setLastDeviceLng] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isLocationMismatch, setIsLocationMismatch] = useState(false);
  const [isGpsError, setIsGpsError] = useState(false);

  // Error dialog state
  const [errorModalVisible, setErrorModalVisible] = useState(!isToday);
  const [errorTitle, setErrorTitle] = useState(!isToday ? 'Date Restriction' : '');
  const [errorMessage, setErrorMessage] = useState(
    !isToday
      ? isPast
        ? `This cleaning task was scheduled for a past date (${moment(taskDate).format('DD MMMM YYYY')}).\n\nJanitors are only permitted to scan and execute tasks for the current date (${moment(todayDate).format('DD MMMM YYYY')}).\n\nPlease go back and select today's schedule.`
        : `This cleaning task is scheduled for an upcoming date (${moment(taskDate).format('DD MMMM YYYY')}).\n\nYou cannot scan upcoming tasks in advance. Please scan on the scheduled day (${moment(taskDate).format('DD MMMM YYYY')}).\n\nPlease go back and select today's schedule.`
      : '',
  );

  // Check date restriction immediately on mount
  React.useEffect(() => {
    if (!isToday) {
      setIsDateRestricted(true);
      setErrorTitle('Date Restriction');
      setErrorMessage(
        isPast
          ? `This cleaning task was scheduled for a past date (${moment(taskDate).format('DD MMMM YYYY')}).\n\nJanitors are only permitted to scan and execute tasks for the current date (${moment(todayDate).format('DD MMMM YYYY')}).\n\nPlease go back and select today's schedule.`
          : `This cleaning task is scheduled for an upcoming date (${moment(taskDate).format('DD MMMM YYYY')}).\n\nYou cannot scan upcoming tasks in advance. Please scan on the scheduled day (${moment(taskDate).format('DD MMMM YYYY')}).\n\nPlease go back and select today's schedule.`
      );
      setErrorModalVisible(true);
    }
  }, [isToday, isPast, isFuture, taskDate, todayDate]);

  // Fetch settings from server on mount if not provided in params
  React.useEffect(() => {
    if (!route.params?.settings) {
      dispatch(getJanitorSettings());
    }
  }, [route.params?.settings, dispatch]);

  const onReadCode = async (event: any) => {
    if (!isToday) {
      setIsDateRestricted(true);
      setErrorTitle('Date Restriction');
      setErrorMessage(
        isPast
          ? `Scanning is disabled for past dates (${moment(taskDate).format('DD MMMM YYYY')}). Janitors can only scan today's tasks.`
          : `Scanning is disabled for upcoming dates (${moment(taskDate).format('DD MMMM YYYY')}). You can only scan on the scheduled day.`,
      );
      setErrorModalVisible(true);
      return;
    }

    if (hasScanned || isVerifying) {
      return;
    }

    const scannedValue = event.nativeEvent?.codeStringValue || '';
    if (!scannedValue) {
      return;
    }

    setHasScanned(true);
    Vibration.vibrate(100);

    const cleanScanned = scannedValue.trim();
    const cleanExpected = (expectedAssetCode || '').trim();
    setLastScannedCode(cleanScanned);

    // ==========================================
    // STEP 1: RETRIEVE DEVICE GPS LOCATION FIRST
    // ==========================================
    setIsVerifying(true);
    setVerificationStatusText('Retrieving accurate device GPS location...');

    let currentLat = 0;
    let currentLng = 0;
    let distance = 0;

    try {
      const position = await getCurrentLocation();
      currentLat = position.latitude;
      currentLng = position.longitude;

      setLastDeviceLat(currentLat);
      setLastDeviceLng(currentLng);

      distance = calculateDistanceMeters(
        currentLat,
        currentLng,
        Number(targetLat) || currentLat,
        Number(targetLng) || currentLng,
      );
      setCalculatedDistance(distance);
    } catch (gpsError: any) {
      console.warn('[JanitorQRScanner] GPS retrieval error:', gpsError);
    }

    console.log('[JanitorQRScanner] Pushing Scan Location to Server:', {
      cleanScanned,
      cleanExpected,
      currentLat,
      currentLng,
      targetLat,
      targetLng,
      distanceMeters: distance,
      assignmentId: assignmentId || assignment?.assignment_id,
    });

    // ==========================================
    // STEP 2: ASSET CODE CHECK & SERVER PUSH
    // ==========================================
    // If scanned code doesn't match expected asset code, push scan to server & notify user
    if (cleanExpected && cleanScanned !== cleanExpected) {
      if (currentLat && currentLng) {
        setVerificationStatusText('Logging mismatched scan to server...');
        try {
          await dispatch(
            verifyAssetAndLocation({
              asset_code: cleanScanned,
              latitude: currentLat,
              longitude: currentLng,
              asset_latitude: targetLat,
              asset_longitude: targetLng,
              assignment_id: assignmentId || assignment?.assignment_id,
            }),
          );
        } catch (e) {
          // ignore error since code is mismatched anyway
        }
      }
      setIsVerifying(false);
      setIsLocationMismatch(false);
      setIsGpsError(false);
      setErrorTitle('Asset Code Mismatch');
      setErrorMessage(
        `Scanned QR: "${cleanScanned}"\n\nExpected Asset Code: "${cleanExpected}"\n\nPlease scan the physical QR sticker attached to this specific asset.\n\n(Your scan attempt and location have been logged on the server.)`,
      );
      setErrorModalVisible(true);
      return;
    }

    // If GPS could not be obtained
    if (!currentLat || !currentLng) {
      setIsVerifying(false);
      setIsLocationMismatch(false);
      setIsGpsError(true);
      setErrorTitle('GPS Location Error');
      setErrorMessage(
        `Could not retrieve accurate GPS location.\n\nPlease check phone Location settings or tap "TEST MODE: PROCEED ANYWAY" below to test the checklist.`,
      );
      setErrorModalVisible(true);
      return;
    }

    // ==========================================
    // STEP 3: PUSH SCAN LOCATION & VERIFY WITH SERVER
    // ==========================================
    setVerificationStatusText('Logging scan location & verifying with portal...');

    const verifyRes: any = await dispatch(
      verifyAssetAndLocation({
        asset_code: cleanScanned,
        latitude: currentLat,
        longitude: currentLng,
        asset_latitude: targetLat,
        asset_longitude: targetLng,
        allowed_radius_meters: minRadiusMeters,
        assignment_id: assignmentId || assignment?.assignment_id,
        date: taskDate,
      }),
    );

    setIsVerifying(false);

    if (verifyRes?.error) {
      const errorText =
        typeof verifyRes?.payload === 'string'
          ? verifyRes.payload
          : verifyRes?.payload?.api_message ||
            verifyRes?.error?.message ||
            'Failed to verify attendance with portal.';

      const isMismatch =
        errorText.toUpperCase().includes('LOCATION MISMATCH') ||
        errorText.includes('Mismatch') ||
        distance > minRadiusMeters;

      setIsLocationMismatch(isMismatch);
      setIsGpsError(false);
      setErrorTitle(isMismatch ? 'Location Mismatch' : 'Server Verification Failed');
      setErrorMessage(
        isMismatch
          ? `Your scanned location is ${formatDistance(
              distance,
            )} away from this asset (${assignment?.building_name || 'Assigned Building'}).\n\nAllowed rule: Must be within ${minRadiusMeters} meters.${
              allowGpsBypass
                ? '\n\nTap "TEST MODE: PROCEED ANYWAY" below to test the checklist.'
                : '\n\nGPS test bypass is disabled in Janitor Settings. Please move within ' + minRadiusMeters + 'm to proceed.'
            }`
          : errorText,
      );
      setErrorModalVisible(true);
      return;
    }

    // ==========================================
    // STEP 4: SUCCESS -> NAVIGATE TO CHECKLIST
    // ==========================================
    navigation.replace('JanitorChecklist', {
      assignment,
      checklistId: checklistId || assignment?.checklist_id,
      assignmentId: assignmentId || assignment?.assignment_id,
      slotsDetail,
      selectedDate,
      verifiedDistance: distance,
      verifiedAt: new Date().toISOString(),
      scanLat: currentLat,
      scanLng: currentLng,
      assetLat: targetLat,
      assetLng: targetLng,
      settings: activeSettings,
    });
  };

  const handleRetryScan = () => {
    setErrorModalVisible(false);
    setHasScanned(false);
    setIsVerifying(false);
    setIsLocationMismatch(false);
    setIsGpsError(false);
  };

  const handleBypassLocation = async () => {
    setErrorModalVisible(false);
    setIsVerifying(true);
    setVerificationStatusText('Recording attendance in Test Mode...');

    const codeToVerify = lastScannedCode || expectedAssetCode || '';
    let actualLat = lastDeviceLat;
    let actualLng = lastDeviceLng;

    if (!actualLat || !actualLng) {
      try {
        const pos = await getCurrentLocation();
        actualLat = pos.latitude;
        actualLng = pos.longitude;
      } catch (e) {
        actualLat = Number(targetLat) || 26.1869544;
        actualLng = Number(targetLng) || 50.5222792;
      }
    }

    try {
      await dispatch(
        verifyAssetAndLocation({
          asset_code: codeToVerify,
          latitude: actualLat,
          longitude: actualLng,
          asset_latitude: targetLat,
          asset_longitude: targetLng,
          allowed_radius_meters: 5000000,
          assignment_id: assignmentId || assignment?.assignment_id,
          date: taskDate,
        }),
      );
    } catch (err: any) {
      console.warn('[JanitorQRScanner] Test mode verify error:', err);
    } finally {
      setIsVerifying(false);
      setHasScanned(false);

      navigation.replace('JanitorChecklist', {
        assignment,
        checklistId: checklistId || assignment?.checklist_id,
        assignmentId: assignmentId || assignment?.assignment_id,
        slotsDetail,
        selectedDate,
        verifiedDistance: calculatedDistance || 0,
        verifiedAt: new Date().toISOString(),
        isTestBypass: true,
        scanLat: actualLat,
        scanLng: actualLng,
        assetLat: targetLat,
        assetLng: targetLng,
        settings: activeSettings,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />

      {/* Target Asset Instruction Banner */}
      <View style={styles.targetBanner}>
        <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
        <View style={styles.targetInfo}>
          <Text style={styles.targetSubLabel}>SCANNING TARGET ASSET</Text>
          <Text style={styles.targetCodeText} numberOfLines={1}>
            {expectedAssetCode || 'Asset Code'}
          </Text>
          <Text style={styles.targetDescText} numberOfLines={1}>
            {assignment?.building_name ? `${assignment.building_name} • ` : ''}
            {assignment?.asset_description || 'Assigned cleaning unit'}
          </Text>
        </View>
      </View>

      {/* Camera & Scanner Viewfinder */}
      <View style={styles.scannerWrapper}>
        {isFocused && (
          <Camera
            style={StyleSheet.absoluteFill}
            scanBarcode={!hasScanned && !isVerifying}
            laserColor={colors.secondary}
            frameColor={colors.primary}
            onReadCode={onReadCode}
            torchMode={flashOn ? 'on' : 'off'}
          />
        )}

        {/* Viewfinder Overlays */}
        <View style={styles.topMask} />

        <View style={styles.middleRow}>
          <View style={styles.sideMask} />
          <View style={styles.qrFrame}>
            <View style={styles.topLeft} />
            <View style={styles.topRight} />
            <View style={styles.bottomLeft} />
            <View style={styles.bottomRight} />
          </View>
          <View style={styles.sideMask} />
        </View>

        <View style={styles.bottomMask}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.flashButton, flashOn && styles.flashButtonActive]}
            onPress={() => setFlashOn(prev => !prev)}>
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
            Align the QR code on the toilet/asset inside the frame
          </Text>
          <Text style={styles.precisionHint}>
            📍 High-precision GPS verification required (within {minRadiusMeters}m)
          </Text>

          {/* Test Shortcut - Only shown if GPS Test Bypass is enabled in Admin Settings and it is today */}
          {allowGpsBypass && !isDateRestricted && isToday && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.directTestShortcut}
              onPress={handleBypassLocation}>
              <Text style={styles.directTestShortcutText}>
                ⚡ Testing? Tap here to open checklist directly
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Verification Loading Overlay */}
      {isVerifying && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Verifying Location</Text>
            <Text style={styles.loadingSubText}>{verificationStatusText}</Text>
          </View>
        </View>
      )}

      {/* Error / Mismatch Modal */}
      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.errorIconCircle}>
              <MaterialIcons
                name={isDateRestricted ? 'event-busy' : 'error-outline'}
                size={36}
                color={isDateRestricted ? '#DC2626' : '#EF4444'}
              />
            </View>
            <Text style={styles.modalTitle}>{errorTitle}</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>

            {/* If Date Restricted, show only Go Back button */}
            {isDateRestricted ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.retryButton, {backgroundColor: '#2563EB'}]}
                onPress={() => {
                  setErrorModalVisible(false);
                  navigation.goBack();
                }}>
                <MaterialIcons name="arrow-back" size={20} color={colors.white} />
                <Text style={styles.retryButtonText}>GO BACK TO SCHEDULE</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Primary Retry Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.retryButton}
                  onPress={handleRetryScan}>
                  <MaterialIcons name="refresh" size={20} color={colors.white} />
                  <Text style={styles.retryButtonText}>TRY AGAIN</Text>
                </TouchableOpacity>

                {/* Test Mode Bypass Button - Only allowed if enabled by Admin */}
                {(isLocationMismatch || isGpsError) && allowGpsBypass && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.bypassButton}
                    onPress={handleBypassLocation}>
                    <MaterialIcons name="bolt" size={20} color={colors.white} />
                    <Text style={styles.bypassButtonText}>TEST MODE: PROCEED ANYWAY</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  targetBanner: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
  },
  targetInfo: {
    marginLeft: 12,
    flex: 1,
  },
  targetSubLabel: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.5,
  },
  targetCodeText: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  targetDescText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  precisionHint: {
    color: '#93C5FD',
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: screenWidth - 64,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 14,
  },
  loadingSubText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 6,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontFamily: FontFamily.bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    width: '100%',
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
  },
  bypassButton: {
    backgroundColor: '#059669', // Emerald green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    width: '100%',
    marginTop: 10,
    elevation: 2,
  },
  bypassButtonText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  directTestShortcut: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  directTestShortcutText: {
    color: '#FDE047',
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
  },
});

export default JanitorQRScannerScreen;
