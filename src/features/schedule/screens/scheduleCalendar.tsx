import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import moment from 'moment';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {navigate} from '../../../navigators';
import {scaleFont} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {getScheduleSlots} from '../../../store/reducers/getSlots';
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
}: {
  month: moment.Moment;
  markedDates: Record<string, boolean>;
}) => {
  const days = generateMonthDays(month);
  const [selectedDay, setSelectedDay] = useState(moment());
  const dispatch = useAppDispatch();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {loading} = useAppSelector(state => state.schedules);

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
          const isSelected = selectedDay.isSame(date, 'day');
          const isToday = moment().isSame(date, 'day');

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDayCell,
                !isCurrentMonth && styles.otherMonthCell,
              ]}
              onPress={() => {
                setSelectedDay(date);
                dispatch(
                  getScheduleSlots({
                    action: 'get_date_slots',
                    APIKEY: apiKey,
                    emp_code: employeeCode,
                    visit_date: date.format('YYYY-MM-DD'),
                  }),
                );
                navigate('ScheduleSlots', {
                  day: date.format('MMMM DD, YYYY'),
                });
              }}>
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthDayText,
                  isToday && styles.todayText,
                  isSelected && styles.selectedDayText,
                ]}>
                {date.date()}
              </Text>

              {/* Marked Scheduled Event Dot Badge */}
              {isMarked && !loading && (
                <View
                  style={[
                    styles.markedDot,
                    isSelected && {backgroundColor: colors.secondary},
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

  const {data, error, loading} = useAppSelector(state => state.schedules);
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

  const markedDates =
    data?.data?.reduce((acc: any, schedule: any) => {
      const date = moment(schedule.visit_date).format('YYYY-MM-DD');
      acc[date] = true;
      return acc;
    }, {}) || {};

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

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => scrollToMonth(1)}
            style={styles.navArrowBtn}>
            <MaterialIcons name="chevron-right" size={26} color={colors.primary} />
          </TouchableOpacity>
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
              <MonthView month={item} markedDates={markedDates} />
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
            <View style={[styles.legendDot, {backgroundColor: colors.red}]} />
            <Text style={styles.legendText}>Scheduled Visit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
            <Text style={styles.legendText}>Selected Date</Text>
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
    color: colors.red,
    fontFamily: FontFamily.bold,
  },
  selectedDayText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
  },
  markedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
    position: 'absolute',
    bottom: 6,
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
});

export default ScheduleCalendar;
