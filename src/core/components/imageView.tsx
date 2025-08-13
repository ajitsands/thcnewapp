import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont, screenHeight} from '../../utils/helper';
import {FontFamily} from '../../themes/fonts';
import {Header} from './header';
interface ModalProps {
  visible: boolean;
  toggle: () => void;
  imageUrl: string;
}
export const ImageView = (props: ModalProps) => {
  const {visible, toggle, imageUrl} = props;
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={() => toggle()}
      useNativeDriver={true}
      style={styles.modal}>
      <Header onPress={() => toggle()} />
      <View style={styles.modalContainer}>
        <ScrollView
          style={styles.scrollView}
          maximumZoomScale={5}
          minimumZoomScale={1}
          contentContainerStyle={{flexGrow: 1}}
          centerContent={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <Image
            source={{uri: imageUrl}}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </ScrollView>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modal: {
    // justifyContent: 'center',
    margin: 0,
    //  backgroundColor:'transparent'

    // marginBottom: 30,
  },

  header: {
    backgroundColor: colors.primary,
    height: 45,
    borderRadius: 10,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  details: {
    fontFamily: FontFamily.deupRegular,
    fontSize: scaleFont(16),
    color: colors.black,
  },
  images: {
    height: 50,
    width: 60,
    resizeMode: 'contain',
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
});
