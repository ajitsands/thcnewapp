import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {scaleFont, screenWidth} from '../../utils/helper';
import colors from '../../themes/colors';
import {FontFamily} from '../../themes/fonts';
import {
  navReplace,
  navReset,
  navigate,
  navigationRef,
} from '../../navigators/navRef';
import SvgArrowLeft from '../../assets/svg/leftArrow.svg';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useAppDispatch} from '../../store';
import {logout} from '../../store/reducers/appReducer';
import {useState} from 'react';
import {ConfirmModal} from './confirmModal';
interface HeaderProps {
  isProfile?: boolean;
  isHome?: boolean;
  isService?: boolean;
  onPress?: () => void;
}

export const Header = (props: HeaderProps) => {
  const {isProfile, isHome, onPress, isService} = props;
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();
  const handleLogout = () => {
    setShowModal(false);
    dispatch(logout());
    navigate('SplashScreen');
  };
  return (
    <View style={[styles.container, {width: '100%'}]}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          !isHome && (onPress ? onPress() : navigationRef.goBack());
        }}
        activeOpacity={1}>
        {!isHome && (
          <MaterialIcons name="arrow-back" size={20} color={colors.white} style={{marginLeft: 10}} />
        )}
        {isProfile && (
          <Image
            source={require('../../assets/images/3.0x/mini.png')}
            style={styles.icon}
          />
        )}
        <Text style={[styles.title, {marginLeft: !isProfile ? 10 : 0}]}>
          THC FACILITY MANAGEMENT
        </Text>
      </TouchableOpacity>
      {isProfile && (
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <MaterialIcons
            name="login"
            size={20}
            color={colors.white}
            style={{marginHorizontal: 10}}
          />
        </TouchableOpacity>
      )}
      {showModal && (
        <ConfirmModal
          visible={showModal}
          toggle={() => setShowModal(false)}
          errorText="Are you sure you want to logout?"
          onConfirm={handleLogout}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    height: 60,

    backgroundColor: colors.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(16),
  },
  arrowIcon: {
    height: 15,
    width: 15,
    resizeMode: 'contain',
    tintColor: colors.white,
    marginLeft: 10,
  },
  icon: {
    height: 25,
    width: 25,
    resizeMode: 'contain',
    tintColor: colors.red,
    marginLeft: 15,
  },
});
