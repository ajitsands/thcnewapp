import {Image, StatusBar, StyleSheet, Text, View} from 'react-native';
import colors from '../../themes/colors';
import {navigate} from '../../navigators';
import {useEffect} from 'react';
import {useAppSelector} from '../../store';
import {screenHeight, screenWidth} from '../../utils/helper';
export const SplashScreen = ({navigation}: any) => {
  const {userLoggedIn} = useAppSelector(state => state.app);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userLoggedIn) {
        navigation.replace('HomeScreen');
      } else {
        navigation.replace('LoginScreen');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [userLoggedIn, navigation]);
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Image
        source={require('../../assets/images/SplashScreen.jpg')}
        resizeMode="cover"
        style={{
          width: screenWidth,
          height: screenHeight,
        }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
