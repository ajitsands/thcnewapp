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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner / Hero Section */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroGreeting}>Welcome Back 👋</Text>            <Text style={styles.heroSubtext}>THC Facility Management Dashboard</Text>
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
                  styles.itemCard,
                  isCustomerCare && styles.fullWidthCard,
                ]}
                onPress={() => handleItemPress(item)}>
                <View
                  style={[
                    styles.iconBadge,
                    isCustomerCare && styles.customerCareBadge,
                  ]}>
                  <Image
                    source={item.icon}
                    style={styles.cardIcon}
                  />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {isCustomerCare ? 'Get Immediate Support' : 'Tap to access'}
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroGreeting: {
    fontSize: scaleFont(22),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
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
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: screenWidth / 2 - 24,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  fullWidthCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(11, 44, 81, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerCareBadge: {
    marginBottom: 0,
    marginRight: 16,
    backgroundColor: 'rgba(222, 110, 0, 0.1)',
  },
  cardIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  cardTitle: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
    textAlign: 'center',
  },
});
