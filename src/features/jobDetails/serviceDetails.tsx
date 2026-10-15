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
} from '../../store/reducers/serviceReducers/serviceDetailsReducer';
import moment from 'moment';
import {getServiceImages} from '../../store/reducers/serviceReducers/getserviceImages';
import {PickerImage} from './components/imagePicker';
import {MaterialRequisitionModal} from './components/materialRequisitionModal';
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
import {useToast} from 'react-native-toast-notifications';
import {useFocusEffect} from '@react-navigation/native';
import {scaleFont} from '../../utils/helper';
import {navigate} from '../../navigators';

export const ServiceDetails = () => {
  const {data} = useAppSelector(state => state.tickets) || {};
  const {activeSlots, visitDate} = useAppSelector(state => state.slots);

  const {loading} = useAppSelector(state => state.service);
  const {apiKey, employeeCode, employeeId, empName} = useAppSelector(state => state.app);
  const ticketDetails = data?.data[0];
  const {ticketType} = useAppSelector(state => state.tickets);
  const {
    serviceStatusData,
    serviceStatusLoading,
    serviceSlotsData,
  } = useAppSelector(state => state.service);
  const serviceTypes = useAppSelector(state => state.service.data);
  const {startJobStatus, startJobError, startJobLoading} = useAppSelector(
    state => state.startJob,
  );
  const {stopJobStatus, stopJobError, stopJobLoading} = useAppSelector(
    state => state.stopJob,
  );
  const {restartJobStatus, restartJobError, restartJobLoading} = useAppSelector(
    state => state.restartJob,
  );
  const {completeJobStatus, completeJobError, completeJobLoading} =
    useAppSelector(state => state.completeJob);
  const {serviceImages} = useAppSelector(state => state.serviceImages);
  const profileData = useAppSelector(state => (state.profile as any)?.data);
  const teamList = useAppSelector(state => (state.team as any)?.data?.data || (state.team as any)?.data || []);
  const currentTeamMember = Array.isArray(teamList)
    ? teamList.find((m: any) => m?.employee_code?.toString() === employeeCode?.toString())
    : null;

  const effectiveEmpId =
    employeeId ||
    currentTeamMember?.employee_id ||
    currentTeamMember?.ticket_team_ids ||
    profileData?.data?.[0]?.employee_id ||
    profileData?.employee_id ||
    '';

  const effectiveEmpCode =
    employeeCode ||
    currentTeamMember?.employee_code ||
    profileData?.data?.[0]?.employee_code ||
    profileData?.employee_code ||
    '';

  const effectiveEmpName =
    empName ||
    currentTeamMember?.employee_name ||
    profileData?.data?.[0]?.employee_name ||
    profileData?.data?.employee_name ||
    profileData?.employee_name ||
    '';
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [isTicketCompletedSuccess, setIsTicketCompletedSuccess] = useState(false);
  const [jobStartItem, setJobStartItem] = useState<any>(null);
  const [completePressed, setCompletePressed] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [description, setDescription] = useState('');
  const [audioPath, setAudioPath] = useState('');
  const [cleared, setCleared] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const handleAudioRecorded = (path: string) => {
    console.log('[serviceDetails] Audio recorded at path:', path);
    setAudioPath(path);
  };

  const slots = serviceSlotsData?.data?.[0];
  const startSlot = parseInt(slots?.start_slot || '1');
  const slotCount = parseInt(slots?.additional_slots || '0');
  const isExtended = slots?.amc_visit_status === 'Extended';
  const isticketCompleted =
    slots?.amc_visit_status === 'Completed' ||
    ticketDetails?.ticket_status === 'Completed' ||
    ticketDetails?.amc_visit_status === 'Completed';

  const hasPhotos =
    (serviceImages?.data && serviceImages.data.length > 0) ||
    (Array.isArray(serviceImages) && serviceImages.length > 0);

  const allServicesCompleted =
    Boolean(serviceTypes?.data &&
    serviceTypes.data.length > 0 &&
    serviceTypes.data.every(
      (item: any) => item.ticket_service_status === serviceStatusTypes.completed,
    ));

  const allCompleted = Boolean(allServicesCompleted && hasPhotos);

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
      const item = serviceStatusData.data[0];
      const remark = item?.tech_remarks || '';
      setDescription(remark);
      setCleared(false);
      const remoteAudio = item?.tech_audio_file || item?.tech_audio || '';
      console.log('[ServiceDetails] Loaded audio from server:', remoteAudio);
      setAudioPath(remoteAudio);
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
    }, [ticketType, ticketDetails?.ticket_id, apiKey, employeeCode, visitDate]),
  );

  // Auto-select first service item when serviceTypes data loads or updates
  useEffect(() => {
    if (serviceTypes?.data?.length > 0) {
      const idx =
        selectedService !== null && selectedService < serviceTypes.data.length
          ? selectedService
          : 0;
      setSelectedService(idx);
      const currentItem = serviceTypes.data[idx];
      if (currentItem?.ticket_service_id) {
        dispatch(
          getServiceStatusDetails({
            action: 'get_service_status_details',
            visit_date: visitDate,
            amc_ticket: ticketType,
            amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
            amc_tkt_id: ticketDetails?.ticket_id,
            APIKEY: apiKey,
            emp_code: employeeCode,
            ticket_service_id: currentItem.ticket_service_id,
          }),
        );
      }
    }
  }, [serviceTypes?.data]);

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
      const errMsg =
        startJobError ||
        stopJobError ||
        completeJobError ||
        restartJobError ||
        'Failed to perform service action';
      toast.show(errMsg, {type: 'danger'});
      dispatch(resetStatus());
      dispatch(resetCompleteStatus());
      dispatch(resetStopStatus());
      dispatch(resetRestartStatus());
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
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    );
    setShowConfirmModal(false);
  };

  const handleJobPause = () => {
    dispatch(
      pauseJob({
        action: 'service_stop',
        amc_ticket: ticketType,
        ticket_service_id: jobStartItem?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    );
    setShowConfirmModal(false);
  };

  const handleJobComplete = (item: any) => {
    dispatch(
      completeJob({
        action: 'service_complete',
        amc_ticket: ticketType,
        ticket_service_id: item?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        tech_audio: audioPath,
        tech_remarks: description,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    );
  };

  const handleJobRestart = () => {
    const formattedDate = visitDate
      ? moment(visitDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    dispatch(
      restartJob({
        action: 'undo_service_after_complete_close',
        amc_ticket: ticketType,
        ticket_service_id: jobStartItem?.ticket_service_id,
        APIKEY: apiKey,
        emp_code: employeeCode,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: formattedDate,
        date: formattedDate,
      }),
    );
    setShowConfirmModal(false);
  };

  const handleExtendTicket = () => {
    setIsTicketCompletedSuccess(false);
    dispatch(
      extendTicketAction({
        action: 'extend_ticket',
        APIKEY: apiKey,
        emp_id: effectiveEmpId,
        emp_code: effectiveEmpCode,
        emp_name: effectiveEmpName,
        amc_ticket: ticketType,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    )
      .unwrap()
      .then(response => {
        setIsTicketCompletedSuccess(false);
        if (response?.status === 'Failed' || response === 0 || response === '0') {
          setErrorText(response?.api_message || 'Failed to extend job');
          setShowErrorModal(true);
        } else {
          setErrorText('JOB EXTENDED SUCCESSFULLY');
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
      .catch(error => {
        setIsTicketCompletedSuccess(false);
        const msg = typeof error === 'string' ? error : error?.message || 'Failed to extend job';
        setErrorText(msg);
        setShowErrorModal(true);
      });
  };

  const handleCompleteTicket = () => {
    if (!allCompleted) {
      if (!serviceImages?.data?.length) {
        toast.show('Please attach at least one photo before completing the job.', {
          type: 'danger',
        });
      } else {
        toast.show('Please complete all services above before completing the job.', {
          type: 'danger',
        });
      }
      return;
    }

    console.log('========================================');
    console.log('[COMPLETE JOB] Submitting with params:');
    console.log('emp_id:', effectiveEmpId);
    console.log('emp_code:', effectiveEmpCode);
    console.log('emp_name:', effectiveEmpName);
    console.log('amc_tkt_id:', ticketDetails?.ticket_id);
    console.log('amc_ticket_ref_no:', ticketDetails?.ticket_ref_code);
    console.log('visit_date:', visitDate);
    console.log('========================================');

    dispatch(
      completeTicketAction({
        action: 'complete_ticket',
        APIKEY: apiKey,
        emp_id: effectiveEmpId,
        emp_code: effectiveEmpCode,
        emp_name: effectiveEmpName,
        amc_ticket: ticketType,
        amc_tkt_id: ticketDetails?.ticket_id,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        visit_date: visitDate,
      }),
    )
      .unwrap()
      .then(response => {
        if (response.status === 'Failed') {
          setIsTicketCompletedSuccess(false);
          setErrorText(response.api_message || 'Failed to complete job');
          setShowErrorModal(true);
        } else {
          setIsTicketCompletedSuccess(true);
          setErrorText('JOB COMPLETED SUCCESSFULLY');
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
      .catch(error => {
        setIsTicketCompletedSuccess(false);
        const msg = typeof error === 'string' ? error : error?.message || 'Failed to complete job';
        setErrorText(msg);
        setShowErrorModal(true);
      });
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
      return 'check-circle';
    }
    if (
      item?.ticket_service_status === serviceStatusTypes.pending &&
      !isBackdated(visitDate) &&
      !isExtended
    )
      return 'play-arrow';
    else return 'info';
  };

  const getBackground = (item: any) => {
    if (
      item?.ticket_service_status === serviceStatusTypes.completed &&
      !isticketCompleted &&
      !isExtended &&
      !isBackdated(visitDate)
    )
      return colors.primary;

    if (item?.ticket_service_status === serviceStatusTypes.start) {
      return '#15803D';
    }
    if (
      item?.ticket_service_status === serviceStatusTypes.pending &&
      !isBackdated(visitDate) &&
      !isExtended
    )
      return colors.primary;
    else return colors.grey;
  };

  const getSuccessMessage = () => {
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.pending) {
      return 'SERVICE STARTED SUCCESSFULLY';
    }
    if (
      jobStartItem?.ticket_service_status === serviceStatusTypes.start &&
      completePressed
    ) {
      return 'SERVICE COMPLETED SUCCESSFULLY';
    }
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.completed) {
      return 'SERVICE RESTARTED SUCCESSFULLY';
    }
    if (jobStartItem?.ticket_service_status === serviceStatusTypes.start)
      return 'SERVICE STOPPED SUCCESSFULLY';
    return '';
  };

  const handleChange = (text: string) => {
    if (!cleared && text.length === 1) {
      setCleared(true);
      setDescription(text);
    } else {
      setDescription(text);
    }
  };

  const isEmergency = ticketDetails?.ticket_priority !== 'Normal';

  return (
    <View style={styles.container}>
      <Header isHome={false} isService />
      <LoadingOverlay
        visible={
          loading ||
          startJobLoading ||
          stopJobLoading ||
          restartJobLoading ||
          completeJobLoading
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderBar title="SERVICE DETAILS & JOB CARD" />

        {/* Work Order Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.woSubTitle}>WORK ORDER</Text>
              <Text style={styles.woRefText}>
                #{ticketDetails?.ticket_ref_code ? `${ticketDetails.ticket_ref_code}-${ticketDetails.ticket_id}` : '---'}
              </Text>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View
                style={[
                  styles.priorityBadge,
                  {backgroundColor: isEmergency ? '#FEE2E2' : '#DBEAFE'},
                ]}>
                <Text
                  style={[
                    styles.priorityText,
                    {color: isEmergency ? colors.red : colors.primary},
                  ]}>
                  {isEmergency ? 'EMERGENCY' : 'NORMAL'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.infoIconBtn}
                onPress={() => setShowCustomerModal(true)}>
                <MaterialIcons name="info" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.assetBadgeRow}>
            <MaterialIcons name="qr-code" size={14} color={colors.secondary} />
            <Text style={styles.assetBadgeText}>
              ASSET CODE: {ticketDetails?.asset_code || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Service Tasks Checklist Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Checklist Services ({serviceTypes?.data?.length || 0})</Text>
          <Text style={styles.sectionSubtitle}>
            Select a service to start, pause, or update task details
          </Text>

          {serviceTypes?.data?.map((item: any, index: number) => {
            const isSelected = selectedService === index;
            const isStarted = item.ticket_service_status === serviceStatusTypes.start;
            const isCompleted = item.ticket_service_status === serviceStatusTypes.completed;
            const isCancelled = item.ticket_service_status === serviceStatusTypes.cancelled;

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.85}
                style={[
                  styles.serviceItemCard,
                  isSelected && styles.selectedServiceCard,
                ]}
                onPress={() => handleServiceStatus(item, index)}>
                <View style={styles.serviceItemHeader}>
                  <View style={styles.serviceTitleRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isCancelled
                            ? colors.red
                            : isCompleted
                            ? '#15803D'
                            : isStarted
                            ? colors.primary
                            : colors.grey,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.serviceTitleText,
                        isSelected && styles.selectedServiceTitleText,
                      ]}>
                      {`${index + 1}. ${item.service_description}`}
                    </Text>
                  </View>

                  {isSelected && !isticketCompleted && !isBackdated(visitDate) && !isExtended && (
                    <View style={styles.serviceActionRow}>
                      {isStarted && (
                        <TouchableOpacity
                          style={styles.stopActionBtn}
                          onPress={() => {
                            setShowConfirmModal(true);
                            setJobStartItem(item);
                          }}>
                          <MaterialIcons name="pause" color={colors.white} size={18} />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.playActionBtn,
                          {backgroundColor: getBackground(item)},
                        ]}
                        onPress={() => {
                          if (isStarted) {
                            setJobStartItem(item);
                            setCompletePressed(true);
                            handleJobComplete(item);
                          } else {
                            setShowConfirmModal(true);
                            setJobStartItem(item);
                          }
                        }}>
                        <MaterialIcons
                          name={getIconName(item)}
                          color={colors.white}
                          size={18}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date & Time Slot Allocation Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Visit Date & Assigned Slots</Text>
          <Text style={styles.dateLabel}>
            DATE: <Text style={styles.dateValue}>{moment(visitDate).format('DD-MM-YYYY')}</Text>
          </Text>

          <View style={styles.slotsRow}>
            {slotNumbers.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.slotBadge,
                  activeSlots === item && styles.activeSlotBadge,
                ]}>
                <Text
                  style={[
                    styles.slotBadgeText,
                    activeSlots === item && styles.activeSlotBadgeText,
                  ]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Technician Remarks & Voice Note Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="edit-note" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Technician Remarks & Audio</Text>
          </View>

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>TYPE: {ticketDetails?.type_name || 'N/A'}</Text>
          </View>

          <TextInput
            ref={inputRef}
            editable={!isticketCompleted && !isBackdated(visitDate)}
            placeholder={
              isticketCompleted
                ? 'Job completed - remarks locked'
                : 'Type technician remarks here...'
            }
            placeholderTextColor={colors.grey}
            style={[
              styles.remarksInput,
              (isticketCompleted || isBackdated(visitDate)) && styles.disabledInput,
            ]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={handleChange}
          />

          <AudioPlayerUI
            track={
              audioPath ||
              serviceStatusData?.data?.[0]?.tech_audio_file ||
              serviceStatusData?.data?.[0]?.tech_audio
            }
            isLocal={!serviceStatusData?.data?.[0] && Boolean(audioPath?.startsWith('file://'))}
            isAssets={isticketCompleted || isBackdated(visitDate)}
            onAudioRecorded={handleAudioRecorded}
          />
        </View>

        {/* Image Attachment Picker */}
        <PickerImage
          serviceImages={serviceImages}
          ticketDetails={ticketDetails}
        />

        {/* Material Requisition Section Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="inventory-2" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Material Requisition</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Request spare components, materials, or replacement parts for this work order.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowRequisitionModal(true)}
            style={styles.requisitionBtn}>
            <MaterialIcons name="add-shopping-cart" size={18} color={colors.white} style={{marginRight: 8}} />
            <Text style={styles.requisitionBtnText}>REQUEST MATERIALS / PARTS</Text>
          </TouchableOpacity>
        </View>

        {/* Complete & Extend Ticket Actions */}
        {isticketCompleted ? (
          <View style={styles.bottomButtonRow}>
            <TouchableOpacity
              disabled={true}
              activeOpacity={1}
              style={[styles.extendBtn, styles.disabledExtendBtn]}>
              <MaterialIcons name="update" size={18} color={colors.grey} />
              <Text style={[styles.extendBtnText, {color: colors.grey}]}>EXTEND</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={true}
              activeOpacity={1}
              style={[styles.completeBtn, styles.completedBannerBtn]}>
              <MaterialIcons name="check-circle" size={18} color={colors.white} />
              <Text style={styles.completeBtnText}>JOB COMPLETED</Text>
            </TouchableOpacity>
          </View>
        ) : !isBackdated(visitDate) && !isExtended ? (
          <View style={styles.bottomButtonRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.extendBtn}
              onPress={handleExtendTicket}>
              <MaterialIcons name="update" size={18} color={colors.primary} />
              <Text style={styles.extendBtnText}>EXTEND</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.completeBtn,
                !allCompleted && styles.disabledCompleteBtn,
              ]}
              onPress={handleCompleteTicket}>
              <MaterialIcons name="check-circle" size={18} color={colors.white} />
              <Text style={styles.completeBtnText}>COMPLETE JOB</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
              ? 'Are you sure you need to pause this service?'
              : jobStartItem?.ticket_service_status ===
                serviceStatusTypes.completed
              ? 'Are you sure you need to undo this completed service?'
              : 'Are you sure you need to start this service?'
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
            const shouldNavigate = isTicketCompletedSuccess;
            setShowErrorModal(false);
            setCompletePressed(false);
            setIsTicketCompletedSuccess(false);
            setErrorText('');
            if (shouldNavigate) {
              navigate('ScheduleCalendar');
            }
          }}
          errorText={errorText !== '' ? errorText : getSuccessMessage()}
        />
      )}
      {showRequisitionModal && (
        <MaterialRequisitionModal
          visible={showRequisitionModal}
          onClose={() => setShowRequisitionModal(false)}
          ticketDetails={ticketDetails}
          effectiveEmpId={effectiveEmpId}
        />
      )}
    </View>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  woSubTitle: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  woRefText: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginTop: 2,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  priorityText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
  },
  infoIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  assetBadgeText: {
    color: colors.white,
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  sectionSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 12,
  },
  serviceItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedServiceCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  serviceTitleText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    flex: 1,
  },
  selectedServiceTitleText: {
    color: colors.white,
  },
  serviceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  stopActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  playActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 10,
  },
  dateValue: {
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  activeSlotBadge: {
    backgroundColor: colors.primary,
  },
  slotBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  activeSlotBadgeText: {
    color: colors.white,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  remarksInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.header,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 12,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  extendBtn: {
    flex: 1,
    backgroundColor: colors.white,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  extendBtnText: {
    color: colors.primary,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    marginLeft: 6,
  },
  completeBtn: {
    flex: 1.5,
    backgroundColor: '#15803D',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#15803D',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  disabledCompleteBtn: {
    backgroundColor: colors.grey,
    opacity: 0.6,
    elevation: 0,
  },
  completeBtnText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: colors.grey,
  },
  disabledExtendBtn: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  completedBannerBtn: {
    backgroundColor: '#15803D',
    opacity: 0.85,
  },
  requisitionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  requisitionBtnText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
});
