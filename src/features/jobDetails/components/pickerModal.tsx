import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import colors from '../../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont, screenHeight} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
interface ModalProps {
  visible: boolean;
  toggle: () => void;
  useCamera: () => void;
  useGallery: () => void;
}
export const PickerModal = (props: ModalProps) => {
  const {visible, toggle, useCamera, useGallery} = props;

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
        <TouchableOpacity style={styles.button} onPress={useCamera}>
          <MaterialIcons name="camera-alt" size={25} />
          <Text style={styles.error}>Use Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={useGallery}>
          <MaterialIcons name="photo" size={25} />
          <Text style={styles.error}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
    marginBottom: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    height: screenHeight * 0.15,
    justifyContent: 'center',
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: scaleFont(16),
    color: colors.black,
    marginLeft: 10,
  },
  button: {
    flexDirection: 'row',
    margin: 20,
    alignItems: 'center',
  },
});
