import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Header} from '../../../core/components/header';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {act, useEffect, useState} from 'react';
import moment from 'moment';
import {scaleFont, screenHeight, screenWidth} from '../../../utils/helper';
import {navigate} from '../../../navigators';
import {useAppDispatch, useAppSelector} from '../../../store';
import {useToast} from 'react-native-toast-notifications';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {getTicketDetails} from '../../../store/reducers/getTicketDetails';
import {selectedSlots} from '../../../store/reducers/getSlots';

const NUM_COLUMNS = 4;
const TOTAL_SLOTS = 24;
const NUM_ROWS = Math.ceil(TOTAL_SLOTS / NUM_COLUMNS);

export const ScheduleSlots = ({route}: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState(moment().date());
  const [errorText, setErrorText] = useState('');
  const currentDate = route?.params?.day;

  const gridHeight = screenHeight * 0.7; // container height
  const gridWidth = screenWidth - 50; // subtract padding/margin if needed
  const headerHeight = 50; // adjust if needed
  const weekDaysHeight = 40; // adjust if needed

  const availableGridHeight = gridHeight - headerHeight - weekDaysHeight;
  const cellWidth = gridWidth / NUM_COLUMNS;
  const cellHeight = availableGridHeight / NUM_ROWS;

  const {data, loading, error, status} = useAppSelector(state => state.slots);
  const {employeeCode, apiKey} = useAppSelector(state => state.app);
  const {visitDate} = useAppSelector(state => state.slots);
  const slots = data?.data || {};
  const toast = useToast();
  const dispatch = useAppDispatch();
  const activeSlots: any = [];
  useEffect(() => {
    if (status == 'failed') {
      setErrorText(error);
      toast.show(error);
    }
  }, [status, error]);

  const getJobDetails = (visitId: any) => {
    console.log(visitId);
    dispatch(
      getTicketDetails({
        action: 'get_amc_ticket_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
        visit_date: slots[0].slot_date,
        amc_ticket_ref_no: visitId,
      }),
    );
  };

  useEffect(() => {
    if (slots.length > 0) {
      const activeSlots = [];

      for (let i = 1; i <= 24; i++) {
        const slotKey = `slot_${i}`;
        if (slots[0]?.[slotKey] && slots[0][slotKey] !== '0') {
          activeSlots.push(i);
        }
      }

      console.log('Active Slots:', activeSlots);
      // dispatch(selectedSlots({ slots: activeSlots,visitDate:slots[0].slot_date }));
    }
  }, [slots]);

  // console.log(data.data[0].employee_code)
  return (
    <View style={styles.container}>
      <Header />
      <View style={{flex: 1, justifyContent: 'center'}}>
        <View style={[styles.calendarContainer, {height: gridHeight}]}>
          <View style={styles.header}>
            <Image
              source={require('../../../assets/images/calander.png')}
              style={styles.arrow}
            />
            <Text style={styles.headerText}>{currentDate}</Text>
          </View>

          <View style={styles.weekDays}>
            <Text style={styles.dayName}>SCHEDULE SLOTS</Text>
          </View>

          <View style={[styles.slotContainer, {width: gridWidth}]}>
            <LoadingOverlay visible={loading} />
            {Array.from({length: 24}).map((_, i) => {
              const slotKey = `slot_${i + 1}`;
              const isActive = slots[0]?.[slotKey] != 0;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    if (isActive) {
                      dispatch(
                        selectedSlots({
                          slots: i + 1,
                          visitDate: slots[0].slot_date,
                        }),
                      );
                      getJobDetails(slots[0]?.[slotKey]);
                    }
                  }}
                  style={[styles.cell, {width: cellWidth, height: cellHeight}]}
                  activeOpacity={1}>
                  <Text style={styles.dayText}>{i + 1}</Text>
                  {isActive && !error && !loading && (
                    <View style={styles.rectangle}>
                      <Text style={styles.dayText}>{slots[0]?.[slotKey]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* <View style={{padding:5}}/> */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.red,
    padding: 10,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: 'center',
  },
  headerText: {
    color: colors.white,
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    marginLeft: 10,
  },
  arrow: {
    height: 15,
    width: 15,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    height: 30,
    backgroundColor: colors.white,
    marginHorizontal: 10,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    color: colors.black,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
  },
  weekRow: {
    flexDirection: 'row',
    marginHorizontal: 10,
    flex: 1,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.red,
    borderWidth: 0.5,
  },
  dayText: {color: colors.white},
  calendarContainer: {
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: colors.calendar,
    overflow: 'hidden',
  },
  cell: {
    // width: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.red,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    // marginVertical:40

    //  flex: 1,
  },
  rectangle: {
    width: '100%',
    height: 15,
    backgroundColor: 'red',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightColor: 'transparent',
    borderBottomColor: colors.red,
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
