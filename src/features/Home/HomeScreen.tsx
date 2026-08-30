import React, {useEffect} from 'react';
import {
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
import {FontFamily} from '../../themes/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {navigate} from '../../navigators';
import {useAppDispatch, useAppSelector} from '../../store';
import {getScheduleDates} from '../../store/reducers/getSchedules';
import {getWorkHistory} from '../../store/reducers/workHistoryReducer';
import {getProfileDetails} from '../../store/reducers/profileReducer';
import {getRequisitionHistory} from '../../store/reducers/requisitionReducers/requistionHistory';
import {
  getCustomerCareContact,
  resetCustomerCareStatus,
} from '../../store/reducers/customerCare';
import {useToast} from 'react-native-toast-notifications';
import {SafeAreaView} from 'react-native-safe-area-context';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {scaleFont} from '../../utils/helper';

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
  const {data, loading, status, error} = useAppSelector(
    state => state.customerCare,
  );
  const {
    getScheduleLoading,
    workHistoryLoading,
    reqHistoryLoading,
    profileLoading,
  } = useAppSelector(state => ({
    getScheduleLoading: state.schedules.getScheduleLoading,
    workHistoryLoading: state.history.workHistoryLoading,
    reqHistoryLoading: state.requisitionHistory.reqHistoryLoading,
    profileLoading: state.profile.profileLoading,
  }));

  const {apiKey, employeeCode, empName} = useAppSelector(state => state.app);
  const profileDetails = useAppSelector(state => state.profile.profileDetails);

  // Fetch logged-in user profile if name not cached yet
  const userName =
    empName || profileDetails?.data?.employee_name || profileDetails?.employee_name;

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
      if (phoneNumber) {
        const url = `tel:${phoneNumber}`;
        Linking.openURL(url);
      }
    } catch (err) {
      console.log('Error launching phone dialer');
    }
  };

  useEffect(() => {
    if (status === 'success') {
      handleCallPress();
      dispatch(resetCustomerCareStatus());
    } else if (status === 'failed') {
      if (error) {
        toast.show(error);
      }
      dispatch(resetCustomerCareStatus());
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
        break;
    }
  };

  const isGlobalLoading =
    loading ||
    getScheduleLoading ||
    workHistoryLoading ||
    reqHistoryLoading ||
    profileLoading;

  return (
    <SafeAreaView style={styles.container}>
      <Header isHome />
      <LoadingOverlay visible={isGlobalLoading} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Greeting Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.greetingTitle}>
              Welcome back, {userName || 'Technician'}! 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              Manage your facility maintenance services & jobs seamlessly
            </Text>
          </View>
        </View>

        {/* Dashboard Services Grid */}
        <View style={styles.gridContainer}>
          {items.map((item, index) => {
            const isCustomerCare = item.route === '';
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  isCustomerCare && styles.customerCareCard,
                ]}
                onPress={() => handleItemPress(item)}>
                <View
                  style={[
                    styles.iconCircle,
                    isCustomerCare && styles.customerCareIconCircle,
                  ]}>
                  {isCustomerCare ? (
                    <MaterialIcons name="headset-mic" size={28} color={colors.white} />
                  ) : (
                    <Image source={item.icon} style={styles.cardIcon} />
                  )}
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
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bannerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bannerTextCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: scaleFont(18),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  customerCareCard: {
    width: '100%',
    backgroundColor: colors.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerCareIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 0,
    marginRight: 16,
  },
  cardIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    textAlign: 'center',
  },
  customerCareTitle: {
    fontSize: scaleFont(15),
    color: colors.white,
    textAlign: 'left',
  },
});
