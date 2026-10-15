import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import moment from 'moment';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {navigate} from '../../../navigators';
import {scaleFont} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {getScheduleSlots} from '../../../store/reducers/getSlots';
import {getScheduleDates} from '../../../store/reducers/getSchedules';
import {useFocusEffect} from '@react-navigation/native';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {useToast} from 'react-native-toast-notifications';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const screenWidth = Dimensions.get('window').width;
const itemWidth = screenWidth - 32;

const generateMonthDays = (date: moment.Moment) => {
  const current = date.clone().startOf('month');
  const startOfMonth = current.clone().startOf('month');
  const endOfMonth = current.clone().endOf('month');

  const days = [];
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  // Previous month overflow
  const prevMonth = current.clone().subtract(1, 'month');
  const prevMonthDays = prevMonth.daysInMonth();
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonth.clone().date(prevMonthDays - i);
    days.push({date: d, isCurrentMonth: false});
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = current.clone().date(i);
    days.push({date: d, isCurrentMonth: true});
  }

  // Next month overflow
  while (days.length < 42) {
    const d = current
      .clone()
      .add(1, 'month')
      .date(days.length - (startDay + daysInMonth) + 1);
    days.push({date: d, isCurrentMonth: false});
  }

  return days;
};

const MonthView = ({
  month,
  markedDates,
  selectedDate,
  onSelectDate,
}: {
  month: moment.Moment;
  markedDates: Record<string, boolean>;
  selectedDate: string | null;
  onSelectDate: (date: moment.Moment) => void;
}) => {
  const days = generateMonthDays(month);

  return (
    <View style={[styles.monthContainer, {width: itemWidth}]}>
      {/* Weekday Names Header */}
      <View style={styles.weekDaysRow}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <Text
            key={day}
            style={[
              styles.dayName,
              (idx === 0 || idx === 6) && styles.weekendDayName,
            ]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {days.map(({date, isCurrentMonth}, index) => {
          const formattedDate = date.format('YYYY-MM-DD');
          const isMarked = !!markedDates[formattedDate];
          const isSelected = selectedDate === formattedDate;
          const isToday = moment().isSame(date, 'day');

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              style={[
                styles.dayCell,
                isToday && !isSelected && styles.todayCell,
                isMarked && !isSelected && isCurrentMonth && styles.markedDayCell,
                isSelected && styles.selectedDayCell,
                !isCurrentMonth && styles.otherMonthCell,
              ]}
              onPress={() => onSelectDate(date)}>
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthDayText,
                  isToday && !isSelected && styles.todayText,
                  isMarked && !isSelected && isCurrentMonth && styles.markedDayText,
                  isSelected && styles.selectedDayText,
                ]}>
                {date.date()}
              </Text>

              {/* Marked Scheduled Event Dot Badge */}
              {isMarked && isCurrentMonth && (
                <View
                  style={[
                    styles.markedDot,
                    isSelected && styles.markedDotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const ScheduleCalendar = () => {
  const flatListRef = useRef<FlatList>(null);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const appState = useAppSelector(state => state.app);
  const userLoginData = useAppSelector(state => state.userLogin.data);
  const profileDetails = useAppSelector(state => state.profile.profileDetails);
  const {data, error, loading} = useAppSelector(state => state.schedules);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apiKey =
    appState?.apiKey ||
    userLoginData?.APIKEY ||
    userLoginData?.apiKey ||
    profileDetails?.data?.APIKEY ||
    '';

  const employeeCode =
    appState?.employeeCode ||
    userLoginData?.employee_code ||
    userLoginData?.emp_code ||
    profileDetails?.data?.employee_code ||
    profileDetails?.employee_code ||
    '';

  const employeeId =
    appState?.employeeId ||
    userLoginData?.employeeId ||
    userLoginData?.id ||
    userLoginData?.emp_id ||
    profileDetails?.data?.id ||
    '';

  const fetchDates = useCallback(async () => {
    console.log('[ScheduleCalendar] Fetching dates for emp:', employeeCode, 'id:', employeeId);
    await dispatch(
      getScheduleDates({
        action: 'get_schedule_dates',
        APIKEY: apiKey,
        emp_code: employeeCode,
        emp_id: employeeId,
      }),
    );
  }, [apiKey, employeeCode, employeeId, dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchDates();
    }, [fetchDates]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDates();
    setRefreshing(false);
  };

  const initialIndex = 5 * 12; // middle of the range
  const [currentMonthIndex, setCurrentMonthIndex] = useState(initialIndex);
  const currentMonth = moment().startOf('month');
  const totalMonths = 10 * 12;

  const months = Array.from({length: totalMonths}, (_, i) =>
    currentMonth
      .clone()
      .subtract(5 * 12, 'months')
      .add(i, 'months'),
  );

  // Extract schedule items from whatever shape the backend returns:
  const rawScheduleData =
    data?.data ||
    data?.schedule_dates ||
    data?.dates ||
    data?.schedule ||
    data?.result ||
    data;

  const scheduleList: any[] = Array.isArray(rawScheduleData)
    ? rawScheduleData
    : typeof rawScheduleData === 'object' && rawScheduleData !== null
    ? Object.values(rawScheduleData)
    : [];

  const markedDates: Record<string, boolean> = {};
  scheduleList.forEach((schedule: any) => {
    if (!schedule) return;
    const rawDate =
      typeof schedule === 'string'
        ? schedule
        : schedule?.visit_date ||
          schedule?.date ||
          schedule?.schedule_date ||
          schedule?.assigned_date ||
          schedule?.service_date ||
          schedule?.slot_date;

    if (rawDate) {
      const cleanDate = typeof rawDate === 'string' ? rawDate.split(' ')[0].trim() : rawDate;
      const m = moment(cleanDate);
      if (m.isValid()) {
        markedDates[m.format('YYYY-MM-DD')] = true;
      }
    }
  });

  const onSelectDate = (date: moment.Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    console.log('[ScheduleCalendar] Selected date:', dateStr);
    dispatch(
      getScheduleSlots({
        action: 'get_date_slots',
        APIKEY: apiKey,
        emp_code: employeeCode,
        emp_id: employeeId,
        visit_date: dateStr,
      }),
    );
    navigate('ScheduleSlots', {
      day: date.format('MMMM DD, YYYY'),
    });
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    setCurrentMonthIndex(index);
  };

  const scrollToMonth = (direction: number) => {
    const newIndex = currentMonthIndex + direction;
    if (newIndex >= 0 && newIndex < months.length) {
      flatListRef.current?.scrollToIndex({index: newIndex, animated: true});
    }
  };

  useEffect(() => {
    if (error) {
      toast.show(error);
    }
  }, [error]);

  const activeMonth = months[currentMonthIndex];
  const activeMonthKey = activeMonth?.format('YYYY-MM');
  const thisMonthVisits = Object.keys(markedDates)
    .filter(d => d.startsWith(activeMonthKey))
    .sort();

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading && !refreshing} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, '#DC2626']}
          />
        }>
        {/* Month Navigation Control Header */}
        <View style={styles.monthHeaderCard}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => scrollToMonth(-1)}
            style={styles.navArrowBtn}>
            <MaterialIcons name="chevron-left" size={26} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.monthTitleWrapper}>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} style={{marginRight: 8}} />
            <Text style={styles.monthTitleText}>
              {months[currentMonthIndex]?.format('MMMM YYYY')}
            </Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRefresh}
              style={[styles.navArrowBtn, {marginRight: 8}]}>
              <MaterialIcons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => scrollToMonth(1)}
              style={styles.navArrowBtn}>
              <MaterialIcons name="chevron-right" size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Card Container */}
        <View style={styles.calendarCard}>
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            snapToInterval={itemWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            data={months}
            keyExtractor={item => item.toString()}
            initialScrollIndex={initialIndex}
            renderItem={({item}) => (
              <MonthView
                month={item}
                markedDates={markedDates}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
              />
            )}
            getItemLayout={(_, index) => ({
              length: itemWidth,
              offset: itemWidth * index,
              index,
            })}
            onMomentumScrollEnd={event => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / itemWidth);
              setCurrentMonthIndex(index);
            }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{width: itemWidth}}
          />
        </View>

        {/* Calendar Legend Card */}
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#DC2626'}]} />
            <Text style={styles.legendText}>Scheduled Visit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
            <Text style={styles.legendText}>Selected Date</Text>
          </View>
        </View>

        {/* Scheduled Visits for Active Month */}
        {thisMonthVisits.length > 0 && (
          <View style={styles.visitsCard}>
            <View style={styles.visitsCardHeader}>
              <MaterialIcons name="event-available" size={20} color="#DC2626" style={{marginRight: 6}} />
              <Text style={styles.visitsCardTitle}>
                Visits Scheduled ({thisMonthVisits.length})
              </Text>
            </View>
            <View style={styles.visitsChipsRow}>
              {thisMonthVisits.map(visitDate => {
                const m = moment(visitDate);
                return (
                  <TouchableOpacity
                    key={visitDate}
                    activeOpacity={0.8}
                    style={styles.visitChip}
                    onPress={() => onSelectDate(m)}>
                    <MaterialIcons name="schedule" size={15} color="#DC2626" style={{marginRight: 5}} />
                    <Text style={styles.visitChipText}>{m.format('ddd, MMM DD')}</Text>
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
  monthHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 14,
  },
  monthContainer: {
    paddingHorizontal: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    color: colors.header,
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
  },
  weekendDayName: {
    color: colors.red,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (itemWidth - 8) / 7,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 12,
    position: 'relative',
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  markedDayCell: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  otherMonthCell: {
    opacity: 0.35,
  },
  dayText: {
    color: colors.header,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.medium,
  },
  otherMonthDayText: {
    color: colors.grey,
  },
  todayText: {
    color: colors.primary,
    fontFamily: FontFamily.bold,
  },
  markedDayText: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  selectedDayText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
  },
  markedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
    position: 'absolute',
    bottom: 5,
  },
  markedDotSelected: {
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  visitsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  visitsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  visitsCardTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  visitsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
    marginBottom: 6,
  },
  visitChipText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
});

export default ScheduleCalendar;
