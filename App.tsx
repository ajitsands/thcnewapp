import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Navigation from './src/navigators/navigation';
import colors from './src/themes/colors';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import store, {persistor} from './src/store';
import {ToastProvider} from 'react-native-toast-notifications';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      {/* Blue background behind the status bar */}
      <View
        style={{
          height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          backgroundColor: colors.primary,
        }}
      />
      <StatusBar
        translucent
        backgroundColor={colors.transparent}
        barStyle="light-content"
      />
      <ToastProvider
        placement="bottom"
        offset={50}
        duration={3000}
        animationType="slide-in">
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <GestureHandlerRootView
              style={{flex: 1, backgroundColor: colors.black}}>
              <Navigation />
            </GestureHandlerRootView>
          </PersistGate>
        </Provider>
      </ToastProvider>
    </SafeAreaView>
  );
}

export default App;
