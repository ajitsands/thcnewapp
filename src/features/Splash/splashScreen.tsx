import {Image, StatusBar, StyleSheet, Text, View} from 'react-native';
import colors from '../../themes/colors';
import {navigate} from '../../navigators';
import {useEffect} from 'react';
import {useAppSelector} from '../../store';
import {screenHeight, screenWidth} from '../../utils/helper';
export const SplashScreen = () => {
  const {userLoggedIn} = useAppSelector(state => state.app);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userLoggedIn) {
        navigate('HomeScreen');
      } else navigate('LoginScreen');
    }, 3000);
  });
  return (
    <View style={styles.container}>
       <StatusBar
        translucent
        backgroundColor="transparent" // <- transparent for splash
        barStyle="light-content"
      />
      <Image
        source={require('../../assets/images/SplashScreen.jpg')}
        resizeMode="cover" // covers entire area, keeps aspect ratio
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
