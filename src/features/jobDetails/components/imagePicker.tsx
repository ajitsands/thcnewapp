import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  PermissionsAndroid,
  Platform,
  Alert,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import colors from '../../../themes/colors';
import {useEffect, useState} from 'react';
import {PickerModal} from './pickerModal';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  resetError,
  resetStatusMessage,
  uploadServiceImages,
} from '../../../store/reducers/serviceReducers/uploadServiceImages';
import {useToast} from 'react-native-toast-notifications';
import {getServiceImages} from '../../../store/reducers/serviceReducers/getserviceImages';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {ImageView} from '../../../core/components/imageView';
import {screenWidth} from '../../../utils/helper';

interface PickerProps {
  ticketDetails: any;
  serviceImages: any;
}
export const PickerImage = (props: PickerProps) => {
  const {ticketDetails, serviceImages} = props;
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showImageView, setImageView] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {ticketType, data} = useAppSelector(state => state.tickets);
  const {
    imagesUploadStatus,
    imagesUploadLoading,
    imagesUploadError,
    serviceUploadImages,
  } = useAppSelector(state => state.uploadServiceImages);
  const {imagesLoading} = useAppSelector(state => state.serviceImages);
  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    if (imagesUploadStatus == 'success') {
      dispatch(
        getServiceImages({
          action: 'get_service_images',
          amc_ticket: ticketType,
          amc_tkt_id: ticketDetails?.ticket_id,
          APIKEY: apiKey,
          emp_code: employeeCode,
        }),
      );
      toast.show(serviceUploadImages?.api_message);
    } else if (imagesUploadError) {
      toast.show(imagesUploadError);
    }
    dispatch(resetStatusMessage());
    dispatch(resetError());
  }, [imagesUploadStatus]);

  const pickImage = async ({isCamera}: {isCamera: boolean}) => {
    try {
      const permissionType = PermissionsAndroid.PERMISSIONS.CAMERA;

      const status =
        isCamera && (await PermissionsAndroid.request(permissionType));

      const result =
        isCamera && status
          ? await launchCamera({mediaType: 'photo', quality: 0.5})
          : await launchImageLibrary({mediaType: 'photo', quality: 0.5});

      if (result.assets && result.assets.length > 0) {
        const imagePath = result?.assets[0]?.uri;

        dispatch(
          uploadServiceImages({
            amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
            amc_ticket: ticketType,
            amc_tkt_id: ticketDetails?.ticket_id,
            asset_code: ticketDetails?.asset_code,
            action: 'upload_ticket_service_images',
            emp_code: employeeCode,
            APIKEY: apiKey,
            service_image: imagePath,
          }),
        );
        setShowPickerModal(false);
      }

      if (!status && isCamera)
        Alert.alert(
          'Permission Required',
          `THC needs access to ${
            isCamera ? 'camera' : 'photos'
          } to upload images.`,
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };
  //
  console.log('images', serviceImages);
  return (
    <View style={styles.row}>
      {[...Array(8)].map((_, index) => {
        const imageUri = serviceImages?.data[index]?.service_image_name;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (imageUri) {
                setImageUrl(imageUri);
                setImageView(true);
              } else {
                setShowPickerModal(true);
              }
            }}>
            <Image
              key={index}
              source={
                imageUri
                  ? {uri: imageUri}
                  : require('../../../assets/images/2.0x/placeholder.png')
              }
              style={[
                styles.imagePicker,
                {
                  // height: imageUri ? 50 : 40,
                  // width:imageUri?30:40
                },
                !imageUri && {
                  tintColor: index === 0 ? colors.darkGreen : colors.white,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
      {showPickerModal && (
        <PickerModal
          visible={showPickerModal}
          toggle={() => setShowPickerModal(false)}
          useCamera={() => pickImage({isCamera: true})}
          useGallery={() => pickImage({isCamera: false})}
        />
      )}
      {showImageView && (
        <ImageView
          imageUrl={imageUrl}
          visible={showImageView}
          toggle={() => setImageView(false)}
        />
      )}
      <LoadingOverlay visible={imagesLoading} />
    </View>
  );
};
const styles = StyleSheet.create({
  imagePicker: {
    width: screenWidth * 0.09, // 10% of screen width
    height: screenWidth * 0.1,
    marginTop: 5,
  },
  row: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
  },
});
