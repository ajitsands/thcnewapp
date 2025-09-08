import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {FontFamily} from '../../themes/fonts';
import {navigate} from '../../navigators';
import {useAppDispatch, useAppSelector} from '../../store';
import LoadingOverlay from '../../core/components/loadingOverlay';


import {getTeamDetails} from '../../store/reducers/getTeam';
import {useEffect, useState} from 'react';
import {ImageView} from '../../core/components/imageView';
import {useToast} from 'react-native-toast-notifications';
import MaterialIcon from '@react-native-vector-icons/material-icons';
import {scaleFont} from '../../utils/helper';
interface WorkDetailProps {
  route: any;
}

export const WorkDetails = (props: WorkDetailProps) => {
  const {route} = props;
  const {date} = route.params;
  const [showImageView, setShowImageView] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const {data, loading, error, status} = useAppSelector(state => state.tickets);
  const {employeeCode, apiKey} = useAppSelector(state => state.app);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const ticketDetails = data?.data[0];
  const [image1Error, setImage1Error] = useState(false);
  const [image2Error, setImage2Error] = useState(false);

  const jobDetailSection = [
    {title: 'CATEGORY', value: ticketDetails?.category_name},
    {title: 'TYPE', value: ticketDetails?.type_name},
    {
      title: 'CUSTOMER',
      value: `${ticketDetails?.customer_name}[${ticketDetails?.customer_code}]`,
    },
    {title: 'CUSTOMER NO', value: ticketDetails?.customer_contact_no},
    {title: 'LOCATION', value: ticketDetails?.location_name},
    {title: 'BUILDING', value: ticketDetails?.building_name},
    {title: 'INFO', value: ticketDetails?.additional_info},
    {title: 'ASSET CODE', value: ticketDetails?.asset_code},
    {title: 'J CATEGORY', value: ticketDetails?.job_category},
    {title: 'REQUEST', value: ticketDetails?.service_request},
    {title: 'DESCRIPTION', value: ticketDetails?.complaints_description},
  ];

  useEffect(() => {
    if (error) {
      toast.show(error);
    }
  }, [error]);
  const handleTeamDetails = () => {
    dispatch(
      getTeamDetails({
        action: 'get_team_of_visit',
        APIKEY: apiKey,
        visit_date: date,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        amc_tkt_id: ticketDetails?.ticket_id,
      }),
    );
  };
  return (
    <View style={styles.container}>
      <Header isHome={false} />

      <LoadingOverlay visible={loading} />

      <View style={styles.detailContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Work Order No:{ticketDetails?.ticket_ref_code}
          </Text>
        </View>
        <View style={{backgroundColor: colors.primary,position: 'relative' }}>
          <ImageBackground
            style={[styles.flag,{ position: 'absolute', top: -20,  }]}
            source={require('../../assets/images/3.0x/thoranam.png')}
            tintColor={
              ticketDetails?.ticket_priority == 'Emergency'
                ? colors.eRed
                : colors.blue
            }>
            <Text style={styles.flagText}>
              {ticketDetails?.ticket_priority == 'Emergency' ? 'E' : 'N'}
            </Text>
          </ImageBackground>
        </View>

        <View style={styles.details}>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={() => {
                setShowImageView(true);
                setImageUrl(ticketDetails?.ticket_image);
              }}>
              <View
                style={
                  image1Error ? styles.errorCircle : styles.sliceContainer
                }>
                {image1Error ? (
                  <MaterialIcon name="error" size={30} color={colors.black} />
                ) : (
                  <Image
                    source={{uri: ticketDetails?.ticket_image}}
                    style={styles.fullCircle}
                    resizeMode="cover"
                    onError={() => setImage1Error(true)}
                  />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowImageView(true);
                setImageUrl(ticketDetails?.second_ticket_image);
              }}>
              <View
                style={
                  image2Error ? styles.errorCircle : styles.sliceContainer
                }>
                {image2Error ? (
                  <MaterialIcon name="error" size={30} color={colors.black} />
                ) : (
                  <Image
                    source={{uri: ticketDetails?.second_ticket_image}}
                    style={styles.fullCircle}
                    resizeMode="cover"
                    onError={() => setImage2Error(true)}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {jobDetailSection.map((item, key) => (
            <View
              style={{flexDirection: 'row', alignItems: 'center'}}
              key={item.title}>
              <Text style={[styles.detailText]}>{item.title}</Text>
              <Text
                style={[
                  styles.detailText,
                  {width: '50%'},
                ]}>{`: ${item.value}`}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.goButton}
            onPress={() => handleTeamDetails()}>
            <Text style={styles.goButtonText}>GO</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showImageView && (
        <ImageView
          visible={showImageView}
          toggle={() => setShowImageView(false)}
          imageUrl={imageUrl}
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
  detailContainer: {
    margin: 15,
    overflow: 'visible',
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
  details: {
    paddingTop: 20,
    padding: 15,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
  
  },
  detailText: {
    fontFamily: FontFamily.deupRegular,
    color: colors.white,
    fontSize: scaleFont(18),
    width: '35%',
  },
  headerText: {
    color: colors.white,
    fontFamily: FontFamily.deupRegular,
    fontSize: scaleFont(16),
    marginLeft: 10,
  },
  flagText: {
    color: colors.white,
    fontSize: scaleFont(24),
    fontFamily: FontFamily.bold,
    top: 8,
    left: 12,
  },
  flag: {
    height: 60,
    width: 35,
    alignSelf: 'flex-end',
    marginTop: -20, // Pushes it upward to "flow down" over the header
    marginRight: 10,
    zIndex: 10,
  },
  goButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.red,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomRightRadius: 10,
    // Android shadow
  },

  goButtonText: {
    color: colors.white,
    fontFamily: FontFamily.duepBold,
    fontSize: scaleFont(16),
  },
  images: {
    width: 100, // adjust as needed
    height: 60, // adjust as needed
    backgroundColor: '#3498db',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginVertical: 15,
  },
  imageContainer: {
    alignSelf: 'flex-end',
    position: 'absolute',
    right:10,
    paddingTop:20
  },
  sliceContainer: {
    width: 60, // Diameter of the circle
    height: 40, // Height of the visible slice
    overflow: 'hidden', // Clips the top and bottom
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
   
  },
  fullCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
 
  },
  errorCircle: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 5,
  },
});
