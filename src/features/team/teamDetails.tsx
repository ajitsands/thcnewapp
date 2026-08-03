import React, {useEffect} from 'react';
import {
  FlatList,
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
} from '../../store/reducers/serviceReducers/serviceDetailsReducer';
import {getTeamDetails} from '../../store/reducers/getTeam';
import {scaleFont} from '../../utils/helper';

interface TeamDetailProps {
  route: any;
}

export const TeamDetails = (props: TeamDetailProps) => {
  const {data, loading} = useAppSelector(state => state.team);
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {ticketType} = useAppSelector(state => state.tickets);
  const tickets = useAppSelector(state => state.tickets.data);
  const {status} = useAppSelector(state => state.markPresent);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {route} = props;
  const visitDate = route?.params?.visitDate;
  const teamDetails = data?.data || [];
  const ticketDetails = tickets?.data[0];

  useEffect(() => {
    if (status === 'success') {
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

  const handleAttendanceMarking = (item: any) => {
    if (item?.is_leader === 'Yes' && !isBackdated(visitDate)) {
      if (item?.is_attend === 'No') {
        dispatch(
          markPresent({
            action: 'mark_emp_attendance',
            ticket_team_ids: item?.ticket_team_ids,
            amc_ticket: ticketType,
            APIKEY: apiKey,
            emp_code: employeeCode,
          }),
        );
      }
    } else {
      toast.show(`You don't have privilege to mark attendance`, {
        style: styles.toast,
      });
    }
  };

  const renderTeamCard = ({item}: any) => {
    const isLeader = item?.is_leader === 'Yes';
    const isPresent = item?.is_attend === 'Yes';

    return (
      <View style={styles.memberCard}>
        {/* Member Header */}
        <View style={styles.memberHeader}>
          <View style={styles.memberInfoRow}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={20} color={colors.white} />
            </View>
            <View>
              <Text style={styles.memberName}>{item.employee_name}</Text>
              <Text style={styles.memberCode}>ID: {item.employee_code}</Text>
            </View>
          </View>

          {isLeader && (
            <View style={styles.leaderBadge}>
              <MaterialIcons name="stars" size={12} color={colors.white} />
              <Text style={styles.leaderBadgeText}>TEAM LEADER</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        {/* Member Contact Info */}
        <View style={styles.contactRow}>
          <MaterialIcons name="phone" size={16} color={colors.primary} />
          <Text style={styles.contactText}>
            Phone: <Text style={styles.contactValue}>{item.employee_contact_no || 'N/A'}</Text>
          </Text>
        </View>

        {/* Attendance Action */}
        <TouchableOpacity
          activeOpacity={isPresent ? 1 : 0.8}
          style={[
            styles.attendanceBtn,
            isPresent ? styles.presentBtn : styles.absentBtn,
          ]}
          onPress={() => handleAttendanceMarking(item)}>
          <MaterialIcons
            name={isPresent ? 'check-circle' : 'touch-app'}
            size={18}
            color={colors.white}
          />
          <Text style={styles.attendanceBtnText}>
            {isPresent ? 'PRESENT' : 'MARK PRESENT'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isAnyonePresent =
    Array.isArray(teamDetails) &&
    teamDetails.some((item: any) => item.is_attend === 'Yes');

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <View style={styles.mainWrapper}>
        <FlatList
          data={teamDetails}
          renderItem={renderTeamCard}
          keyExtractor={(item, index) => item.ticket_team_ids || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <HeaderBar title="TEAM MEMBERS" isAssetDetails />
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              disabled={!isAnyonePresent}
              activeOpacity={0.85}
              style={[
                styles.serviceButton,
                !isAnyonePresent && styles.disabledServiceBtn,
              ]}
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
              <MaterialIcons name="settings" color={colors.white} size={22} />
              <Text style={styles.serviceButtonText}>
                {isAnyonePresent ? 'PROCEED TO SERVICES' : 'AT LEAST ONE MUST BE PRESENT'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default TeamDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  mainWrapper: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberName: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  memberCode: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 2,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  leaderBadgeText: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginLeft: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginLeft: 8,
  },
  contactValue: {
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  attendanceBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presentBtn: {
    backgroundColor: '#15803D',
  },
  absentBtn: {
    backgroundColor: colors.red,
  },
  attendanceBtnText: {
    color: colors.white,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  serviceButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  disabledServiceBtn: {
    backgroundColor: colors.grey,
    opacity: 0.6,
    elevation: 0,
  },
  serviceButtonText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(13),
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  toast: {
    bottom: 50,
  },
});
