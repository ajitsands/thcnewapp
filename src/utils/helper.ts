
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

// export const appVersion = getVersion();

