import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont, screenHeight} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
import {useState} from 'react';
import {ImageView} from '../../../core/components/imageView';
interface ModalProps {
  visible: boolean;
  toggle: () => void;
  details: any;
}
export const CustomerModal = (props: ModalProps) => {
  const {visible, toggle, details} = props;
  const [showImageView, setShowImageView] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const jobDetailSection = [
    {
      title: 'Customer Name',
      value: `${details?.customer_name}`,
    },
    {title: 'Location', value: details?.location_name},
    {title: 'Building', value: details?.building_name},
    {title: 'Contact No', value: details?.customer_contact_no},

    {title: 'Complaint Description', value: details?.complaints_description},
  ];

  return (
    <>
      <Modal
        isVisible={visible}
        useNativeDriver={true}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onBackdropPress={() => toggle()}
        backdropOpacity={0.6}>
        <View style={styles.modalContent}>
          {jobDetailSection?.map((item, index) => (
            <Text
              style={styles.details}
              key={index}>{`${item.title} : ${item.value}`}</Text>
          ))}
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={() => {
                setShowImageView(true);
                setImageUrl(details?.ticket_image);
              }}>
              <Image
                source={{uri: details?.ticket_image}}
                style={styles.images}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowImageView(true);
                setImageUrl(details?.second_ticket_image);
              }}>
              <Image
                source={{uri: details?.second_ticket_image}}
                style={styles.images}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showImageView && (
        <ImageView
          visible={showImageView}
          toggle={() => setShowImageView(false)}
          imageUrl={imageUrl}
        />
      )}
    </>
  );
};
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 40,
    marginBottom: 30,
  },
  modalContent: {
    backgroundColor: colors.white,
    // height: screenHeight * 0.3,
    borderRadius: 5,
    padding: 20,
    marginBottom: 30,
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: scaleFont(30),
  },
});
