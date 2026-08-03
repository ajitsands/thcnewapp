import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {useToast} from 'react-native-toast-notifications';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {getTicketDetails} from '../../../store/reducers/getTicketDetails';
import {selectedSlots} from '../../../store/reducers/getSlots';
import MaterialIcons from '@react-native-vector-icons/material-icons';

export const ScheduleSlots = ({route}: any) => {
  const currentDate = route?.params?.day || 'Selected Date';
  const {data, loading, error, status} = useAppSelector(state => state.slots);
  const {employeeCode, apiKey} = useAppSelector(state => state.app);
  const slots = data?.data || {};
  const toast = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'failed' && error) {
      toast.show(error);
    }
  }, [status, error]);

  const getJobDetails = (visitId: any) => {
    dispatch(
      getTicketDetails({
        action: 'get_amc_ticket_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
        visit_date: slots[0]?.slot_date,
        amc_ticket_ref_no: visitId,
      }),
    );
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Date Header Banner */}
        <View style={styles.dateHeaderCard}>
          <MaterialIcons name="event" size={24} color={colors.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateSubTitle}>SCHEDULED SLOTS FOR</Text>
            <Text style={styles.dateTitleText}>{currentDate}</Text>
          </View>
        </View>

        {/* Slots Grid Container */}
        <View style={styles.slotsCard}>
          <Text style={styles.sectionTitle}>24-Hour Time Slots</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a highlighted slot to view job ticket details
          </Text>

          <View style={styles.grid}>
            {Array.from({length: 24}).map((_, i) => {
              const slotKey = `slot_${i + 1}`;
              const isActive = slots[0]?.[slotKey] && slots[0]?.[slotKey] !== '0';
              const visitId = slots[0]?.[slotKey];

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={isActive ? 0.75 : 1}
                  onPress={() => {
                    if (isActive) {
                      dispatch(
                        selectedSlots({
                          slots: i + 1,
                          visitDate: slots[0]?.slot_date,
                        }),
                      );
                      getJobDetails(visitId);
                    }
                  }}
                  style={[
                    styles.slotCell,
                    isActive && styles.activeSlotCell,
                  ]}>
                  <Text
                    style={[
                      styles.slotNumber,
                      isActive && styles.activeSlotNumber,
                    ]}>
                    Slot {i + 1}
                  </Text>

                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <MaterialIcons name="assignment" size={12} color={colors.white} />
                      <Text style={styles.activeBadgeText} numberOfLines={1}>
                        #{visitId}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.vacantText}>Available</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
  dateHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dateInfo: {
    marginLeft: 12,
  },
  dateSubTitle: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.5,
  },
  dateTitleText: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 2,
  },
  slotsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  sectionSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCell: {
    width: '23%',
    height: 64,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  activeSlotCell: {
    backgroundColor: 'rgba(11, 44, 81, 0.06)',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  slotNumber: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.grey,
  },
  activeSlotNumber: {
    color: colors.primary,
  },
  vacantText: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    maxWidth: '100%',
  },
  activeBadgeText: {
    color: colors.white,
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    marginLeft: 2,
  },
});

export default ScheduleSlots;
