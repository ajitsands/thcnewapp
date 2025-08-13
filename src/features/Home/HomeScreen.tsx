import {
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {scaleFont, screenWidth} from '../../utils/helper';
import {FontFamily} from '../../themes/fonts';
import {navigate} from '../../navigators';
import {useAppDispatch, useAppSelector} from '../../store';
import {getScheduleDates} from '../../store/reducers/getSchedules';
import {getWorkHistory} from '../../store/reducers/workHistoryReducer';
import {getProfileDetails} from '../../store/reducers/profileReducer';
import {getCustomerCareContact} from '../../store/reducers/customerCare';
import {useEffect} from 'react';
import {useToast} from 'react-native-toast-notifications';
import {getRequisitionHistory} from '../../store/reducers/requisitionReducers/requistionHistory';

export const HomeScreen = () => {
  const items = [
    {
      icon: require('../../assets/images/bar_code.png'),
      title: 'SCAN',
      route: 'Scanner',
    },
    {
      icon: require('../../assets/images/schedule.png'),
      title: 'SCHEDULE',
      route: 'ScheduleCalendar',
    },
    {
      icon: require('../../assets/images/history.png'),
      title: 'HISTORY',
      route: 'History',
    },
    {
      icon: require('../../assets/images/requisition.png'),
      title: 'REQUISITION',
      route: 'RequisitionHistory',
    },
    {
      icon: require('../../assets/images/profile.png'),
      title: 'PROFILE',
      route: 'ProfileScreen',
    },
    {
      icon: require('../../assets/images/customer_care.png'),
      title: 'CUSTOMER CARE',
      route: '',
    },
  ];
  const dispatch = useAppDispatch();
  const toast = useToast();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {data, status, error, loading} = useAppSelector(
    state => state.customerCare,
  );
  const handleCallPress = async () => {
    try {
      const phoneNumber = data?.data[0]?.thc_cust_care_no;
      const url = `tel:${phoneNumber}`;
      // const supported = await Linking.canOpenURL(url);
      // console.log(supported);
      // if (!supported) {
      Linking.openURL(url);
      // }
    } catch (error) {
      console.log('hjjj');
    }
  };

  useEffect(() => {
    if (status == 'success') {
      handleCallPress();
    } else if (status == 'failed') {
      toast.show(error);
    }
  }, [status]);
  const handleItemPress = async (item: any) => {
    switch (item.route) {
      case 'Scanner':
        navigate(item.route);
        break;
      case 'ScheduleCalendar':
        dispatch(
          getScheduleDates({
            action: 'get_schedule_dates',
            APIKEY: apiKey,
            emp_code: employeeCode,
          }),
        );
        navigate(item.route);
        break;
      case 'History':
        dispatch(
          getWorkHistory({
            action: 'view_job_history',
            APIKEY: apiKey,
            emp_code: employeeCode,
          }),
        );
        navigate(item.route);
        break;
      case 'RequisitionHistory':
        dispatch(
          getRequisitionHistory({
            action: 'view_requisition_history',
            APIKEY: apiKey,
            emp_code: employeeCode,
          }),
        );
        navigate(item.route);
        break;
      case 'ProfileScreen':
        dispatch(
          getProfileDetails({
            action: 'view_profile_details',
            emp_code: employeeCode,
            APIKEY: apiKey,
          }),
        );
        navigate(item.route);
        break;
      case '':
        dispatch(
          getCustomerCareContact({
            action: 'get_customer_care_no',
            emp_code: employeeCode,
            APIKEY: apiKey,
          }),
        );
        // handleCallPress();
        break;

      default:
        null;
    }
  };
  const renderListItem = ({item}: any) => {
    console.log(item);
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleItemPress(item)}>
        <Image
          source={item.icon}
          tintColor={colors.white}
          style={{height: 60, resizeMode: 'contain'}}
        />
        <Text style={styles.title}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header isHome />

      <FlatList
        numColumns={2}
        data={items}
        renderItem={renderListItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  itemContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 160,
    width: screenWidth / 2 - 25,
    padding: 20,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: scaleFont(20),
    fontFamily: FontFamily.variation,
    marginTop: 5,
  },
});
