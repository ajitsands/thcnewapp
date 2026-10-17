import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
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
import {navigate} from '../../../navigators';
import {evaluateSlotTiming, formatLateDuration} from '../../../utils/geoHelper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import moment from 'moment';

export const ScheduleSlots = ({route}: any) => {
  const currentDate = route?.params?.day || 'Selected Date';
  const {data, loading, error, status}: any = useAppSelector((state: any) => state.slots);
  const {employeeCode, apiKey, employeeType}: any = useAppSelector((state: any) => state.app);
  const slots = data?.data || {};
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Date calculation: Today vs Past vs Future
  const rawDateStr = data?.date || route?.params?.day;
  const targetMoment = moment(
    rawDateStr,
    ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601],
    true,
  ).isValid()
    ? moment(rawDateStr, ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601], true)
    : moment(rawDateStr);

  const todayMoment = moment().startOf('day');
  const taskMoment = targetMoment.isValid() ? targetMoment.clone().startOf('day') : todayMoment;

  const isToday = taskMoment.isSame(todayMoment, 'day');
  const isPast = taskMoment.isBefore(todayMoment, 'day');
  const isFuture = taskMoment.isAfter(todayMoment, 'day');
  const formattedTaskDate = taskMoment.format('YYYY-MM-DD');
  const todayDateStr = todayMoment.format('YYYY-MM-DD');

  useEffect(() => {
    if (status === 'failed' && error) {
      toast.show(error);
    }
  }, [status, error, toast]);

  const getJobDetails = (visitId: any, slotNumber?: number) => {
    const slotId = slots[0]?.slot_id || slots[0]?.id || slotNumber;
    dispatch(
      getTicketDetails({
        action: 'get_amc_ticket_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
        visit_date: slots[0]?.slot_date,
        amc_ticket_ref_no: visitId,
        slot_number: slots[0]?.slot_id || slotNumber,
        slot_id: slotId,
      }),
    );
  };

  const handleScanAsset = (item: any) => {
    if (!isToday) {
      if (isPast) {
        Alert.alert(
          'Scanning Disabled (Past Date)',
          `This cleaning task was scheduled for a past date (${taskMoment.format('DD MMMM YYYY')}).\n\nJanitors are only permitted to scan and execute tasks for Today (${todayMoment.format('DD MMMM YYYY')}).`,
          [{text: 'Understood', style: 'default'}],
        );
      } else {
        Alert.alert(
          'Scanning Not Available (Upcoming Date)',
          `This cleaning task is scheduled for an upcoming date (${taskMoment.format('DD MMMM YYYY')}).\n\nYou cannot scan upcoming tasks in advance. Please scan on the scheduled day.`,
          [{text: 'Understood', style: 'default'}],
        );
      }
      return;
    }

    navigate('JanitorQRScanner', {
      assignment: item,
      expectedAssetCode: item.asset_ref_no,
      targetLat: parseFloat(item.latitude || item.building_latitude || '0'),
      targetLng: parseFloat(item.longitude || item.building_longitude || '0'),
      checklistId: item.checklist_id,
      assignmentId: item.assignment_id,
      slotsDetail: item.slots_detail || item.slots_list,
      selectedDate: formattedTaskDate,
      settings: data?.settings,
    });
  };

  const isJanitor =
    (employeeType || '').toLowerCase().includes('janitor') ||
    data?.settings !== undefined ||
    (Array.isArray(data?.data) &&
      data?.data.length > 0 &&
      (!!data?.data[0]?.assignment_id || !!data?.data[0]?.checklist_name)) ||
    (employeeCode || '').toUpperCase().startsWith('CG-THC-029');

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Date Header Banner */}
        <View style={styles.dateHeaderCard}>
          <MaterialIcons
            name={isToday ? 'event-available' : isPast ? 'history' : 'event'}
            size={26}
            color={isToday ? colors.primary : isPast ? '#DC2626' : '#2563EB'}
          />
          <View style={styles.dateInfo}>
            <Text style={styles.dateSubTitle}>SCHEDULED SLOTS FOR</Text>
            <Text style={styles.dateTitleText}>{currentDate}</Text>
          </View>
          <View
            style={[
              styles.dateStatusBadge,
              isToday
                ? styles.dateBadgeToday
                : isPast
                ? styles.dateBadgePast
                : styles.dateBadgeFuture,
            ]}>
            <Text
              style={[
                styles.dateStatusBadgeText,
                isToday
                  ? styles.dateBadgeTextToday
                  : isPast
                  ? styles.dateBadgeTextPast
                  : styles.dateBadgeTextFuture,
              ]}>
              {isToday ? 'TODAY' : isPast ? 'PAST' : 'UPCOMING'}
            </Text>
          </View>
        </View>

        {/* Date Restriction Banner for Past / Upcoming Dates */}
        {!isToday && (
          <View
            style={[
              styles.dateNoticeBanner,
              isPast ? styles.dateNoticePast : styles.dateNoticeFuture,
            ]}>
            <MaterialIcons
              name={isPast ? 'lock-clock' : 'schedule'}
              size={18}
              color={isPast ? '#B91C1C' : '#1D4ED8'}
            />
            <Text
              style={[
                styles.dateNoticeText,
                isPast ? styles.dateNoticeTextPast : styles.dateNoticeTextFuture,
              ]}>
              {isPast
                ? `Past Schedule (${taskMoment.format('DD MMM')}) - Scanning & execution disabled. Janitors can only scan today's tasks.`
                : `Upcoming Schedule (${taskMoment.format('DD MMM')}) - Scanning will unlock on the scheduled day.`}
            </Text>
          </View>
        )}

        {isJanitor ? (
          /* Janitor Cleaning Work Orders List */
          <View style={styles.janitorListContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Cleaning Assignments</Text>
              <Text style={styles.assignmentCountBadge}>
                {Array.isArray(data?.data) ? data.data.length : 0}{' '}
                {Array.isArray(data?.data) && data.data.length === 1 ? 'Task' : 'Tasks'}
              </Text>
            </View>

            {Array.isArray(data?.data) && data.data.length > 0 ? (
              data.data.map((item: any, idx: number) => {
                const statusColor = item.work_status_color || colors.primary;

                // Parse slots_detail if available
                let slotRules: any[] = [];
                try {
                  if (typeof item.slots_detail === 'string' && item.slots_detail.startsWith('[')) {
                    slotRules = JSON.parse(item.slots_detail);
                  } else if (Array.isArray(item.slots_detail)) {
                    slotRules = item.slots_detail;
                  }
                } catch (e) {
                  slotRules = [];
                }

                const slotsList = Array.isArray(item.slots_list) && item.slots_list.length > 0
                  ? item.slots_list
                  : slotRules;

                return (
                  <View key={item.assignment_id || idx} style={styles.janitorCard}>
                    {/* Card Header */}
                    <View style={styles.janitorCardHeader}>
                      <View style={styles.checklistInfoCol}>
                        <Text style={styles.checklistTitle}>{item.checklist_name || 'Cleaning Task'}</Text>
                        <Text style={styles.assignmentRefText}>
                          #{item.assignment_ref_no || `TASK-${idx + 1}`} • {item.frequency || 'Daily'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
                        <Text style={styles.statusBadgeText}>{item.work_status || 'Scheduled'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Location & Building */}
                    <View style={styles.metaRow}>
                      <MaterialIcons name="business" size={16} color={colors.primary} />
                      <Text style={styles.metaLabel}>Building / Location:</Text>
                      <Text style={styles.metaValue} numberOfLines={1}>
                        {item.building_name || 'N/A'} {item.location_name ? `(${item.location_name})` : ''}
                      </Text>
                    </View>

                    {/* Interactive Asset Row (Tap opens QR Reader if today, or shows restriction notice) */}
                    <TouchableOpacity
                      activeOpacity={isToday ? 0.75 : 0.85}
                      style={[styles.assetInteractiveCard, !isToday && styles.assetCardDisabled]}
                      onPress={() => handleScanAsset(item)}>
                      <View style={[styles.assetIconBadge, !isToday && styles.assetIconBadgeDisabled]}>
                        <MaterialIcons
                          name={isToday ? 'qr-code-scanner' : 'qr-code'}
                          size={20}
                          color={isToday ? colors.primary : '#94A3B8'}
                        />
                      </View>
                      <View style={styles.assetInfoCol}>
                        <Text style={[styles.assetSubLabel, !isToday && {color: '#64748B'}]}>
                          {isToday ? 'ASSET CODE (TAP TO SCAN)' : 'ASSET CODE (VIEW ONLY)'}
                        </Text>
                        <Text style={styles.assetRefValue} numberOfLines={1}>
                          {item.asset_ref_no || 'Tap to Scan Asset'}
                        </Text>
                        <Text style={styles.assetDescValue} numberOfLines={1}>
                          {item.asset_description ? `${item.asset_description} • ` : ''}
                          {item.room_no ? `Room ${item.room_no} • ` : ''}
                          {item.zone_floor ? `Floor ${item.zone_floor}` : ''}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={isToday ? 'chevron-right' : 'lock-outline'}
                        size={isToday ? 24 : 18}
                        color={isToday ? colors.primary : '#94A3B8'}
                      />
                    </TouchableOpacity>

                    {/* Assigned Slots / Shifts with Timing Check */}
                    {Array.isArray(slotsList) && slotsList.length > 0 && (
                      <View style={styles.slotsSection}>
                        <Text style={styles.slotsHeaderTitle}>Time Slots & Schedule Window:</Text>
                        <View style={styles.slotsPillsRow}>
                          {slotsList.map((s: any, sIdx: number) => {
                            const lateThreshold = Number(data?.settings?.late_time_minutes) >= 0 ? Number(data.settings.late_time_minutes) : 15;
                            const timing = evaluateSlotTiming(s, data?.date || currentDate, lateThreshold);
                            const slotLabel = s.slot_name || s.name || s.slot_time || `Slot ${sIdx + 1}`;
                            const timeRuleText = s.start_time && s.end_time && s.end_time !== '0'
                              ? `${s.start_time} - ${s.end_time}`
                              : s.time_rule && s.time_rule !== 'No Rule'
                              ? s.time_rule
                              : '';

                            const isExecuted = s.is_completed === 'Yes' || (s.execution_status && s.execution_status !== 'Pending');
                            const execStatus = s.execution_status || (s.is_completed === 'Yes' ? 'Completed' : 'Pending');
                            const isPartial = execStatus.toLowerCase().includes('partial');
                            const isLateExecuted = execStatus.toLowerCase().includes('late') || (isExecuted && timing.isLate);
                            const formattedLateTime = formatLateDuration(timing.delayMinutes);

                            let pillStyle = styles.slotPillPending;
                            let iconName = 'schedule';
                            let iconColor = colors.primary;
                            let textStyle = styles.slotPillTextPending;
                            let slotStatusText = 'Pending';

                            if (isExecuted) {
                              if (isPartial) {
                                pillStyle = isLateExecuted ? styles.slotPillLate : styles.slotPillPartial;
                                iconName = isLateExecuted ? 'alarm-on' : 'warning';
                                iconColor = isLateExecuted ? '#DC2626' : '#D97706';
                                textStyle = isLateExecuted ? styles.slotPillTextLate : styles.slotPillTextPartial;
                                slotStatusText = isLateExecuted
                                  ? (execStatus.includes('Late') ? execStatus : `Partially Completed (Late by ${formattedLateTime})`)
                                  : 'Partially Completed (On Time)';
                              } else if (isLateExecuted) {
                                pillStyle = styles.slotPillLate;
                                iconName = 'alarm-on';
                                iconColor = '#DC2626';
                                textStyle = styles.slotPillTextLate;
                                slotStatusText = execStatus.includes('Late') ? execStatus : `Completed (Late by ${formattedLateTime})`;
                              } else {
                                pillStyle = styles.slotPillDone;
                                iconName = 'check-circle';
                                iconColor = '#059669';
                                textStyle = styles.slotPillTextDone;
                                slotStatusText = 'Completed (On Time)';
                              }
                            } else {
                              if (timing.isLate) {
                                pillStyle = styles.slotPillLate;
                                iconName = 'alarm-on';
                                iconColor = '#DC2626';
                                textStyle = styles.slotPillTextLate;
                                slotStatusText = `Pending (Late by ${formattedLateTime})`;
                              } else if (timing.isWithinWindow) {
                                pillStyle = styles.slotPillDone;
                                iconName = 'check-circle';
                                iconColor = '#059669';
                                textStyle = styles.slotPillTextDone;
                                slotStatusText = 'Pending (On Time)';
                              } else {
                                pillStyle = styles.slotPillPending;
                                iconName = 'schedule';
                                iconColor = colors.primary;
                                textStyle = styles.slotPillTextPending;
                                slotStatusText = 'Pending';
                              }
                            }

                            return (
                              <View key={sIdx} style={[styles.slotPill, pillStyle]}>
                                <MaterialIcons name={iconName as any} size={13} color={iconColor} />
                                <Text style={[styles.slotPillText, textStyle]}>
                                  {slotLabel} {timeRuleText ? `(${timeRuleText})` : ''} - {slotStatusText}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Primary Scan & Start Cleaning CTA Button */}
                    <TouchableOpacity
                      activeOpacity={isToday ? 0.85 : 0.75}
                      style={[
                        styles.scanCtaButton,
                        !isToday && (isPast ? styles.scanCtaButtonPast : styles.scanCtaButtonFuture),
                      ]}
                      onPress={() => handleScanAsset(item)}>
                      <MaterialIcons
                        name={isToday ? 'qr-code-scanner' : isPast ? 'lock' : 'event'}
                        size={20}
                        color={isToday ? colors.white : isPast ? '#64748B' : '#1D4ED8'}
                      />
                      <Text
                        style={[
                          styles.scanCtaButtonText,
                          !isToday && (isPast ? styles.scanCtaButtonTextPast : styles.scanCtaButtonTextFuture),
                        ]}>
                        {isToday
                          ? 'SCAN ASSET QR TO START'
                          : isPast
                          ? 'SCAN DISABLED (PAST DATE)'
                          : `SCAN ON ${taskMoment.format('DD MMM').toUpperCase()}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyTasksCard}>
                <MaterialIcons name="event-busy" size={44} color="#94A3B8" />
                <Text style={styles.emptyTasksTitle}>No Cleaning Tasks Scheduled</Text>
                <Text style={styles.emptyTasksSubtitle}>
                  There are no cleaning assignments scheduled for {currentDate}.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Technician 24-Hour Slots Grid Container */
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
                        const slotNumber = i + 1;
                        dispatch(
                          selectedSlots({
                            slots: slotNumber,
                            visitDate: slots[0]?.slot_date,
                          }),
                        );
                        getJobDetails(visitId, slotNumber);
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
        )}
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
  dateStatusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateBadgeToday: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dateBadgePast: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dateBadgeFuture: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateStatusBadgeText: {
    fontSize: scaleFont(10.5),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  dateBadgeTextToday: {
    color: '#059669',
  },
  dateBadgeTextPast: {
    color: '#DC2626',
  },
  dateBadgeTextFuture: {
    color: '#2563EB',
  },
  dateNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dateNoticePast: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dateNoticeFuture: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  dateNoticeText: {
    fontSize: scaleFont(11.5),
    fontFamily: FontFamily.medium,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  dateNoticeTextPast: {
    color: '#991B1B',
  },
  dateNoticeTextFuture: {
    color: '#1E40AF',
  },
  assetCardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  assetIconBadgeDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  scanCtaButtonPast: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanCtaButtonFuture: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanCtaButtonTextPast: {
    color: '#64748B',
  },
  scanCtaButtonTextFuture: {
    color: '#1D4ED8',
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
  janitorListContainer: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  assignmentCountBadge: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.primary,
    backgroundColor: '#E8F1FC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  janitorCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  janitorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  checklistInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  checklistTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 3,
  },
  assignmentRefText: {
    fontSize: scaleFont(11.5),
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginLeft: 6,
    marginRight: 6,
  },
  metaValue: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
    flex: 1,
  },
  slotsSection: {
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  slotsHeaderTitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  slotsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  slotPillDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  slotPillPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  slotPillText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  slotPillTextDone: {
    color: '#065F46',
  },
  slotPillTextPending: {
    color: '#1E40AF',
  },
  slotPillLate: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  slotPillTextLate: {
    color: '#B91C1C',
    fontFamily: FontFamily.bold,
  },
  slotPillPartial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  slotPillTextPartial: {
    color: '#B45309',
    fontFamily: FontFamily.bold,
  },
  assetInteractiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginVertical: 10,
  },
  assetIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  assetInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  assetSubLabel: {
    fontSize: scaleFont(9.5),
    fontFamily: FontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  assetRefValue: {
    fontSize: scaleFont(13.5),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 1,
  },
  assetDescValue: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  scanCtaButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanCtaButtonText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  emptyTasksCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginTop: 10,
  },
  emptyTasksTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 14,
    textAlign: 'center',
  },
  emptyTasksSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ScheduleSlots;
