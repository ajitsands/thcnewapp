
import { Dimensions, Platform } from 'react-native';


/**
 * return if email is correct, is Valid email
 * */
export function isEmail(emailAddress: any): boolean {
  let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
  return emailAddress?.match(regex);
}
export const isValidURL = (url:any) => {
  let regex= /^(https?:\/\/)[^\s$.?#].[^\s]*$/;;
  return url?.match(regex)
};

export function validatePhoneNumber(phoneNumber: string) {
  const phoneRegex = /^[0-9]{10,15}$/; // Accepts 10 to 15 digit numbers
  return phoneRegex.test(phoneNumber);
};

export function formatTime(seconds: number){
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};
export const screenHeight: number = Dimensions.get('window').height;
export const isAndroid: boolean = Platform.OS === 'android';
export const screenWidth: number = Dimensions.get('window').width;

export const scaleFont = (size: number) => {
  const scaled = (screenWidth/ 375) * size;
  return Math.min(Math.max(scaled, 12), 20); // Min 12, Max 20
};

export const formatImageUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'N/A' ||
    trimmed === 'none' ||
    trimmed === '""' ||
    trimmed === "''"
  ) {
    return null;
  }

  // Remap legacy dev domains & insecure HTTP to current production portal HTTPS
  trimmed = trimmed
    .replace(/^https?:\/\/thc\.sianlab\.com/i, 'https://portal.thcfm.com')
    .replace(/^https?:\/\/sianlab\.com/i, 'https://portal.thcfm.com')
    .replace(/^http:\/\/portal\.thcfm\.com/i, 'https://portal.thcfm.com');

  // If local file or data URI
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If absolute URL on portal.thcfm.com without httpdocs for images or uploads
  if (trimmed.startsWith('https://portal.thcfm.com/images/')) {
    trimmed = trimmed.replace('https://portal.thcfm.com/images/', 'https://portal.thcfm.com/httpdocs/images/');
  } else if (trimmed.startsWith('https://portal.thcfm.com/uploads/')) {
    trimmed = trimmed.replace('https://portal.thcfm.com/uploads/', 'https://portal.thcfm.com/httpdocs/uploads/');
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // If relative path
  let cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  if (!cleanPath.startsWith('httpdocs/') && (cleanPath.startsWith('images/') || cleanPath.startsWith('uploads/'))) {
    cleanPath = `httpdocs/${cleanPath}`;
  }

  return `https://portal.thcfm.com/${cleanPath}`;
};

// export const appVersion = getVersion();

