import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import colors from '../../../themes/colors';
import {useEffect, useState} from 'react';
import {FontFamily} from '../../../themes/fonts';
import {Loader} from '../../../core/components/loader';
import AudioPlayerUI from '../../jobDetails/components/audioPlayer';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getAssetServiceDetails,
  getAssetServiceImages,
  resetAssetServiceError,
  resetError,
} from '../../../store/reducers/assetReducers/getAssetDetails';
import {useToast} from 'react-native-toast-notifications';
import {scaleFont} from '../../../utils/helper';
interface serviceProps {
  code: string;
}
export const AssetServices = (props: serviceProps) => {
  const {code} = props;
  const [selectedService, setSelectedService] = useState();
  const [selectedServiceIndex, setSelectedServiceIndex] = useState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {
    assetServiceStatus,
    assetServiceError,
    assetServices,
    assetServiceLoading,
    assetServicesImages,
  } = useAppSelector(state => state.assetDetails);
  const serviceDetails = assetServices?.data;
  useEffect(() => {
    dispatch(
      getAssetServiceDetails({
        action: 'get_asset_service_details',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: code,
      }),
    );
    dispatch(
      getAssetServiceImages({
        action: 'get_asset_service_images',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: code,
      }),
    );
  }, []);
  useEffect(() => {
    if (assetServiceStatus == 'failed' && assetServiceError) {
      toast.show(assetServiceError);
      dispatch(resetAssetServiceError());
    }
  }, [assetServiceStatus]);

  return (
    <>
      <View style={styles.container}>
        {assetServiceLoading ? (
          <Loader />
        ) : assetServiceStatus === 'failed' ? null : (
          <>
            {serviceDetails?.map((service: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      selectedServiceIndex == index ? colors.red : colors.white,
                  },
                ]}
                onPress={() => {
                  setSelectedServiceIndex(index);
                  setSelectedService(service);
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 50,
                  }}>
                  <Text
                    style={[
                      styles.serviceTypes,
                      {
                        color:
                          selectedServiceIndex == index
                            ? colors.white
                            : colors.black,
                      },
                    ]}>
                    {`${index + 1} - ${service.service_description}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.headerView}>
              <Text style={[styles.headerText, {width: '30%'}]}>
                DESCRIPTION
              </Text>
              <Text style={[styles.headerText, styles.typeContainer]}>
                {/* {`TYPE-${ticketDetails?.type_name}`} */}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.white,
                marginHorizontal: 10,
                borderBottomRightRadius: 10,
                paddingBottom: 10,
              }}>
              <TextInput
                editable={false}
                style={{
                  height: 100,
                  fontFamily: FontFamily.deupRegular,
                  marginLeft: 10,
                }}
                value={selectedService?.tech_remarks}
              />
              {/* )} */}

              <AudioPlayerUI
                isAssets={true}
                track={selectedService?.tech_audio_file}
                // isLocal={serviceStatusData?.data[0] ? false : true}
              />
            </View>
          </>
        )}
      </View>
      {/* <View style={{flexDirection:'row',}}>
    {assetServicesImages?.data?.map((item,index)=>(
      <Image source={{uri:item.service_image_name}}
      style={styles.images}
      key={index}/>
    ))
}

  </View> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    //  flex: 1,
    margin: 10,
  },
  button: {
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: colors.white,
    margin: 5,
    marginHorizontal: 10,
  },
  serviceTypes: {
    color: colors.black,
    fontSize: scaleFont(18),
    fontFamily: FontFamily.deupRegular,
    marginLeft: 10,
  },
  header: {
    backgroundColor: colors.red,
    height: 40,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 5,
  },
  details: {
    paddingTop: 0,
    padding: 15,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
  },
  detailText: {
    fontFamily: FontFamily.deupRegular,
    color: colors.white,
    fontSize: scaleFont(16),
    width: '30%',
  },
  headerText: {
    color: colors.white,
    fontFamily: FontFamily.deupRegular,
    fontSize: scaleFont(16),
    marginLeft: 10,
  },
  typeContainer: {
    backgroundColor: colors.red,
    width: '60%',
    paddingVertical: 8,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    textAlign: 'center',
  },
  images: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
});
