import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {navigationRef} from '../navigators/navRef';
import {createStackNavigator} from '@react-navigation/stack';

import {SplashScreen} from '../features/Splash/splashScreen';
import {HomeScreen} from '../features/Home/HomeScreen';
import {ProfileTabs} from '../features/Profile/components/profileTab';
import {ProfileScreen} from '../features/Profile/screens/profileScreen';
import {ScheduleCalendar} from '../features/schedule/screens/scheduleCalendar';
import {HistoryScreen} from '../features/History/screens/History';
import {RequisitionHistory} from '../features/Requisition/screens/RequisitionHistory';
import {ScheduleSlots} from '../features/schedule/screens/scheduleSlots';
import LoginScreen from '../features/authentication/login';
import QRScannerScreen from '../features/scanner/screens/scannerScreen';
import {AssetDetails} from '../features/scanner/screens/assetDetails';
import {WorkDetails} from '../features/jobDetails/jobDetails';
import {TeamDetails} from '../features/team/teamDetails';
import {ServiceDetails} from '../features/jobDetails/serviceDetails';
import {RequisitionView} from '../features/Requisition/screens/requisitionScreen';
import {JanitorDashboard} from '../features/janitor/JanitorDashboard';
import {JanitorQRScannerScreen} from '../features/scanner/screens/JanitorQRScannerScreen';
import {JanitorChecklistScreen} from '../features/checklist/JanitorChecklistScreen';
import {NoInternetOverlay} from '../core/components/NoInternetOverlay';

const Navigation = () => {
  const Stack = createStackNavigator();
  return (
    <NavigationContainer ref={navigationRef}>
      <NoInternetOverlay />
      <Stack.Navigator>
        <Stack.Screen
          component={SplashScreen}
          name={'SplashScreen'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={LoginScreen}
          name={'LoginScreen'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={HomeScreen}
          name={'HomeScreen'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={JanitorDashboard}
          name={'JanitorDashboard'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={AssetDetails}
          name={'AssetDetails'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={QRScannerScreen}
          name={'Scanner'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={ProfileScreen}
          name={'ProfileScreen'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={ScheduleCalendar}
          name={'ScheduleCalendar'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={ScheduleSlots}
          name={'ScheduleSlots'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={WorkDetails}
          name={'WorkDetails'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={HistoryScreen}
          name={'History'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={RequisitionHistory}
          name={'RequisitionHistory'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={TeamDetails}
          name={'TeamDetails'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={ServiceDetails}
          name={'ServiceDetails'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={RequisitionView}
          name={'RequisitionScreen'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={JanitorQRScannerScreen}
          name={'JanitorQRScanner'}
          options={{headerShown: false}}
        />
        <Stack.Screen
          component={JanitorChecklistScreen}
          name={'JanitorChecklist'}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default Navigation;
