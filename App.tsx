import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
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
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from './src/themes/fonts';
import {scaleFont} from './src/utils/helper';

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
        animationType="slide-in"
        renderToast={(toastOptions) => {
          const type = toastOptions.type || 'normal';
          let iconName = 'info';
          let iconColor = colors.secondary;

          if (type === 'success' || toastOptions.message?.toString().toLowerCase().includes('success')) {
            iconName = 'check-circle';
            iconColor = '#4ADE80';
          } else if (type === 'danger' || toastOptions.message?.toString().toLowerCase().includes('fail') || toastOptions.message?.toString().toLowerCase().includes('error')) {
            iconName = 'error';
            iconColor = '#F87171';
          }

          return (
            <View style={styles.toastContainer}>
              <MaterialIcons name={iconName} size={20} color={iconColor} style={styles.toastIcon} />
              <Text style={styles.toastText} numberOfLines={2}>
                {toastOptions.message}
              </Text>
            </View>
          );
        }}>
        <Provider store={store}>
          <PersistGate
            loading={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.white,
                }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            }
            persistor={persistor}>
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

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginHorizontal: 20,
    maxWidth: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastIcon: {
    marginRight: 10,
  },
  toastText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(13),
    flexShrink: 1,
  },
});
