import {Image, StyleSheet, Text, View} from 'react-native';
import colors from '../../themes/colors';
import {navigate} from '../../navigators';
import {useEffect} from 'react';
import {useAppSelector} from '../../store';
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
      <Image
        source={require('../../assets/images/THCHomeScreen.jpeg')}
        resizeMode="contain"
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
