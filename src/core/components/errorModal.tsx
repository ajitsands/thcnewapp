import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import colors from '../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont, screenHeight} from '../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../themes/fonts';
interface ModalProps {
  visible: boolean;
  toggle: () => void;
  errorText: string;
}
export const ErrorModal = (props: ModalProps) => {
  const {visible, toggle, errorText} = props;
  console.log('eeeeeee', errorText);
  return (
    <Modal
      isVisible={visible}
      useNativeDriver={true}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onBackdropPress={() => toggle()}
      backdropOpacity={0.6}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <View style={styles.headingContainer}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <MaterialIcons name="message" color={colors.white} size={20} />
              <Text style={styles.assetText}>MESSAGE</Text>
            </View>
            <TouchableOpacity style={styles.cancel} onPress={() => toggle()}>
              <MaterialIcons
                name="close"
                color={colors.white}
                size={15}
                // style={{top: -6}}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.icon}>
            <MaterialIcons name="check" color={colors.white} size={35} />
          </View>

          <Text style={styles.error}>{errorText}</Text>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 10,
    marginBottom: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    height: screenHeight * 0.2,
    borderRadius: Platform.OS == 'ios' ? 30 : 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  infoButton: {
    marginHorizontal: 20,
    backgroundColor: '#33485E',
    borderWidth: 3,
    borderColor: '#959595',
    borderRadius: 12,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
  },
  assetButton: {
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: '#959595',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 20,
    color: colors.primary,
    fontSize: scaleFont(18),
    padding: 5,
    // marginHorizontal:20,
    margin: 10,
    fontFamily: FontFamily.deupRegular,
    textAlign: 'center',
  },
  cancel: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetText: {
    color: colors.white,
    fontFamily: FontFamily.medium,
    fontSize: scaleFont(16),
    marginLeft: 10,
  },
  header: {
    backgroundColor: colors.primary,
    height: 45,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'center',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue,
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(16),
    color: colors.primary,
  },
});
