import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import colors from '../../themes/colors';
import {FontFamily} from '../../themes/fonts';
import {navigate} from '../../navigators';
import {scaleFont} from '../../utils/helper';
interface HeaderProps {
  title: string;
  isAssetDetails?: boolean;
  Styles?: any;
}
export const HeaderBar = (props: HeaderProps) => {
  const {title, isAssetDetails, Styles} = props;

  return (
    <View
      style={[
        styles.container,
        {justifyContent: isAssetDetails ? 'center' : 'flex-start'},
      ]}>
      <Text
        style={[
          styles.title,
          Styles,
          {textAlign: isAssetDetails ? 'center' : 'left'},
        ]}>
        {title}
      </Text>
      {title == 'SERVICE DETAILS/JOB CARD' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('RequisitionScreen')}>
          <Text style={[styles.title, {fontSize: scaleFont(16)}]}>
            REQUISITION
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    margin: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: 45,
    //  justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    margin: 10,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(14),
  },
  button: {
    backgroundColor: colors.red,
    marginVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
});
