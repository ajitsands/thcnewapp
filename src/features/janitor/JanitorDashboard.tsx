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
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {getScheduleDates} from '../../store/reducers/getSchedules';
import {getWorkHistory} from '../../store/reducers/workHistoryReducer';
import {getProfileDetails} from '../../store/reducers/profileReducer';
import {getEmployeeWorkordersWithRequisitions} from '../../store/reducers/requisitionReducers/requistionHistory';
import {
  getCustomerCareContact,
  resetCustomerCareStatus,
} from '../../store/reducers/customerCare';
import {ApiUrl} from '../../network/endpoints';
import {useToast} from 'react-native-toast-notifications';
import {SafeAreaView} from 'react-native-safe-area-context';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {scaleFont} from '../../utils/helper';

export const JanitorDashboard = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {data: customerCareData, loading: customerCareLoading, status: customerCareStatus, error: customerCareError} =
    useAppSelector(state => state.customerCare);

  const {getScheduleLoading, workHistoryLoading, profileLoading, requisitionLoading} =
    useAppSelector(state => ({
      getScheduleLoading: state?.schedules?.getScheduleLoading || false,
      workHistoryLoading: state?.history?.workHistoryLoading || false,
      profileLoading: state?.profile?.profileLoading || false,
      requisitionLoading: state?.requisitionHistory?.employeeRequisitionsLoading || false,
    }));

  const {apiKey, employeeCode, empName, employeeId} = useAppSelector(
    state => state.app,
  );
  const profileDetails = useAppSelector(state => state.profile.profileDetails);

  const userName =
    empName ||
    profileDetails?.data?.employee_name ||
    profileDetails?.employee_name ||
    'Janitor';

  useEffect(() => {
    if (!empName && apiKey && employeeCode) {
      dispatch(
        getProfileDetails({
          action: 'view_profile_details',
          emp_code: employeeCode,
          APIKEY: apiKey,
        }),
      );
    }
  }, [empName, apiKey, employeeCode]);

  const handleCallPress = async () => {
    try {
      const phoneNumber = customerCareData?.data?.[0]?.thc_cust_care_no;
      if (phoneNumber) {
        const url = `tel:${phoneNumber}`;
        Linking.openURL(url);
      }
    } catch (err) {
      console.log('Error launching dialer');
    }
  };

  useEffect(() => {
    if (customerCareStatus === 'success') {
      handleCallPress();
      dispatch(resetCustomerCareStatus());
    } else if (customerCareStatus === 'failed') {
      if (customerCareError) {
        toast.show(customerCareError);
      }
      dispatch(resetCustomerCareStatus());
    }
  }, [customerCareStatus]);

  const handleJanitorCalendar = () => {
    dispatch(
      getScheduleDates({
        action: 'get_schedule_dates',
        APIKEY: apiKey || ApiUrl.janitorApiKey,
        emp_code: employeeCode,
        emp_id: employeeId,
      }),
    );
    navigation.navigate('ScheduleCalendar');
  };

  const handleCompletedJobs = () => {
    dispatch(
      getWorkHistory({
        action: 'get_execution_history',
        APIKEY: apiKey || ApiUrl.janitorApiKey,
        emp_code: employeeCode,
      }),
    );
    navigation.navigate('History');
  };

  const handleRequestAssets = () => {
    dispatch(
      getEmployeeWorkordersWithRequisitions({
        action: 'getEmployeeWorkordersWithRequisitions',
        APIKEY: apiKey,
        employee_id: employeeId,
        user_id: employeeId,
        emp_id: employeeId,
        emp_code: employeeCode,
        employee_code: employeeCode,
      }),
    );
    navigation.navigate('RequisitionHistory');
  };

  const handleContactCustomerCare = () => {
    dispatch(
      getCustomerCareContact({
        action: 'get_customer_care_no',
        emp_code: employeeCode,
        APIKEY: apiKey,
      }),
    );
  };

  const handleProfilePress = () => {
    dispatch(
      getProfileDetails({
        action: 'view_profile_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
      }),
    );
    navigation.navigate('ProfileScreen');
  };

  const isGlobalLoading =
    customerCareLoading ||
    getScheduleLoading ||
    workHistoryLoading ||
    profileLoading ||
    requisitionLoading;

  return (
    <SafeAreaView style={styles.container}>
      <Header isHome isProfile />
      <LoadingOverlay visible={isGlobalLoading} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Janitor Hero Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.bannerTextCol}>
              <View style={styles.roleBadge}>
                <MaterialIcons name="cleaning-services" size={14} color={colors.secondary} />
                <Text style={styles.roleBadgeText}>JANITOR PORTAL</Text>
              </View>
              <Text style={styles.greetingTitle}>Welcome, {userName}!</Text>
              <Text style={styles.greetingSubtitle}>
                Manage your daily cleaning schedule, tasks & asset requests
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleProfilePress}
              style={styles.profileBadgeBtn}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : 'J'}
                </Text>
              </View>
              {employeeCode ? (
                <Text style={styles.empCodeBadge}>{employeeCode}</Text>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <Text style={styles.sectionSubtitle}>Janitor Dashboard</Text>
        </View>

        {/* 4 Core Features */}
        <View style={styles.cardsContainer}>
          {/* 1. Janitor Calendar */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={handleJanitorCalendar}>
            <View style={[styles.iconCircle, {backgroundColor: '#E8F1FC'}]}>
              <Image
                source={require('../../assets/images/schedule.png')}
                style={[styles.cardIcon, {tintColor: colors.primary}]}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Janitor Calendar</Text>
              <Text style={styles.cardDescription}>
                View cleaning shifts, visit dates and scheduled time slots
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. List Of Completed Jobs */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={handleCompletedJobs}>
            <View style={[styles.iconCircle, {backgroundColor: '#ECFDF5'}]}>
              <Image
                source={require('../../assets/images/history.png')}
                style={[styles.cardIcon, {tintColor: '#059669'}]}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>List of Completed Jobs</Text>
              <Text style={styles.cardDescription}>
                Review your job execution history, logs and status
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. Request for Assets */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={handleRequestAssets}>
            <View style={[styles.iconCircle, {backgroundColor: '#FEF3C7'}]}>
              <Image
                source={require('../../assets/images/requisition.png')}
                style={[styles.cardIcon, {tintColor: '#D97706'}]}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Request for Assets</Text>
              <Text style={styles.cardDescription}>
                Requisition cleaning supplies, chemicals, equipment & spare assets
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* 4. Contact Customer Care */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.featureCard, styles.customerCareCard]}
            onPress={handleContactCustomerCare}>
            <View style={styles.customerCareIconCircle}>
              <MaterialIcons name="headset-mic" size={28} color={colors.white} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.customerCareTitle}>Contact Customer Care</Text>
              <Text style={styles.customerCareDescription}>
                Need urgent assistance or reporting issues? Dial support 24/7
              </Text>
            </View>
            <View style={styles.callNowBtn}>
              <MaterialIcons name="phone" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JanitorDashboard;

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
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 216, 31, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.secondary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: scaleFont(20),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 18,
  },
  profileBadgeBtn: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: scaleFont(18),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  empCodeBadge: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  sectionSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  cardsContainer: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: scaleFont(11.5),
    fontFamily: FontFamily.regular,
    color: '#64748B',
    lineHeight: 16,
  },
  customerCareCard: {
    backgroundColor: colors.header,
    marginTop: 4,
  },
  customerCareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerCareTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginBottom: 3,
  },
  customerCareDescription: {
    fontSize: scaleFont(11.5),
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  callNowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
