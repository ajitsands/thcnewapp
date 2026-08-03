import {
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
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
  const {apiKey, employeeCode, empName} = useAppSelector(state => state.app);
  const profileData = useAppSelector(state => state.profile?.data?.data?.[0]);
  const userName = empName || profileData?.emp_name || profileData?.employee_name || '';

  const {data, status, error, loading} = useAppSelector(
    state => state.customerCare,
  );

  useEffect(() => {
    if (!userName && apiKey && employeeCode) {
      dispatch(
        getProfileDetails({
          action: 'view_profile_details',
          emp_code: employeeCode,
          APIKEY: apiKey,
        }),
      );
    }
  }, [userName, apiKey, employeeCode]);

  const handleCallPress = async () => {
    try {
      const phoneNumber = data?.data[0]?.thc_cust_care_no;
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url);
    } catch (error) {
      console.log('Error launching phone dialer');
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
        break;

      default:
        null;
    }
  };

  return (
    <View style={styles.container}>
      <Header isHome />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner / Hero Section */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroGreeting}>
              Welcome Back{userName ? `, ${userName}` : ''} 👋
            </Text>
            <Text style={styles.heroSubtext}>THC Facility Management Dashboard</Text>
          </View>
        </View>

        {/* Section Header */}
        <Text style={styles.sectionTitle}>Quick Services</Text>

        {/* Grid Cards */}
        <View style={styles.gridContainer}>
          {items.map((item, index) => {
            const isCustomerCare = item.title === 'CUSTOMER CARE';
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={[
                  styles.serviceCard,
                  isCustomerCare && styles.customerCareCard,
                ]}
                onPress={() => handleItemPress(item)}>
                <View
                  style={[
                    styles.iconCircle,
                    isCustomerCare && styles.customerCareIconCircle,
                  ]}>
                  <Image
                    source={item.icon}
                    tintColor={isCustomerCare ? colors.white : colors.primary}
                    style={styles.cardIcon}
                  />
                </View>
                <Text
                  style={[
                    styles.cardTitle,
                    isCustomerCare && styles.customerCareTitle,
                  ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  heroGreeting: {
    fontSize: scaleFont(20),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 12,
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: colors.white,
    width: (screenWidth - 44) / 2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  customerCareCard: {
    width: screenWidth - 32,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    height: 70,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  customerCareIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 0,
    marginRight: 14,
  },
  cardIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
    textAlign: 'center',
  },
  customerCareTitle: {
    color: colors.white,
    fontSize: scaleFont(14),
  },
  itemContainer: {
    backgroundColor: colors.primary,
  },
  title: {
    fontFamily: FontFamily.medium,
  },
});
