import {
  Image,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import colors from '../../../themes/colors';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {FontFamily} from '../../../themes/fonts';
import {useEffect, useRef, useState} from 'react';
import {scaleFont, screenHeight, screenWidth} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getAssetDetails,
  resetError,
} from '../../../store/reducers/assetReducers/getAssetDetails';
import {Loader} from '../../../core/components/loader';
import {useToast} from 'react-native-toast-notifications';
import {navigate} from '../../../navigators';
import {navigationRef} from '../../../navigators/navRef';
import {ImageView} from '../../../core/components/imageView';
import {AssetServices} from './assetServices';
import LoadingOverlay from '../../../core/components/loadingOverlay';
interface AssetProps {
  route: any;
}

export const AssetDetails = (props: AssetProps) => {
  const {route} = props;
  const assetCode = route?.params?.assetCode;
  console.log(assetCode);
  const [pageNumber, setPageNumber] = useState(0);
  const [serviceImage, setServiceImage] = useState('');
  const {assets, assetsLoading, assetsError, assetsStatus} = useAppSelector(
    state => state.assetDetails,
  );
  const {
    assetServicesImages,
    assetServiceImagesError,
    assetServiceImagesStatus,
  } = useAppSelector(state => state.assetDetails);
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const assetDetails = assets?.data[0];
  const [showImageModal, setShowImageModal] = useState(false);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const translateX = useRef(new Animated.Value(0)).current;

  const AssetItem = ({title, value}: any) => (
    <View style={styles.assetItem}>
      <Text style={styles.assetTitle}>{title}</Text>
      <View style={styles.textBox}>
        <Text style={styles.assetValue}>{value}</Text>
      </View>
    </View>
  );

  useEffect(() => {
    dispatch(
      getAssetDetails({
        action: 'get_asset_basic_details',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: assetCode.trim(),
      }),
    );
  }, []);
  useEffect(() => {
    if (assetsStatus == 'failed' && assetsError) {
      navigationRef.goBack();
      toast.show(assetsError);
      dispatch(resetError());
    }
  }, [assetsStatus]);

  const handleSlide = (newPage: number) => {
    if (newPage < 0 || newPage > 1) return; // prevent overflow
    Animated.timing(translateX, {
      toValue: -screenWidth * newPage,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setPageNumber(newPage);
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <View style={{marginVertical: 20, flex: 1}}>
        <HeaderBar title="ASSET DETAILS" isAssetDetails={true} />
        <View style={[styles.historyList, {flex: pageNumber == 0 ? 1 : 0}]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => handleSlide(pageNumber - 1)}>
              <Image
                source={require('../../../assets/images/arrow.png')}
                style={styles.arrow}
              />
            </TouchableOpacity>

            <Text style={styles.title}>{`ASSET NO:${assetCode}`}</Text>
            <TouchableOpacity onPress={() => handleSlide(pageNumber + 1)}>
              <Image
                source={require('../../../assets/images/arrow.png')}
                style={[styles.arrow, {transform: [{rotate: '180deg'}]}]}
              />
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[
              styles.slider,
              {
                transform: [{translateX}],
              },
            ]}>
            {/* {assetsLoading ? (
              <Loader />
            ) : ( */}
            <View style={{flex: 1, margin: 5, marginTop: 10}}>
              <View style={styles.row}>
                <AssetItem
                  title="CUSTOMER NAME"
                  value={assetDetails?.customer_name}
                />
                <AssetItem title="CODE" value={assetDetails?.customer_code} />
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="LOCATION"
                  value={assetDetails?.asset_location}
                />
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="BUILDING"
                  value={assetDetails?.asset_building}
                />
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="ZONE/FLOOR NO"
                  value={assetDetails?.zone_floor}
                />
                <LoadingOverlay visible={assetsLoading} />
                <AssetItem
                  title="FLAT NO/AREA CODE"
                  value={assetDetails?.flat_area_code}
                />
                <AssetItem title="ROOM NUMBER" value={assetDetails?.room_no} />
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="CATEGORY"
                  value={assetDetails?.asset_category_name}
                />
                <AssetItem title="TYPE" value={assetDetails?.asset_type_name} />
                {/* Add more fields if needed */}
              </View>
              <View style={styles.row}>
                <AssetItem title="BRAND" value={assetDetails?.asset_brand} />
                <AssetItem
                  title="MODEL NO"
                  value={assetDetails?.asset_serial_no}
                />
                {/* Add more fields if needed */}
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="WARRANTY/GUARANTEE"
                  value={assetDetails?.is_warentee}
                />
                <AssetItem
                  title="DATE UPTO"
                  value={assetDetails?.warentee_end_date}
                />
                <AssetItem
                  title="CAPACITY"
                  value={assetDetails?.asset_capacity}
                />
                {/* Add more fields if needed */}
              </View>
              <View style={styles.row}>
                <AssetItem
                  title="DESCRIPTION"
                  value={assetDetails?.asset_description}
                />
                <View style={styles.imageContainer}>
                  <TouchableOpacity
                    style={styles.sliceContainer}
                    onPress={() => setShowImageModal(true)}>
                    <Image
                      style={styles.fullCircle}
                      source={{uri: assetDetails?.asset_attachment}}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* )} */}
            {/* </View> */}
            <View style={styles.page}>
              {pageNumber == 1 && <AssetServices code={assetCode} />}
            </View>
          </Animated.View>
        </View>
        {pageNumber == 1 && assetServiceImagesStatus == 'success' && (
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            {assetServicesImages?.data?.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setShowImageModal(true);
                  setServiceImage(item.service_image_name);
                }}>
                <Image
                  source={{uri: item.service_image_name}}
                  style={styles.images}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {showImageModal && (
        <ImageView
          visible={showImageModal}
          imageUrl={
            pageNumber == 0 ? assetDetails?.asset_attachment : serviceImage
          }
          toggle={() => setShowImageModal(false)}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  historyList: {
    marginHorizontal: 10,
      flex: 1,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
    marginBottom: 20,
  },
  header: {
    backgroundColor: colors.yellow,
    height: 40,
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderWidth:1,
    borderColor: colors.primary,
    borderTopLeftRadius: 10,
  },
  title: {
    fontFamily: FontFamily.duepBold,
    color: colors.primary,
    fontSize: scaleFont(16),
  },
  arrow: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  pageContainer: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    // gap: 10,
    //  marginBottom: 8,
  },
  assetItem: {
    flex: 1,
    marginBottom: 8,
    marginHorizontal: 5,
  },
  assetTitle: {
    color: colors.white,
    // marginBottom:5,
    fontFamily: FontFamily.variation,
    fontSize: scaleFont(12),
    width: '100%',
  },
  assetValue: {
    color: colors.white,
    fontFamily: FontFamily.medium,
    fontSize: scaleFont(14),
    marginLeft: 5,
  },
  textBox: {
    padding:5,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.white,
    justifyContent: 'center',
  },
  imageContainer: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slicedImage: {
    width: 70, // Diameter of the circle
    height: 50,
    borderRadius: 35, // Height of the visible slice
  },
  sliceContainer: {
    width: 70, // Diameter of the circle
    height: 40, // Height of the visible slice
    overflow: 'hidden', // Clips the top and bottom
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  fullCircle: {
    width: 70,
    height: 70,
    borderRadius: 35, // Perfect circle
  },
  slider: {
    flexDirection: 'row',
    width: screenWidth * 2,
  },
  page: {
    width: screenWidth,
    height: '100%',
    marginHorizontal: 10,
  },
  images: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginHorizontal: 2,
  },
});
