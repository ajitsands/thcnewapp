import {PermissionsAndroid, Platform} from 'react-native';
import moment from 'moment';
import Geolocation from '@react-native-community/geolocation';

/**
 * Formats distance into meters or kilometers
 */
export const formatDistance = (meters: number): string => {
  if (isNaN(meters) || !isFinite(meters)) {
    return 'Unknown';
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} meters`;
};

/**
 * Retrieves the device's current GPS location with multi-stage fallback to prevent timeouts:
 * 1. Fast check for recently cached system location (instant indoors)
 * 2. High accuracy GPS satellite fix (10s timeout)
 * 3. Network / Wi-Fi / Cell provider fallback (works indoors)
 */
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission was denied. Please allow location access in phone settings.');
  }

  // Switch to Google Play Services location provider (FusedLocationProviderClient)
  try {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'playServices',
    });
  } catch (cfgErr) {
    console.warn('[geoHelper] setRNConfiguration error:', cfgErr);
  }

  const queryPosition = (
    enableHighAccuracy: boolean,
    timeoutMs: number,
    maximumAge: number,
  ) => {
    return new Promise<{
      latitude: number;
      longitude: number;
      accuracy: number;
    }>((resolve, reject) => {
      let settled = false;

      // JS-level safety guard so promise never hangs forever
      const safetyTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Location request timed out'));
        }
      }, timeoutMs + 1000);

      Geolocation.getCurrentPosition(
        position => {
          if (!settled) {
            settled = true;
            clearTimeout(safetyTimer);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          }
        },
        error => {
          if (!settled) {
            settled = true;
            clearTimeout(safetyTimer);
            reject(error);
          }
        },
        {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge,
        },
      );
    });
  };

  // Attempt 1: Fast cached / fused location from Google Play Services (immediate, under 300ms)
  try {
    const cached = await queryPosition(false, 3000, 3600000);
    console.log('[geoHelper] Retrieved cached/fused location:', cached);
    return cached;
  } catch (cacheErr) {
    console.log('[geoHelper] No cached position, requesting active fix...');
  }

  // Attempt 2: High accuracy GPS / Fused (timeout: 7s)
  try {
    const freshGps = await queryPosition(true, 7000, 60000);
    console.log('[geoHelper] Retrieved high-accuracy GPS location:', freshGps);
    return freshGps;
  } catch (gpsErr) {
    console.warn(
      '[geoHelper] High accuracy GPS failed/timed out, falling back to network provider:',
      gpsErr,
    );
  }

  // Attempt 3: Balanced network / Wi-Fi / Cell provider (works indoors) (timeout: 8s)
  try {
    const networkPos = await queryPosition(false, 8000, Infinity);
    console.log('[geoHelper] Retrieved network location:', networkPos);
    return networkPos;
  } catch (networkErr: any) {
    console.warn('[geoHelper] PlayServices provider failed, trying android native provider fallback:', networkErr);
  }

  // Attempt 4: Android native provider fallback
  try {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'android',
    });
    const androidPos = await queryPosition(false, 8000, Infinity);
    console.log('[geoHelper] Retrieved android native location:', androidPos);
    return androidPos;
  } catch (androidErr: any) {
    console.warn('[geoHelper] Android provider also failed:', androidErr);
    throw new Error(
      'Could not retrieve GPS location. Please make sure Location (GPS) is turned ON in your phone quick settings and try again.',
    );
  }
};

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((R * c).toFixed(2));
};

/**
 * Requests location permissions on Android
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    return (
      granted['android.permission.ACCESS_FINE_LOCATION'] ===
        PermissionsAndroid.RESULTS.GRANTED ||
      granted['android.permission.ACCESS_COARSE_LOCATION'] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.warn('[geoHelper] Location permission error:', err);
    return false;
  }
};

export interface SlotRuleInfo {
  name?: string;
  slot_name?: string;
  slot_time?: string;
  start_time?: string;
  end_time?: string;
  has_rule?: number | boolean;
  has_time_rule?: boolean;
  time_rule?: string;
}

export interface SlotTimingStatus {
  isLate: boolean;
  delayMinutes: number;
  statusLabel: string;
  badgeColor: string;
  isWithinWindow: boolean;
}

/**
 * Formats minutes into human-readable hours and minutes (e.g. "1 hr 25 mins" or "45 mins")
 */
export const formatLateDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) {
    return '0 mins';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min${minutes > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} min${minutes > 1 ? 's' : ''}`;
};

/**
 * Evaluates whether current completion is on time or late based on slot end_time and server lateThresholdMinutes.
 * Late duration is calculated from the scheduled end time once the threshold is exceeded.
 */
export const evaluateSlotTiming = (
  slot: SlotRuleInfo,
  _targetDate?: string,
  lateThresholdMinutes: number = 0,
): SlotTimingStatus => {
  let hasRule =
    slot.has_rule === 1 ||
    slot.has_rule === true ||
    slot.has_time_rule === true;

  let startTimeStr = slot.start_time;
  let endTimeStr = slot.end_time;

  // Fallback: If no explicit start/end time, extract time range from text (e.g. "Slot 1 (08:00 - 11:55)")
  if (!endTimeStr || endTimeStr === '0' || endTimeStr.trim() === '') {
    const textToSearch = `${slot.slot_time || ''} ${slot.time_rule || ''} ${slot.name || ''}`;
    const rangeMatch = textToSearch.match(/(\d{1,2}:\d{2})\s*[-–to]+\s*(\d{1,2}:\d{2})/i);
    if (rangeMatch) {
      startTimeStr = rangeMatch[1].trim();
      endTimeStr = rangeMatch[2].trim();
      hasRule = true;
    }
  }

  // If no rule or missing valid end time, it's considered on time
  if (
    !hasRule ||
    !endTimeStr ||
    endTimeStr === '0' ||
    endTimeStr.trim() === '' ||
    endTimeStr.toLowerCase() === 'no rule'
  ) {
    return {
      isLate: false,
      delayMinutes: 0,
      statusLabel: 'No Time Rule (On Time)',
      badgeColor: '#10B981',
      isWithinWindow: true,
    };
  }

  const now = moment();

  // Parse slot times (supports "08:00", "08:00:00", "hh:mm A", etc.)
  const parsedEnd = moment(endTimeStr, ['HH:mm', 'HH:mm:ss', 'hh:mm A', 'H:m']);
  if (!parsedEnd.isValid()) {
    return {
      isLate: false,
      delayMinutes: 0,
      statusLabel: 'On Time',
      badgeColor: '#10B981',
      isWithinWindow: true,
    };
  }

  // Determine the base day (respecting the selected slot date)
  let baseDate = now.clone();
  if (_targetDate && typeof _targetDate === 'string' && _targetDate.trim() !== '') {
    const parsedTarget = moment(_targetDate, [
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'MMMM DD, YYYY',
      'MMMM D, YYYY',
      'YYYY-MM-DD HH:mm:ss',
      moment.ISO_8601,
    ]);
    if (parsedTarget.isValid()) {
      baseDate = parsedTarget;
    }
  }

  // If viewing a future date, slots cannot be late yet
  if (baseDate.isAfter(now, 'day')) {
    return {
      isLate: false,
      delayMinutes: 0,
      statusLabel: 'Upcoming Window',
      badgeColor: '#3B82F6',
      isWithinWindow: false,
    };
  }

  // Construct start and end moments for the active shift day
  const endMoment = baseDate.clone().hour(parsedEnd.hour()).minute(parsedEnd.minute()).second(0).millisecond(0);

  let startMoment = endMoment.clone().subtract(1, 'hour');
  if (startTimeStr && startTimeStr !== '0' && startTimeStr.trim() !== '') {
    const parsedStart = moment(startTimeStr, ['HH:mm', 'HH:mm:ss', 'hh:mm A', 'H:m']);
    if (parsedStart.isValid()) {
      startMoment = baseDate.clone().hour(parsedStart.hour()).minute(parsedStart.minute()).second(0).millisecond(0);
    }
  }

  const threshold = Math.max(0, Number(lateThresholdMinutes) || 0);

  // Case 1: Current time is AFTER the slot's end time
  if (now.isAfter(endMoment)) {
    const diffMinutes = Math.max(1, now.diff(endMoment, 'minutes'));

    // If beyond the allowed threshold/grace period -> LATE!
    // Delay is strictly calculated from the scheduled End time (diffMinutes)
    if (diffMinutes > threshold) {
      const formatted = formatLateDuration(diffMinutes);
      return {
        isLate: true,
        delayMinutes: diffMinutes,
        statusLabel: `Late by ${formatted}`,
        badgeColor: '#EF4444',
        isWithinWindow: false,
      };
    }

    // Within the allowed threshold / grace period -> On Time
    return {
      isLate: false,
      delayMinutes: 0,
      statusLabel: threshold > 0 ? `On Time (Within ${threshold}m Threshold)` : 'On Time',
      badgeColor: '#10B981',
      isWithinWindow: true,
    };
  }

  // Case 2: Current time is BEFORE the slot's start time -> Upcoming window
  if (now.isBefore(startMoment)) {
    return {
      isLate: false,
      delayMinutes: 0,
      statusLabel: 'Upcoming Window',
      badgeColor: '#3B82F6',
      isWithinWindow: false,
    };
  }

  // Case 3: Current time is between start_time and end_time -> ACTIVE & ON TIME!
  return {
    isLate: false,
    delayMinutes: 0,
    statusLabel: 'On Time',
    badgeColor: '#10B981',
    isWithinWindow: true,
  };
};
