import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {navigate} from '../../../navigators';
import {scaleFont, screenHeight} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {getScheduleDates} from '../../../store/reducers/getSchedules';
import {getScheduleSlots} from '../../../store/reducers/getSlots';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {useToast} from 'react-native-toast-notifications';

const screenWidth = Dimensions.get('window').width;
const itemWidth = screenWidth - 30; // 15 + 15 margin
const gridHeight = screenHeight * 0.7;

const generateMonthDays = date => {
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
    const date = prevMonth.clone().date(prevMonthDays - i);
    days.push({date, isCurrentMonth: false});
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = current.clone().date(i);
    days.push({date, isCurrentMonth: true});
  }

  // Next month overflow
  while (days.length < 42) {
    const date = current
      .clone()
      .add(1, 'month')
      .date(days.length - (startDay + daysInMonth) + 1);
    days.push({date, isCurrentMonth: false});
  }

  return days;
};

const MonthView = ({month, markedDates}) => {
  const days = generateMonthDays(month);
  const [selectedDay, setSelectedDay] = useState(moment());
  const dispatch = useAppDispatch();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {loading} = useAppSelector(state => state.schedules);

  const containerWidth = screenWidth - 30; // match your itemWidth margin
  const headerHeight = 45; // weekday names
  const titleBarHeight = 40; // red header above calendar

  // Fully occupy screen height
  const verticalMargin = 20;
  const availableHeight =
    gridHeight - headerHeight - titleBarHeight - verticalMargin;
  const dayCellWidth = containerWidth / 7;
  const dayCellHeight = availableHeight / 6;

  return (
    <View style={[styles.monthContainer, {width: itemWidth}]}>
      <View style={[styles.weekDays, {height: headerHeight}]}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>
      <View style={[styles.grid, {height: availableHeight}]}>
        {days.map(({date, isCurrentMonth}, index) => {
          const formattedDate = date.format('YYYY-MM-DD');
          const isMarked = !!markedDates[formattedDate];
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                {
                  height: dayCellHeight,
                  //  width: dayCellWidth,
                  borderColor:
                    selectedDay.isSame(date, 'day') && !loading
                      ? colors.blue
                      : colors.red,
                  borderWidth:
                    selectedDay.isSame(date, 'day') && !loading ? 3 : 0.5,
                },
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
                  day: date.format('MMMM DD YYYY'),
                });
              }}>
              <Text style={[styles.dayText]}>{date.date()}</Text>
              {isMarked && !loading && <View style={styles.triangleCorner} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const ScheduleCalendar = () => {
  const flatListRef = useRef(null);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {status, data, error, loading} = useAppSelector(
    state => state.schedules,
  );
  const initialIndex = 5 * 12; // middle of the range
  const [currentMonthIndex, setCurrentMonthIndex] = useState(initialIndex);
  const currentMonth = moment().startOf('month');
  const totalMonths = 10 * 12; // 960 months
  const months = Array.from({length: totalMonths}, (_, i) =>
    currentMonth
      .clone()
      .subtract(5 * 12, 'months')
      .add(i, 'months'),
  );
  const markedDates =
    data?.data?.reduce((acc, schedule) => {
      const date = moment(schedule.visit_date).format('YYYY-MM-DD');
      acc[date] = true;
      return acc;
    }, {}) || {};
  console.log(markedDates);
  const handleScroll = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    setCurrentMonthIndex(index);
  };

  const scrollToMonth = direction => {
    const newIndex = currentMonthIndex + direction;
    if (newIndex >= 0 && newIndex < months.length) {
      flatListRef.current?.scrollToIndex({index: newIndex, animated: true});
      // setCurrentMonthIndex(newIndex);
    }
  };
  useEffect(() => {
    if (error) {
      toast.show(error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Header />

      <View style={{justifyContent: 'center', flex: 1}}>
        <LoadingOverlay visible={loading} />
        <View style={[styles.calendarContainer, {height: gridHeight}]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => scrollToMonth(-1)}>
              <Image
                source={require('../../../assets/images/arrow.png')}
                style={styles.arrow}
              />
            </TouchableOpacity>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../../../assets/images/calander.png')}
                style={[styles.arrow, {height: 15, width: 15}]}
              />
              <Text style={styles.headerText}>
                Schedule Calendar -{' '}
                {months[currentMonthIndex]?.format('MMMM YYYY')}
                {/* Schedule Calendar - {currentMonth.format('MMMM YYYY')} */}
              </Text>
            </View>

            <TouchableOpacity onPress={() => scrollToMonth(1)}>
              <Image
                source={require('../../../assets/images/arrow.png')}
                style={[styles.arrow, {transform: [{rotate: '180deg'}]}]}
              />
            </TouchableOpacity>
          </View>

          <View style={{flex: 1, marginHorizontal: 14}}>
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
              getItemLayout={(data, index) => ({
                length: itemWidth,
                offset: itemWidth * index,
                index,
              })}
              onMomentumScrollEnd={event => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / itemWidth);
                setCurrentMonthIndex(index); // update title here
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{width: itemWidth}}
              contentContainerStyle={{width: itemWidth * months.length}}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  calendarContainer: {
    marginHorizontal: 15,
    // marginVertical: 50,
    // flex: 1,
    borderRadius: 10,
    backgroundColor: colors.calendar,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.red,
    padding: 10,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: 'center',
  },
  headerText: {
    color: colors.white,
    fontSize: scaleFont(16),
    fontFamily: FontFamily.medium,
    marginLeft: 10,
  },

  arrow: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    backgroundColor: colors.white,
    marginRight: 24,
    marginTop: 10,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    color: colors.black,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
  },
  monthContainer: {
    // marginHorizontal:20
    // alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7.5}%`,
    // width: `${100 / 7.5}%`,
    // height: 95,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: colors.white,
    fontSize: scaleFont(16),
  },
  triangleCorner: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: 30,
    borderBottomWidth: 30,
    borderRightColor: 'transparent',
    borderBottomColor: colors.red,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
