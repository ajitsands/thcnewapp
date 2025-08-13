import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {HeaderBar} from '../../core/components/headerBar';
import {FontFamily} from '../../themes/fonts';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import AudioPlayerUI from './components/audioPlayer';
import {useAppDispatch, useAppSelector} from '../../store';
import {ErrorModal} from '../../core/components/errorModal';
import {CustomerModal} from './components/customerModal';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {
  getServiceSlots,
  getServiceStatusDetails,
  getServiceDetails,
  getServiceTypes,
} from '../../store/reducers/serviceReducers/serviceDetailsReducer';
import {Loader} from '../../core/components/loader';
import moment from 'moment';
import {getServiceImages} from '../../store/reducers/serviceReducers/getserviceImages';
import {PickerImage} from './components/imagePicker';
import {
  resetStatus,
  startJob,
} from '../../store/reducers/serviceReducers/startJobReducer';
import {ConfirmModal} from '../../core/components/confirmModal';
import {
  pauseJob,
  resetStopStatus,
} from '../../store/reducers/serviceReducers/pauseJobReducer';
import {serviceStatusTypes} from '../../utils/serviceStatusTypes';
import {
  completeJob,
  resetCompleteStatus,
} from '../../store/reducers/serviceReducers/completeJobReducer';
import {
  resetRestartStatus,
  restartJob,
} from '../../store/reducers/serviceReducers/restartJobReducer';
import {extendTicketAction} from '../../store/reducers/serviceReducers/extendTicketReducer';
import {completeTicketAction} from '../../store/reducers/serviceReducers/completeTicketReducer';
import {
  resetError,
  resetStatusMessage,
} from '../../store/reducers/serviceReducers/uploadServiceImages';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useToast} from 'react-native-toast-notifications';
import {useFocusEffect} from '@react-navigation/native';
import {scaleFont} from '../../utils/helper';
const audioRecorderPlayer = new AudioRecorderPlayer();
export const ServiceDetails = () => {
  const {data} = useAppSelector(state => state.tickets) || {};
  const {activeSlots, visitDate} = useAppSelector(state => state.slots);

  const {loading, status} = useAppSelector(state => state.service);
  const {apiKey, employeeCode, empName} = useAppSelector(state => state.app);
  const ticketDetails = data?.data[0];
  const {ticketType} = useAppSelector(state => state.tickets);
  const {
    serviceStatus,
    serviceStatusData,
    serviceStatusLoading,
    serviceStatusError,
    serviceSlotsStatus,
    serviceSlotsData,
    serviceSlotsLoading,
    serviceSlotsError,
  } = useAppSelector(state => state.service);
  const serviceTypes = useAppSelector(state => state.service.data);
  const {startJobStatus, startJobLoading, startJobError} = useAppSelector(
    state => state.startJob,
  );
  const {stopJobStatus, stopJobLoading, stopJobError} = useAppSelector(
    state => state.stopJob,
  );
  const {restartJobStatus, restartJobError} = useAppSelector(
    state => state.restartJob,
  );
  const {completeJobStatus, completeJobLoading, completeJobError} =
    useAppSelector(state => state.completeJob);
  const {serviceImages} = useAppSelector(state => state.serviceImages);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [jobStartItem, setJobStartItem] = useState(null);
  const [jobStartIndex, setJobStartIndex] = useState(null);
  const [completePressed, setCompletePressed] = useState(false);
  const [initialValue, setInitialValue] = useState('');
  const [errorText, setErrorText] = useState('');
  const [description, setDescription] = useState('');
  const [audioPath, setAudioPath] = useState('');
  const [cleared, setCleared] = useState(false);
  const [selectedService, setSelectedService] = useState();

  const slots = serviceSlotsData?.data?.[0];
  const startSlot = parseInt(slots?.start_slot);
  const slotCount = parseInt(slots?.additional_slots);
  const isExtended = slots?.amc_visit_status === 'Extended';
  const isticketCompleted = slots?.amc_visit_status === 'Completed';
  const canComplete = isticketCompleted && serviceImages?.data?.length > 0;
  console.log('complete====================', isticketCompleted, canComplete);
  const allCompleted =
    serviceTypes?.data?.every(
      item => item.ticket_service_status === serviceStatusTypes.completed,
    ) && serviceImages?.data?.length > 0;

  const slotNumbers = Array.from(
    {length: slotCount + 1},
    (_, i) => startSlot + i,
  );

  const isBackdated = (selectedDate: string) => {
    return moment(selectedDate).isBefore(moment(), 'day');
  };
  const dispatch = useAppDispatch();
  const inputRef = useRef(null);
  const toast = useToast();
  useEffect(() => {
    if (serviceStatusData?.data?.[0]) {
      const remark = serviceStatusData?.data?.[0]?.tech_remarks || '';
      setDescription(remark);
      setInitialValue(remark);
      setCleared(false);
      setAudioPath(serviceStatusData?.data?.[0]?.tech_audio);
    }
  }, [serviceStatusData]);

  useFocusEffect(
    useCallback(() => {
      dispatch(
        getServiceImages({
          action: 'get_service_images',
          amc_ticket: ticketType,
          amc_tkt_id: ticketDetails?.ticket_id,
          APIKEY: apiKey,
          emp_code: employeeCode,
        }),
      );
    }, [ticketType, ticketDetails?.ticket_id, apiKey, employeeCode]),
  );

  useEffect(() => {
    dispatch(
      getServiceSlots({
        action: 'get_slot_details_services',
        amc_ticket: ticketType,
        amc_tkt_id: ticketDetails?.ticket_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        visit_date: visitDate,
      }),
    );
  }, []);
  useEffect(() => {
    const jobStatusSuccess =
      startJobStatus === 'success' ||
      stopJobStatus === 'success' ||
      completeJobStatus === 'success' ||
      restartJobStatus === 'success';

    const jobStatusFailed =
      startJobStatus === 'failed' ||
      stopJobStatus === 'failed' ||
      completeJobStatus === 'failed' ||
      restartJobStatus === 'failed';

    if (jobStatusSuccess) {
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

      if (jobStartItem?.ticket_service_id) {
        dispatch(
          getServiceStatusDetails({
            action: 'get_service_status_details',
            visit_date: visitDate,
            amc_ticket: ticketType,
            amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
            amc_tkt_id: ticketDetails?.ticket_id,
            APIKEY: apiKey,
            emp_code: employeeCode,
            ticket_service_id: jobStartItem?.ticket_service_id,
          }),
        );
      }
      setShowErrorModal(true);
      dispatch(resetStatus());
      dispatch(resetCompleteStatus());
      dispatch(resetStopStatus());
      dispatch(resetRestartStatus());
    } else if (jobStatusFailed) {
      setShowErrorModal(false);
      toast.show(
        startJobError || stopJobError || completeJobError || restartJobError,
      );
    }
  }, [startJobStatus, stopJobStatus, completeJobStatus, restartJobStatus]);

  const handleServiceStatus = (item: any, index: number) => {
    setSelectedService(index);
    dispatch(
      getServiceStatusDetails({
        action: 'get_service_status_details',
        visit_date: visitDate,
        amc_ticket: ticketType,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        amc_tkt_id: ticketDetails?.ticket_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        ticket_service_id: item?.ticket_service_id,
      }),
    );
  };
  const handleJobAction = () => {
    dispatch(
      startJob({
        action: 'service_start',
        amc_ticket: ticketType,
        ticket_service_id: jobStartItem?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
      }),
    );

    setShowConfirmModal(false);
    // setShowErrorModal(true);
  };
  const handleJobPause = () => {
    dispatch(
      pauseJob({
        action: 'service_stop',
        amc_ticket: ticketType,
        ticket_service_id: jobStartItem?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
      }),
    );
    setShowConfirmModal(false);

    // setShowErrorModal(true);
  };
  const handleJobComplete = item => {
    dispatch(
      completeJob({
        action: 'service_complete',
        amc_ticket: ticketType,
        ticket_service_id: item?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        tech_audio: audioPath,
        tech_remarks: description,
      }),
    );

    // setShowErrorModal(true);
  };

  const handleJobRestart = () => {
    dispatch(
      restartJob({
        action: 'undo_service_after_complete_close',
        amc_ticket: ticketType,
        ticket_service_id: jobStartItem?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
      }),
    );
    // setShowErrorModal(true);
    setShowConfirmModal(false);
  };

  const handleExtendTicket = () => {
    dispatch(
      extendTicketAction({
        action: 'extend_ticket',
        APIKEY: apiKey,
        emp_code: employeeCode,
        emp_name: empName,
        amc_ticket: ticketType,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    )
      .unwrap()
      .then(response => {
        if (response.status == 'Failed') {
          setErrorText(response.api_message);
          setShowErrorModal(true);
        } else {
          setErrorText('JOB EXTENDED SUCCESSFULLY');
          // ⬇️ Refresh slots to reflect completed status
          dispatch(
            getServiceSlots({
              action: 'get_slot_details_services',
              amc_ticket: ticketType,
              amc_tkt_id: ticketDetails?.ticket_id,
              APIKEY: apiKey,
              emp_code: employeeCode,
              visit_date: visitDate,
            }),
          );
          setShowErrorModal(true);
        }
      })
      .catch(error => setErrorText(error));
  };
  const handleCompleteTicket = () => {
    dispatch(
      completeTicketAction({
        action: 'complete_ticket',
        APIKEY: apiKey,
        emp_code: employeeCode,
        emp_name: empName,
        amc_ticket: ticketType,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    )
      .unwrap()
      .then(response => {
        if (response.status == 'Failed') {
          setErrorText(response.api_message);
          setShowErrorModal(true);
        } else {
          setErrorText('JOB COMPLETED SUCCESSFULLY');
          // ⬇️ Refresh slots to reflect completed status
          dispatch(
            getServiceSlots({
              action: 'get_slot_details_services',
              amc_ticket: ticketType,
              amc_tkt_id: ticketDetails?.ticket_id,
              APIKEY: apiKey,
              emp_code: employeeCode,
              visit_date: visitDate,
            }),
          );
          setShowErrorModal(true);
        }
      })
      .catch(error => setErrorText(error));
  };
  const getIconName = (item: any) => {
    if (
      item?.ticket_service_status === serviceStatusTypes.completed &&
      !isticketCompleted &&
      !isExtended &&
      !isBackdated(visitDate)
    )
      return 'refresh';

    if (item?.ticket_service_status === serviceStatusTypes.start) {
      return 'check-circle-outline';
    }
    if (
      item?.ticket_service_status === serviceStatusTypes.pending &&
      !isBackdated(visitDate) &&
      !isExtended
    )
      return 'play-circle-outline';
    else return null;
  };
  const getBackground = (item: any) => {
    if (
      item?.ticket_service_status === serviceStatusTypes.completed &&
      !isticketCompleted &&
      !isExtended &&
      !isBackdated(visitDate)
    )
      return colors.blue;

    if (item?.ticket_service_status === serviceStatusTypes.start) {
      return colors.green;
    }
    if (
      item?.ticket_service_status === serviceStatusTypes.pending &&
      !isBackdated(visitDate) &&
      !isExtended
    )
      return colors.startBlue;
    else return;
  };
  const getSuccessMessage = () => {
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.pending) {
      return 'JOB STARTED SUCCESSFULLY';
    }
    if (
      jobStartItem?.ticket_service_status === serviceStatusTypes.start &&
      completePressed
    ) {
      return 'JOB COMPLETED SUCCESSFULLY';
    }
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.completed) {
      return 'JOB RESTARTED SUCCESSFULLY';
    }
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.start)
      return 'JOB STOPPED SUCCESSFULLY';
    return '';
  };

  const handleChange = (text: string) => {
    // If user starts typing for first time, clear the old text
    if (!cleared && text.length === 1) {
      setCleared(true);
      setDescription(text); // keeps only the first typed letter
    } else {
      setDescription(text);
    }
  };
  const handleAudioRecorded = path => {
    console.log('Received audio path:', path);
    setAudioPath(path);
  };
  return (
    <View style={styles.container}>
      <Header isHome={false} isService />
      <ScrollView
        style={{marginTop: 20}}
        contentContainerStyle={{paddingBottom: 20}}>
        <HeaderBar
          title="SERVICE DETAILS/JOB CARD"
          Styles={[styles.headerText, {fontSize: scaleFont(12)}]}
          isAssetDetails
        />
        <View style={{marginHorizontal: 10}}>
          <View style={styles.header}>
            <Text
              style={[
                styles.headerText,
                {marginLeft: 0},
              ]}>{`Work Order No:${ticketDetails?.ticket_ref_code}`}</Text>
            <ImageBackground
              style={styles.flag}
              source={require('../../assets/images/3.0x/thoranam.png')}
              tintColor={
                ticketDetails?.ticket_priority == 'Normal'
                  ? colors.blue
                  : colors.eRed
              }>
              <Text style={styles.flagText}>
                {ticketDetails?.ticket_priority == 'Normal' ? 'N' : 'E'}
              </Text>
            </ImageBackground>
            <TouchableOpacity onPress={() => setShowCustomerModal(true)}>
              <MaterialIcons
                name="info-outline"
                size={30}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: colors.primary,
              borderBottomRightRadius: 20,
            }}>
            <Text
              style={
                styles.assetCode
              }>{`Asset Code:${ticketDetails?.asset_code}`}</Text>
            {/* <LoadingOverlay visible={loading} /> */}
            {serviceTypes?.data?.map((item: any, index: number) => {
              // console.log('knkkmkm', item.ticket_service_status);
              const isStarted =
                item.ticket_service_status == serviceStatusTypes.start;
              const isStopped =
                item.ticket_service_status == serviceStatusTypes.stop;
              const isPending =
                item.ticket_service_status == serviceStatusTypes.pending;
              const isCompleted =
                item.ticket_service_status == serviceStatusTypes.completed;
              const isCancelled =
                item.ticket_service_status == serviceStatusTypes.cancelled;

              return (
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        selectedService == index ? colors.red : colors.white,
                    },
                  ]}
                  key={index}
                  onPress={() => handleServiceStatus(item, index)}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View
                      style={{
                        width: 15,
                        height: 40,
                        backgroundColor: isCancelled
                          ? colors.red
                          : isCompleted
                          ? colors.green
                          : isStarted && selectedService == index
                          ? colors.blue
                          : colors.transparent,
                        marginRight: 5,
                      }}
                    />
                    <Text
                      style={[
                        styles.serviceTypes,
                        {
                          color:
                            selectedService == index
                              ? colors.white
                              : colors.black,
                        },
                      ]}>{`${index + 1} - ${item.service_description}`}</Text>
                  </View>

                  {selectedService == index && (
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      {item.ticket_service_status == serviceStatusTypes.start &&
                        !isBackdated(visitDate) &&
                        !isExtended && (
                          <TouchableOpacity
                            style={[
                              styles.playButton,
                              {backgroundColor: colors.orange, marginRight: 5},
                            ]}
                            onPress={() => {
                              // setCompletePressed(false)
                              setShowConfirmModal(true);
                              setJobStartItem(item);
                              setJobStartIndex(index);
                            }}>
                            <MaterialIcons
                              name="stop-circle"
                              color={colors.white}
                              size={25}
                            />
                          </TouchableOpacity>
                        )}

                      <TouchableOpacity
                        style={[
                          styles.playButton,
                          {
                            backgroundColor: getBackground(item),
                          },
                        ]}
                        onPress={() => {
                          if (
                            item.ticket_service_status ==
                            serviceStatusTypes.start
                          ) {
                            setJobStartItem(item);
                            setJobStartIndex(index);
                            setCompletePressed(true);
                            handleJobComplete(item);
                          } else {
                            setShowConfirmModal(true);
                            setJobStartItem(item);
                            setJobStartIndex(index);
                          }
                        }}>
                        <MaterialIcons
                          name={getIconName(item)}
                          color={colors.white}
                          size={25}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={styles.dateContainer}>
              <Text style={styles.detailText}>{`DATE : ${moment(
                visitDate,
              ).format('DD-MM-YYYY')}`}</Text>
              <View style={{flexDirection: 'row', width: '100%'}}>
                {slotNumbers.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dateView,
                      {
                        borderColor: activeSlots == item ? colors.white : '',
                        borderWidth: activeSlots == item ? 2 : 0,
                        backgroundColor:
                          activeSlots == item ? colors.primary : colors.red,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.detailText,
                        {
                          width: '100%',
                          fontSize: scaleFont(22),
                          textAlign: 'center',
                        },
                      ]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.headerView}>
              <Text style={[styles.headerText, {width: '30%'}]}>
                DESCRIPTION
              </Text>
              <Text style={[styles.headerText, styles.typeContainer]}>
                {`TYPE-${ticketDetails?.type_name}`}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.white,
                marginHorizontal: 10,
                borderBottomRightRadius: 10,
              }}>
              <LoadingOverlay visible={serviceStatusLoading || loading} />
              {/* {serviceStatusLoading && (
                <Loader />
               ) } */}

              <TextInput
                ref={inputRef}
                style={{
                  height: 100,
                  fontFamily: FontFamily.deupRegular,
                  marginLeft: 10,
                  fontSize: scaleFont(20),
                }}
                value={description}
                onChangeText={handleChange}
                // onFocus={() => {
                //   inputRef.current?.setNativeProps({
                //     selection: {start: 0, end: 0},
                //   });
                // }}
              />

              <AudioPlayerUI
                track={serviceStatusData?.data[0]?.tech_audio_file}
                isLocal={serviceStatusData?.data[0] ? false : true}
                isAssets={false}
                onAudioRecorded={handleAudioRecorded}
              />
            </View>
            <PickerImage
              serviceImages={serviceImages}
              ticketDetails={ticketDetails}
            />

            {!isBackdated(visitDate) && !isExtended && !isticketCompleted && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleExtendTicket()}>
                  <Text style={styles.completeText}>EXTEND</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!allCompleted}
                  style={[
                    styles.completeButton,
                    {
                      backgroundColor: allCompleted
                        ? colors.green
                        : colors.grey,
                    },
                  ]}
                  onPress={() => handleCompleteTicket()}>
                  <Text style={styles.completeText}>COMPLETE</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {showCustomerModal && (
        <CustomerModal
          visible={showCustomerModal}
          toggle={() => setShowCustomerModal(false)}
          details={ticketDetails}
        />
      )}
      {showConfirmModal && (
        <ConfirmModal
          visible={showConfirmModal}
          toggle={() => setShowConfirmModal(false)}
          errorText={
            jobStartItem?.ticket_service_status === serviceStatusTypes.start
              ? 'Are you sure need to stop this service?'
              : jobStartItem?.ticket_service_status ===
                serviceStatusTypes.completed
              ? 'Are you sure need to undo this service ?'
              : 'Are you sure need to start this service?'
          }
          onConfirm={() => {
            if (
              jobStartItem?.ticket_service_status === serviceStatusTypes.start
            )
              handleJobPause();
            else if (
              jobStartItem?.ticket_service_status ===
              serviceStatusTypes.completed
            ) {
              handleJobRestart();
            } else {
              handleJobAction();
            }
          }}
        />
      )}
      {showErrorModal && (
        <ErrorModal
          visible={showErrorModal}
          toggle={() => {
            setShowErrorModal(false);
            setCompletePressed(false);
            setErrorText('');
            // dispatch(res)
          }}
          errorText={errorText !== '' ? errorText : getSuccessMessage()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  headerView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  details: {
    paddingTop: 0,
    padding: 15,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
  },
  detailText: {
    fontFamily: FontFamily.deupRegular,
    color: colors.white,
    fontSize: scaleFont(14),
    width: '30%',
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
    top: 3,
    left: 9,
  },
  flag: {
    height: 60,
    width: 35,
    marginTop: 20, // Pushes it upward to "flow down" over the header
    left: 50,
    zIndex: 10,
  },
  assetCode: {
    backgroundColor: colors.primary,
    textAlign: 'center',
    color: colors.white,
    marginTop: 15,
  },
  button: {
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: colors.white,
    margin: 5,
    marginHorizontal: 10,
  },
  dateContainer: {
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
  },
  dateView: {
    height: 35,
    width: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  typeContainer: {
    backgroundColor: colors.red,
    width: '60%',
    paddingVertical: 8,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    textAlign: 'center',
  },
  imagePicker: {
    height: 40,
    width: 40,
    marginTop: 10,
  },
  serviceTypes: {
    color: colors.black,
    fontSize: scaleFont(16),
    fontFamily: FontFamily.deupRegular,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: colors.orange,
    margin: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  completeText: {
    color: colors.white,
    fontFamily: FontFamily.medium,
    fontSize: scaleFont(18),
  },
  playButton: {
    backgroundColor: '#00BCD4',
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 3,
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
