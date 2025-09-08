import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {HeaderBar} from '../../core/components/headerBar';
import {FontFamily} from '../../themes/fonts';
import {navigate} from '../../navigators';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useAppDispatch, useAppSelector} from '../../store';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {markPresent} from '../../store/reducers/markPresentReducer';
import {useToast} from 'react-native-toast-notifications';
import moment from 'moment';
import {
  getServiceDetails,
  getServiceSlots,
  getServiceTypes,
} from '../../store/reducers/serviceReducers/serviceDetailsReducer';
import {useEffect} from 'react';
import getTeam, {getTeamDetails} from '../../store/reducers/getTeam';
import {scaleFont} from '../../utils/helper';
interface TeamDetailProps {
  route: any;
}
export const TeamDetails = (props: TeamDetailProps) => {
  const {data, loading, error} = useAppSelector(state => state.team);
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {ticketType} = useAppSelector(state => state.tickets);
  const tickets = useAppSelector(state => state.tickets.data);
  const {status} = useAppSelector(state => state.markPresent);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {route} = props;
  const {visitDate} = route?.params;
  console.log('vvvvvv', visitDate);
  const teamDetails = data?.data;
  const ticketDetails = tickets?.data[0];

  useEffect(() => {
    if (status == 'success') {
      dispatch(
        getTeamDetails({
          action: 'get_team_of_visit',
          APIKEY: apiKey,
          visit_date: visitDate,
          amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
          amc_tkt_id: ticketDetails?.ticket_id,
        }),
      );
    }
  }, [status]);
  const isBackdated = (selectedDate: string) => {
    return moment(selectedDate).isBefore(moment(), 'day');
  };

  const handleAttendanceMarking = item => {
    if (item?.is_leader == 'Yes' && !isBackdated(visitDate)) {
      item?.is_attend == 'No' &&
        dispatch(
          markPresent({
            action: 'mark_emp_attendance',
            ticket_team_ids: item?.ticket_team_ids,
            amc_ticket: ticketType,
            APIKEY: apiKey,
            emp_code: employeeCode,
          }),
        );
    } else {
      toast.show(`You Don't have the privilege to mark attendance`, {
        style: styles.toast,
        textStyle: {
          fontFamily: FontFamily.regular,
          fontSize: scaleFont(16),
          color: colors.white,
          textAlign: 'center',
        },
      });
    }
  };
  const renderTeamDetails = ({item}: any) => {
    return (
      <View style={{margin: 10}}>
        <View style={styles.header}>
          <Text
            style={
              styles.headerText
            }>{`Work Order No: ${item?.ticket_ref_no}`}</Text>
        </View>
        <View style={{backgroundColor: colors.primary}}>
          {item?.is_leader == 'Yes' && (
            <ImageBackground
              style={styles.flag}
              source={require('../../assets/images/3.0x/thoranam.png')}
              tintColor={colors.blue}>
              <Text style={styles.flagText}>L</Text>
            </ImageBackground>
          )}
        </View>

        <View style={styles.details}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}>
            <Text style={styles.detailText}>EMPLOYEE CODE</Text>
            <Text style={[styles.detailText, {width: '20%'}]}>:</Text>
            <Text style={styles.detailText}>{item.employee_code}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}>
            <Text style={styles.detailText}>NAME</Text>
            <Text style={[styles.detailText, {width: '20%'}]}>:</Text>
            <Text style={styles.detailText}>{item.employee_name}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}>
            <Text style={styles.detailText}>PHONE</Text>
            <Text style={[styles.detailText, {width: '20%'}]}>:</Text>
            <Text style={styles.detailText}>{item.employee_contact_no}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}>
            <Text style={styles.detailText}>LEADER</Text>
            <Text style={[styles.detailText, {width: '20%'}]}>:</Text>
            <Text style={styles.detailText}>{item.is_leader}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.goButton,
              {
                backgroundColor:
                  item?.is_attend == 'Yes' ? colors.grey : colors.red,
              },
            ]}
            onPress={() => {
              handleAttendanceMarking(item);
            }}>
            <Text style={styles.goButtonText}>Present</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <View style={styles.detailContainer}>
        <LoadingOverlay visible={loading} />
        <FlatList
          data={teamDetails}
          renderItem={renderTeamDetails}
          keyExtractor={(item, index) => item.ticket_team_ids}
          ListHeaderComponent={() => (
            <HeaderBar
              title="TEAM MEMBER DETAILS"
              isAssetDetails
              Styles={styles.headerBarText}
            />
          )}
          ListFooterComponent={() => {
            const isAnyonePresent =
              Array.isArray(teamDetails) &&
              teamDetails.some(item => item.is_attend === 'Yes');

            return (
              <TouchableOpacity
                disabled={!isAnyonePresent}
                style={styles.serviceButton}
                onPress={() => {
                  dispatch(
                    getServiceDetails({
                      action: 'get_visit_services',
                      amc_ticket: ticketType,
                      amc_tkt_id: ticketDetails?.ticket_id,
                      visit_date: visitDate,
                      APIKEY: apiKey,
                      emp_code: employeeCode,
                    }),
                  );
                  navigate('ServiceDetails');
                }}>
                <MaterialIcons name="settings" color={colors.white} size={20} />
                <Text style={styles.serviceButtonText}>
                  {isAnyonePresent ? 'GET SERVICES' : 'ONE SHOULD BE PRESENT'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  detailContainer: {
    marginTop: 40,
    flex: 1,
    // marginHorizontal:10,
  },
  headerBarText: {
    fontFamily: FontFamily.deupRegular,
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
    // paddingTop: 5,
    padding: 15,
    // paddingBottom: 5,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
  },
  detailText: {
    fontFamily: FontFamily.deupRegular,
    color: colors.white,
    fontSize: scaleFont(18),
    width: '40%',
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
    top: 6,
    left: 12,
  },
  flag: {
    height: 60,
    width: 35,
    alignSelf: 'flex-end',
    marginTop: -40,
    marginRight: 10,
    zIndex: 10,

  },
  goButton: {
    // backgroundColor: colors.red,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    // Android shadow
  },

  goButtonText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(14),
  },
  serviceButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 15,
    marginHorizontal: 10,
    padding: 12,
    marginBottom: 40,
  },
  serviceButtonText: {
    color: colors.white,
    fontFamily: FontFamily.regular,
    fontSize: scaleFont(20),
    marginLeft: 5,
  },
  toast: {
    width: '60%',
    // bottom: 50,
    backgroundColor: colors.lightBackground,
    // fontFamily: FontFamily.regular,
    // fontSize: scaleFont(22),
  },
});
