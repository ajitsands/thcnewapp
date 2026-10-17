import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Header} from '../../core/components/header';
import colors from '../../themes/colors';
import {FontFamily} from '../../themes/fonts';
import {scaleFont} from '../../utils/helper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {
  getChecklistItems,
  uploadExecutionPhoto,
  submitChecklistExecution,
  resetSubmitState,
  getExecutionPoints,
} from '../../store/reducers/janitorExecutionReducer';
import {getScheduleSlots} from '../../store/reducers/getSlots';
import {
  evaluateSlotTiming,
  formatLateDuration,
  SlotRuleInfo,
  getCurrentLocation,
  calculateDistanceMeters,
} from '../../utils/geoHelper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useToast} from 'react-native-toast-notifications';
import {launchCamera} from 'react-native-image-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppAlertModal, {AppAlertProps} from '../../core/components/AppAlertModal';

interface ChecklistItemState {
  item_id: string | number;
  item_description: string;
  is_completed: 'Yes' | 'No';
  remarks: string;
  photo_url?: string;
}

export const JanitorChecklistScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {
    assignment,
    checklistId,
    assignmentId,
    slotsDetail,
    selectedDate,
    verifiedDistance,
    scanLat,
    scanLng,
    assetLat,
    assetLng,
    settings: routeSettings,
  } = route.params || {};

  const {checklistLoading, checklistData, submitLoading, submitSuccess, submitError, settings: reduxSettings} =
    useAppSelector(state => state.janitorExecution);
  const {apiKey, employeeCode, employeeId} = useAppSelector(state => state.app);

  const activeSettings = routeSettings || reduxSettings || {};
  const lateThresholdMinutes =
    Number(activeSettings?.late_time_minutes) >= 0
      ? Number(activeSettings.late_time_minutes)
      : 15;

  // Date restriction evaluation: Only current date tasks can be executed / submitted
  const todayDate = moment().format('YYYY-MM-DD');
  const taskDate = selectedDate
    ? (moment(selectedDate, ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601], true).isValid()
        ? moment(selectedDate, ['YYYY-MM-DD', 'MMMM DD, YYYY', 'YYYY/MM/DD', moment.ISO_8601], true).format('YYYY-MM-DD')
        : moment(selectedDate).format('YYYY-MM-DD'))
    : todayDate;

  const isToday = taskDate === todayDate;
  const isPast = taskDate < todayDate;
  const isFuture = taskDate > todayDate;

  // Parse Slots
  let rawParsedSlots: any[] = [];
  try {
    if (typeof slotsDetail === 'string') {
      if (slotsDetail.trim().startsWith('[')) {
        rawParsedSlots = JSON.parse(slotsDetail);
      } else {
        rawParsedSlots = slotsDetail
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => ({name: s, slot_name: s, slot_time: s, has_rule: 1}));
      }
    } else if (Array.isArray(slotsDetail)) {
      rawParsedSlots = slotsDetail;
    } else if (Array.isArray(assignment?.slots_list)) {
      rawParsedSlots = assignment.slots_list;
    } else if (typeof assignment?.slots === 'string') {
      rawParsedSlots = assignment.slots
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => ({name: s, slot_name: s, slot_time: s, has_rule: 1}));
    }
  } catch (e) {
    rawParsedSlots = [];
  }
  if (!rawParsedSlots || rawParsedSlots.length === 0) {
    rawParsedSlots = [
      {name: 'Slot 1', slot_name: 'Slot 1', slot_time: 'Slot 1', start_time: '08:00', end_time: '12:00', has_rule: 1},
    ];
  }

  // Assign standard windows to EVERY slot so all slots have explicit timing rules
  const totalSlotsCount = rawParsedSlots.length;
  const parsedSlots = rawParsedSlots.map((s: any, idx: number) => {
    let sStart = s.start_time;
    let sEnd = s.end_time;
    if (!sStart || !sEnd || sEnd === '0' || sEnd === 'No Rule') {
      if (totalSlotsCount === 1) {
        sStart = '08:00';
        sEnd = '18:00';
      } else if (totalSlotsCount === 2) {
        sStart = idx === 0 ? '08:00' : '14:00';
        sEnd = idx === 0 ? '14:00' : '20:00';
      } else if (totalSlotsCount === 3) {
        sStart = idx === 0 ? '08:00' : idx === 1 ? '12:00' : '16:00';
        sEnd = idx === 0 ? '12:00' : idx === 1 ? '16:00' : '20:00';
      } else {
        const startH = 8 + idx * 2;
        const endH = startH + 2;
        sStart = `${String(Math.min(22, startH)).padStart(2, '0')}:00`;
        sEnd = `${String(Math.min(23, endH)).padStart(2, '0')}:00`;
      }
    }
    return {
      ...s,
      start_time: sStart,
      end_time: sEnd,
      has_rule: 1,
    };
  });

  // Helper to extract a consistent slot key
  const getSlotKey = (s: any, idx: number) => {
    return String(s?.name || s?.slot_name || s?.slot_time || `Slot ${idx + 1}`).trim();
  };

  const getStorageKey = (sKey: string) => {
    const aId = assignmentId || assignment?.assignment_id || assignment?.id || '0';
    const dt = selectedDate || moment().format('YYYY-MM-DD');
    return `@thc_janitor_slot_points_${aId}_${dt}_${sKey}`;
  };

  // Active Selected Slot
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const activeSlot: any = parsedSlots[selectedSlotIndex] || parsedSlots[0] || {
    name: 'Slot 1',
    start_time: '08:00',
    end_time: '12:00',
    has_rule: 1,
  };

  const activeSlotKey = getSlotKey(activeSlot, selectedSlotIndex);

  // Evaluate timing for current slot with server threshold
  const slotTiming = evaluateSlotTiming(activeSlot, selectedDate, lateThresholdMinutes);

  // Per-Slot Checklist Items State: key is slotKey -> { [item_id]: ChecklistItemState }
  const [slotStates, setSlotStates] = useState<Record<string, Record<string, ChecklistItemState>>>({});
  // Per-Slot Execution Metadata: key is slotKey -> { execution_id, status, remarks, executed_at }
  const [slotExecutions, setSlotExecutions] = useState<Record<string, any>>({});

  const [generalRemarks, setGeneralRemarks] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState<string | number | null>(null);
  const [customAlert, setCustomAlert] = useState<AppAlertProps | null>(null);

  const showCustomAlert = (config: Omit<AppAlertProps, 'visible'>) => {
    setCustomAlert({
      ...config,
      visible: true,
      onClose: () => setCustomAlert(null),
    });
  };

  const currentSlotItems = slotStates[activeSlotKey] || {};
  const activeSlotExecution = slotExecutions[activeSlotKey] || null;
  const isSlotExecuted = Boolean(
    activeSlotExecution?.execution_id ||
    activeSlot?.is_completed === 'Yes' ||
    (activeSlot?.execution_status && activeSlot.execution_status !== 'Pending')
  );
  const isExecutionPartial = Boolean(
    activeSlotExecution?.status?.toLowerCase().includes('partial') ||
    activeSlot?.execution_status?.toLowerCase().includes('partial')
  );
  const isLateStatus = Boolean(
    activeSlotExecution?.status?.toLowerCase().includes('late') ||
    activeSlot?.execution_status?.toLowerCase().includes('late')
  );
  const isEffectivelyLate = isLateStatus || (isSlotExecuted && slotTiming.isLate) || (!isSlotExecuted && slotTiming.isLate);
  const lateDelayFormatted = formatLateDuration(slotTiming.delayMinutes);

  const persistSlotPointsLocally = async (slotKey: string, pointsMap: Record<string, ChecklistItemState>) => {
    try {
      await AsyncStorage.setItem(getStorageKey(slotKey), JSON.stringify(pointsMap));
    } catch (e) {
      console.log('[persistSlotPointsLocally] Error:', e);
    }
  };

  // Fetch checklist items and saved executions on mount
  useEffect(() => {
    dispatch(
      getChecklistItems({
        checklist_id: checklistId || assignment?.checklist_id,
        assignment_id: assignmentId || assignment?.assignment_id,
        date: selectedDate || moment().format('YYYY-MM-DD'),
      }),
    );
  }, [checklistId, assignmentId, assignment?.checklist_id, assignment?.assignment_id, selectedDate, dispatch]);

  // Active Slot Point Loader: whenever selectedSlotIndex changes, restore points
  useEffect(() => {
    if (!activeSlotKey) return;
    (async () => {
      // 1. Check server points from executions_by_slot
      const executionsBySlot = checklistData?.executions_by_slot || {};
      const exec = executionsBySlot[activeSlotKey];
      if (exec?.points && Object.keys(exec.points).length > 0) {
        setSlotStates(prev => ({
          ...prev,
          [activeSlotKey]: exec.points,
        }));
        return;
      }

      // 2. Check AsyncStorage for local cached points
      try {
        const raw = await AsyncStorage.getItem(getStorageKey(activeSlotKey));
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached && Object.keys(cached).length > 0) {
            setSlotStates(prev => ({
              ...prev,
              [activeSlotKey]: cached,
            }));
            return;
          }
        }
      } catch (e) {}

      // 3. Fallback: if slot was executed on server, fetch directly via execution_id
      const s: any = parsedSlots[selectedSlotIndex];
      const execId = s?.execution_id || activeSlotExecution?.execution_id;
      if (execId) {
        try {
          const res: any = await dispatch(getExecutionPoints({execution_id: execId}));
          if (res?.payload?.points && Object.keys(res.payload.points).length > 0) {
            setSlotStates(prev => ({
              ...prev,
              [activeSlotKey]: res.payload.points,
            }));
            persistSlotPointsLocally(activeSlotKey, res.payload.points);
          }
        } catch (e) {}
      }
    })();
  }, [selectedSlotIndex, activeSlotKey, checklistData]);

  // Initialize per-slot checklist items and previous executions when data arrives
  useEffect(() => {
    if (Array.isArray(checklistData?.data)) {
      const executionsBySlot = checklistData?.executions_by_slot || {};
      const categoriesList = checklistData.data;

      // Populate slot executions
      setSlotExecutions(prev => {
        const nextExecs = {...prev};
        parsedSlots.forEach((s: any, idx: number) => {
          const sKey = getSlotKey(s, idx);
          if (executionsBySlot[sKey]) {
            nextExecs[sKey] = executionsBySlot[sKey];
          } else if (s.is_completed === 'Yes' && !nextExecs[sKey]) {
            nextExecs[sKey] = {
              execution_id: s.execution_id || 1,
              status: s.execution_status || 'Completed',
              remarks: s.remarks || '',
              executed_at: s.executed_at || '',
            };
          }
        });
        return nextExecs;
      });

      // Load points: Server returned points -> AsyncStorage cached points -> API getExecutionPoints -> Default fresh
      (async () => {
        const nextStates: Record<string, Record<string, ChecklistItemState>> = {};

        for (let idx = 0; idx < parsedSlots.length; idx++) {
          const s: any = parsedSlots[idx];
          const sKey = getSlotKey(s, idx);
          const exec = executionsBySlot[sKey];
          nextStates[sKey] = {};

          // Check AsyncStorage for local cached points
          let localPoints: Record<string, any> = {};
          try {
            const raw = await AsyncStorage.getItem(getStorageKey(sKey));
            if (raw) {
              localPoints = JSON.parse(raw);
            }
          } catch (e) {}

          // Fallback: If slot was executed on server with execution_id but no points received yet, fetch directly
          if (
            s.execution_id &&
            (!exec?.points || Object.keys(exec.points).length === 0) &&
            Object.keys(localPoints).length === 0
          ) {
            try {
              const res: any = await dispatch(getExecutionPoints({execution_id: s.execution_id}));
              if (res?.payload?.points) {
                localPoints = res.payload.points;
              }
            } catch (e) {}
          }

          categoriesList.forEach((cat: any) => {
            if (Array.isArray(cat?.items)) {
              cat.items.forEach((item: any) => {
                const id = String(item.item_id || item.id);
                const desc = item.item_description || item.name || '';

                if (exec?.points && exec.points[id]) {
                  // 1. Server execution points
                  nextStates[sKey][id] = {
                    item_id: id,
                    item_description: desc,
                    is_completed: exec.points[id].is_completed === 'No' ? 'No' : 'Yes',
                    remarks: exec.points[id].remarks || '',
                    photo_url: exec.points[id].photo_url || '',
                  };
                } else if (localPoints[id]) {
                  // 2. Local saved points
                  nextStates[sKey][id] = {
                    item_id: id,
                    item_description: desc,
                    is_completed: localPoints[id].is_completed === 'No' ? 'No' : 'Yes',
                    remarks: localPoints[id].remarks || '',
                    photo_url: localPoints[id].photo_url || '',
                  };
                } else {
                  // 3. Default fresh state
                  nextStates[sKey][id] = {
                    item_id: id,
                    item_description: desc,
                    is_completed: 'Yes',
                    remarks: '',
                    photo_url: '',
                  };
                }
              });
            }
          });
        }

        setSlotStates(nextStates);
      })();
    }
  }, [checklistData, parsedSlots]);

  // Handle submit response
  useEffect(() => {
    if (submitSuccess) {
      toast.show('Cleaning checklist submitted successfully!', {type: 'success'});
      dispatch(resetSubmitState());
      // Refresh schedules and checklist data
      if (selectedDate) {
        dispatch(
          getScheduleSlots({
            action: 'get_schedules_by_date',
            APIKEY: apiKey,
            emp_code: employeeCode,
            emp_id: employeeId,
            visit_date: selectedDate,
          }),
        );
        dispatch(
          getChecklistItems({
            checklist_id: checklistId || assignment?.checklist_id,
            assignment_id: assignmentId || assignment?.assignment_id,
            date: selectedDate,
          }),
        );
      }
      navigation.goBack();
    } else if (submitError) {
      if (submitError.toUpperCase().includes('UPCOMING') || submitError.toUpperCase().includes('NOT STARTED')) {
        showCustomAlert({
          type: 'upcoming',
          title: 'Upcoming Window - Submission Locked',
          badgeLabel: 'WINDOW NOT STARTED',
          message: submitError,
          buttons: [{text: 'UNDERSTOOD', style: 'default'}],
        });
      } else if (submitError.toUpperCase().includes('EXPIRED') || submitError.toUpperCase().includes('PASSED') || submitError.toUpperCase().includes('LATE')) {
        showCustomAlert({
          type: 'expired',
          title: 'Slot Closed - Submission Locked',
          badgeLabel: 'DEADLINE EXPIRED',
          message: submitError,
          buttons: [{text: 'UNDERSTOOD', style: 'default'}],
        });
      } else {
        showCustomAlert({
          type: 'danger',
          title: 'Submission Error',
          badgeLabel: 'SERVER ERROR',
          message: submitError,
          buttons: [{text: 'CLOSE', style: 'default'}],
        });
      }
      dispatch(resetSubmitState());
    }
  }, [
    submitSuccess,
    submitError,
    apiKey,
    checklistId,
    assignment?.checklist_id,
    assignmentId,
    assignment?.assignment_id,
    dispatch,
    employeeCode,
    employeeId,
    navigation,
    selectedDate,
    toast,
  ]);

  const toggleItemStatus = (itemId: string, status: 'Yes' | 'No') => {
    if (!isToday) {
      toast.show(
        `Checklist is view-only for ${isPast ? 'past' : 'upcoming'} dates. Submissions are only permitted for today's tasks.`,
        {type: 'warning'},
      );
      return;
    }
    if (slotTiming.isUpcoming) {
      toast.show(
        `⏳ Upcoming Window: Opens at ${slotTiming.startTimeStr || activeSlot.start_time}. Items cannot be modified yet.`,
        {type: 'warning'},
      );
      return;
    }
    if (slotTiming.isExpired) {
      toast.show(
        `⏰ Slot Expired: Closed at ${slotTiming.deadlineStr || activeSlot.end_time}. Items can no longer be modified.`,
        {type: 'warning'},
      );
      return;
    }
    setSlotStates(prev => {
      const currentSlotMap = prev[activeSlotKey] || {};
      const existing = currentSlotMap[itemId] || {
        item_id: itemId,
        item_description: '',
        is_completed: 'Yes',
        remarks: '',
        photo_url: '',
      };
      // Explicitly set to clicked status
      const nextStatus = status;

      const updatedSlotMap = {
        ...currentSlotMap,
        [itemId]: {
          ...existing,
          is_completed: nextStatus,
        },
      };

      persistSlotPointsLocally(activeSlotKey, updatedSlotMap);

      return {
        ...prev,
        [activeSlotKey]: updatedSlotMap,
      };
    });
  };

  const updateItemRemarks = (itemId: string, text: string) => {
    if (!isToday || slotTiming.isUpcoming || slotTiming.isExpired) {
      return;
    }
    setSlotStates(prev => {
      const currentSlotMap = prev[activeSlotKey] || {};
      const existing = currentSlotMap[itemId] || {
        item_id: itemId,
        item_description: '',
        is_completed: 'Yes',
        remarks: '',
        photo_url: '',
      };
      const updatedSlotMap = {
        ...currentSlotMap,
        [itemId]: {
          ...existing,
          remarks: text,
        },
      };

      persistSlotPointsLocally(activeSlotKey, updatedSlotMap);

      return {
        ...prev,
        [activeSlotKey]: updatedSlotMap,
      };
    });
  };

  const handleTakePhoto = async (itemId: string) => {
    if (!isToday) {
      toast.show('Photo capture is disabled in view-only mode for past or upcoming dates.', {type: 'warning'});
      return;
    }
    if (slotTiming.isUpcoming) {
      toast.show(`⏳ Upcoming Window: Opens at ${slotTiming.startTimeStr || activeSlot.start_time}. Photo capture is locked.`, {type: 'warning'});
      return;
    }
    if (slotTiming.isExpired) {
      toast.show(`⏰ Slot Expired: Closed at ${slotTiming.deadlineStr || activeSlot.end_time}. Photo capture is locked.`, {type: 'warning'});
      return;
    }
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.7,
        includeBase64: true,
      });

      if (result.didCancel || !result.assets?.[0]?.base64) {
        return;
      }

      setUploadingItemId(itemId);
      const base64Image = `data:${result.assets[0].type || 'image/jpeg'};base64,${result.assets[0].base64}`;

      const uploadRes: any = await dispatch(
        uploadExecutionPhoto({
          photo_base64: base64Image,
        }),
      );

      setUploadingItemId(null);

      if (uploadRes?.payload) {
        setSlotStates(prev => {
          const currentSlotMap = prev[activeSlotKey] || {};
          const existing = currentSlotMap[itemId] || {
            item_id: itemId,
            item_description: '',
            is_completed: 'Yes',
            remarks: '',
            photo_url: '',
          };
          const updatedSlotMap = {
            ...currentSlotMap,
            [itemId]: {
              ...existing,
              photo_url: uploadRes.payload,
            },
          };

          persistSlotPointsLocally(activeSlotKey, updatedSlotMap);

          return {
            ...prev,
            [activeSlotKey]: updatedSlotMap,
          };
        });
        toast.show('Proof photo attached!', {type: 'success'});
      } else {
        toast.show('Failed to upload proof photo', {type: 'warning'});
      }
    } catch (err: any) {
      setUploadingItemId(null);
      toast.show(err.message || 'Error capturing photo', {type: 'danger'});
    }
  };

  const handleSubmit = () => {
    if (!isToday) {
      showCustomAlert({
        type: 'danger',
        title: 'Submission Disabled',
        badgeLabel: isPast ? 'PAST DATE' : 'UPCOMING DATE',
        message: `This task was scheduled for ${taskDate}.\n\nJanitors are only permitted to execute and submit checklists for today's current date (${todayDate}).`,
        buttons: [{text: 'UNDERSTOOD', style: 'default'}],
      });
      return;
    }

    if (slotTiming.isUpcoming) {
      showCustomAlert({
        type: 'upcoming',
        title: 'Upcoming Window - Locked',
        badgeLabel: `OPENS AT ${slotTiming.startTimeStr || activeSlot.start_time}`,
        message: `This slot (${activeSlotKey}) is scheduled for ${slotTiming.startTimeStr || activeSlot.start_time} - ${slotTiming.endTimeStr || activeSlot.end_time}.\n\nJanitors cannot submit checklists for upcoming time slots before the scheduled start time (${slotTiming.startTimeStr || activeSlot.start_time}).\n\nPlease wait until the window opens to submit.`,
        buttons: [{text: 'UNDERSTOOD', style: 'default'}],
      });
      return;
    }

    if (slotTiming.isExpired) {
      showCustomAlert({
        type: 'expired',
        title: 'Submission Closed',
        badgeLabel: 'DEADLINE EXPIRED',
        message: `This slot (${activeSlotKey}) was scheduled for ${slotTiming.startTimeStr || activeSlot.start_time} - ${slotTiming.endTimeStr || activeSlot.end_time}.\n\nWith the administrator's ${lateThresholdMinutes} minute grace allowance, the deadline was ${slotTiming.deadlineStr || activeSlot.end_time}.\n\nThis deadline has passed. Late submissions beyond the allowed threshold are strictly prevented.`,
        buttons: [{text: 'UNDERSTOOD', style: 'default'}],
      });
      return;
    }

    if (!slotTiming.isWithinWindow) {
      showCustomAlert({
        type: 'warning',
        title: 'Submission Not Permitted',
        badgeLabel: 'OUTSIDE WINDOW',
        message: `This slot cannot be submitted at this time (${slotTiming.statusLabel}). Submissions are only permitted during the active scheduled window.`,
        buttons: [{text: 'UNDERSTOOD', style: 'default'}],
      });
      return;
    }

    const currentSlotMap = slotStates[activeSlotKey] || {};
    const categoriesList = checklistData?.data || [];
    const pointsMap: Record<string, any> = {};

    let totalPointsInSlot = 0;
    let issuesCountInSlot = 0;

    if (Array.isArray(categoriesList)) {
      categoriesList.forEach((cat: any) => {
        if (Array.isArray(cat?.items)) {
          cat.items.forEach((it: any) => {
            const id = String(it.item_id || it.id);
            totalPointsInSlot++;
            const userState = currentSlotMap[id];
            const isCompleted = userState?.is_completed || 'Yes';
            if (isCompleted === 'No') {
              issuesCountInSlot++;
            }
            pointsMap[id] = {
              checklist_item_id: id,
              is_completed: isCompleted,
              remarks: userState?.remarks || '',
              photo_url: userState?.photo_url || '',
            };
          });
        }
      });
    }

    const points = Object.values(pointsMap);

    if (points.length === 0) {
      showCustomAlert({
        type: 'warning',
        title: 'No Checklist Items',
        message: 'No checklist items found to submit for this assignment.',
        buttons: [{text: 'UNDERSTOOD', style: 'default'}],
      });
      return;
    }

    // Determine completion status:
    // If every item across all groups is completed, then 'Completed', else 'Partially Completed'
    const isCompletedAll = issuesCountInSlot === 0 && totalPointsInSlot > 0;
    const baseStatus = isCompletedAll ? 'Completed' : 'Partially Completed';

    // Timing evaluation & late calculation
    const isLate = slotTiming.isLate || slotTiming.isGracePeriod;
    const delayMinutes = slotTiming.delayMinutes;

    let executionStatus = baseStatus;
    let finalRemarks = generalRemarks;

    if (isLate && delayMinutes > 0) {
      const lateDurationFormatted = formatLateDuration(delayMinutes);
      executionStatus = `${baseStatus} (Late by ${lateDurationFormatted})`;
      const lateNote = `[LATE EXECUTION: Completed ${lateDurationFormatted} after scheduled end time (${activeSlot.end_time}, threshold: ${lateThresholdMinutes}m)]`;
      finalRemarks = generalRemarks ? `${lateNote} ${generalRemarks}` : lateNote;
    }

    showCustomAlert({
      type: isCompletedAll ? 'confirm' : 'warning',
      title: isSlotExecuted ? 'Update Slot Execution' : 'Confirm Submission',
      badgeLabel: isCompletedAll
        ? 'ALL ITEMS DONE ✓'
        : `${issuesCountInSlot} ISSUE${issuesCountInSlot > 1 ? 'S' : ''} FLAGGED ⚠️`,
      message: isCompletedAll
        ? `All ${totalPointsInSlot} checklist tasks are marked as Done.\n\nThis slot (${activeSlotKey}) will be logged as COMPLETED.${isLate && delayMinutes > 0 ? `\n\n(Late by ${formatLateDuration(delayMinutes)})` : ''}\n\nProceed with submission?`
        : `⚠️ NOTICE: ${issuesCountInSlot} of ${totalPointsInSlot} tasks are marked as Issue / Not Done.\n\nThis slot (${activeSlotKey}) will be logged as PARTIALLY COMPLETED.${isLate && delayMinutes > 0 ? `\n\n(Late by ${formatLateDuration(delayMinutes)})` : ''}\n\nProceed with submission?`,
      buttons: [
        {
          text: 'CANCEL',
          style: 'cancel',
          onPress: () => setCustomAlert(null),
        },
        {
          text: 'SUBMIT NOW',
          style: 'default',
          onPress: async () => {
            setCustomAlert(null);
            // Persist points locally immediately
            persistSlotPointsLocally(activeSlotKey, currentSlotMap);
            setSlotExecutions(prev => ({
              ...prev,
              [activeSlotKey]: {
                execution_id: 1,
                status: executionStatus,
                remarks: finalRemarks,
                executed_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                points: currentSlotMap,
              },
            }));

            let submitScanLat = scanLat;
            let submitScanLng = scanLng;
            let submitAssetLat = assetLat || assignment?.latitude || assignment?.building_latitude;
            let submitAssetLng = assetLng || assignment?.longitude || assignment?.building_longitude;
            let submitDistance = verifiedDistance;

            if (!submitScanLat || !submitScanLng) {
              try {
                const pos = await getCurrentLocation();
                submitScanLat = pos.latitude;
                submitScanLng = pos.longitude;
                if (!submitDistance && submitAssetLat && submitAssetLng) {
                  submitDistance = calculateDistanceMeters(
                    submitScanLat,
                    submitScanLng,
                    Number(submitAssetLat),
                    Number(submitAssetLng),
                  );
                }
              } catch (e) {
                // If device location fails, fallback to asset target location
                submitScanLat = submitAssetLat;
                submitScanLng = submitAssetLng;
              }
            }

            dispatch(
              submitChecklistExecution({
                assignment_id: assignmentId || assignment?.assignment_id || assignment?.id,
                slot: activeSlotKey,
                date: selectedDate || moment().format('YYYY-MM-DD'),
                status: executionStatus,
                remarks: finalRemarks,
                start_time: slotTiming.startTimeStr || activeSlot.start_time,
                end_time: slotTiming.endTimeStr || activeSlot.end_time,
                points,
                scan_lat: submitScanLat,
                scan_lng: submitScanLng,
                asset_lat: submitAssetLat,
                asset_lng: submitAssetLng,
                distance_meters: submitDistance,
              }),
            );
          },
        },
      ],
    });
  };

  const categories = checklistData?.data || [];

  // Summary counts for current slot
  let activeSlotTotalCount = 0;
  let activeSlotIssuesCount = 0;
  categories.forEach((cat: any) => {
    if (Array.isArray(cat?.items)) {
      cat.items.forEach((it: any) => {
        activeSlotTotalCount++;
        const itId = String(it.item_id || it.id);
        if (currentSlotItems[itId]?.is_completed === 'No') {
          activeSlotIssuesCount++;
        }
      });
    }
  });

  const isActiveSlotAllDone = isSlotExecuted
    ? (!isExecutionPartial && activeSlotIssuesCount === 0)
    : (activeSlotIssuesCount === 0 && activeSlotTotalCount > 0);

  return (
    <View style={styles.container}>
      <Header isHome={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}>
        {/* Date Restriction Notice Banner if not today */}
        {!isToday && (
          <View style={[styles.viewOnlyDateBanner, isPast ? styles.viewOnlyBannerPast : styles.viewOnlyBannerFuture]}>
            <MaterialIcons
              name={isPast ? 'lock-clock' : 'schedule'}
              size={20}
              color={isPast ? '#DC2626' : '#2563EB'}
            />
            <Text style={[styles.viewOnlyDateBannerText, isPast ? styles.viewOnlyTextPast : styles.viewOnlyTextFuture]}>
              {isPast
                ? `VIEW ONLY: This task was scheduled for a past date (${moment(taskDate).format('DD MMM YYYY')}). Editing and submissions are disabled. Only today's tasks can be executed.`
                : `VIEW ONLY: This task is scheduled for an upcoming date (${moment(taskDate).format('DD MMM YYYY')}). Editing and submissions will unlock on the scheduled day.`}
            </Text>
          </View>
        )}

        {/* Verification Summary Card */}
        <View style={styles.verifiedHeaderCard}>
          <View style={styles.verifiedIconWrap}>
            <MaterialIcons name="verified" size={26} color="#059669" />
          </View>
          <View style={styles.verifiedInfo}>
            <Text style={styles.verifiedStatusTitle}>ASSET & LOCATION VERIFIED</Text>
            <Text style={styles.verifiedAssetRef}>
              #{assignment?.asset_ref_no || 'ASSET-CODE'}
            </Text>
            <Text style={styles.verifiedSubDetail}>
              {assignment?.building_name} • {assignment?.asset_description || 'Washroom'}
              {scanLat ? ` • GPS: ${Number(scanLat).toFixed(4)}, ${Number(scanLng).toFixed(4)}` : ''}
              {verifiedDistance !== undefined ? ` • Distance: ${Number(verifiedDistance).toFixed(1)}m` : ''}
            </Text>
          </View>
        </View>

        {/* Slot Selection & Time Frame Rule Card */}
        <View style={styles.slotCard}>
          <View style={styles.slotHeaderRow}>
            <Text style={styles.cardSectionTitle}>Assigned Time Slot</Text>
            {/* Late / On-time Indicator Badge */}
            <View
              style={[
                styles.timingBadge,
                {
                  backgroundColor: isSlotExecuted
                    ? isEffectivelyLate
                      ? '#DC2626'
                      : isExecutionPartial
                      ? '#D97706'
                      : '#059669'
                    : slotTiming.isExpired
                    ? '#DC2626'
                    : slotTiming.badgeColor,
                },
              ]}>
              <MaterialIcons
                name={
                  isSlotExecuted
                    ? isEffectivelyLate
                      ? 'alarm'
                      : isExecutionPartial
                      ? 'warning'
                      : 'check-circle'
                    : slotTiming.isUpcoming
                    ? 'schedule'
                    : slotTiming.isExpired
                    ? 'lock-clock'
                    : slotTiming.isGracePeriod
                    ? 'alarm'
                    : slotTiming.isLate
                    ? 'alarm'
                    : 'check-circle'
                }
                size={14}
                color={colors.white}
              />
              <Text style={styles.timingBadgeText}>
                {isSlotExecuted
                  ? isExecutionPartial
                    ? isEffectivelyLate
                      ? `Partially Completed (Late by ${lateDelayFormatted})`
                      : 'Partially Completed (On Time)'
                    : isEffectivelyLate
                    ? `Completed (Late by ${lateDelayFormatted})`
                    : 'Completed (On Time)'
                  : slotTiming.statusLabel}
              </Text>
            </View>
          </View>

          {/* Slot Selector Pills */}
          {parsedSlots.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotPillRow}>
              {parsedSlots.map((s, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const slotLabel = s.name || s.slot_name || s.slot_time || `Slot ${idx + 1}`;
                const slotKey = getSlotKey(s, idx);
                const exec = slotExecutions[slotKey];
                const pillTiming = evaluateSlotTiming(s, selectedDate, lateThresholdMinutes);
                const isExec = s.is_completed === 'Yes' || Boolean(exec?.execution_id) || (exec?.status && exec.status !== 'Pending');
                const st = exec?.status || s.execution_status || '';
                const isPartial = st.toLowerCase().includes('partial');
                const isLateSlot = st.toLowerCase().includes('late') || (isExec && pillTiming.isLate);
                const timeRule = s.start_time && s.end_time && s.end_time !== '0'
                  ? `${s.start_time} - ${s.end_time}`
                  : 'Flexible';

                let statusBadgeText = timeRule;
                if (isExec) {
                  if (isPartial && isLateSlot) {
                    statusBadgeText = 'Partial (Late) ⚠️';
                  } else if (isPartial) {
                    statusBadgeText = 'Partial ⚠️';
                  } else if (isLateSlot) {
                    statusBadgeText = 'Done (Late) ⏰';
                  } else {
                    statusBadgeText = 'Done ✓';
                  }
                } else if (pillTiming.isUpcoming) {
                  statusBadgeText = `${timeRule} (Opens ${pillTiming.startTimeStr})`;
                } else if (pillTiming.isExpired) {
                  statusBadgeText = `${timeRule} (Closed ⏰)`;
                } else if (pillTiming.isGracePeriod) {
                  statusBadgeText = `${timeRule} (Grace ⚠️)`;
                } else {
                  statusBadgeText = `${timeRule} (Open ✓)`;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[
                      styles.slotPill,
                      isSelected && styles.slotPillActive,
                      isExec && !isPartial && !isSelected && (isLateSlot ? styles.slotPillLateBorder : styles.slotPillDoneBorder),
                      isExec && isPartial && !isSelected && styles.slotPillPartialBorder,
                      !isExec && pillTiming.isExpired && !isSelected && styles.slotPillLateBorder,
                      !isExec && pillTiming.isGracePeriod && !isSelected && styles.slotPillPartialBorder,
                    ]}
                    onPress={() => setSelectedSlotIndex(idx)}>
                    <View style={styles.slotPillTopRow}>
                      <Text style={[styles.slotPillTitle, isSelected && styles.slotPillTitleActive]}>
                        {slotLabel}
                      </Text>
                      {isExec && !isPartial ? (
                        <View style={isLateSlot ? styles.pillLateBadge : styles.pillDoneBadge}>
                          <MaterialIcons name={isLateSlot ? 'alarm' : 'check'} size={11} color={colors.white} />
                        </View>
                      ) : isExec && isPartial ? (
                        <View style={isLateSlot ? styles.pillLateBadge : styles.pillPartialBadge}>
                          <MaterialIcons name={isLateSlot ? 'alarm' : 'warning'} size={11} color={colors.white} />
                        </View>
                      ) : pillTiming.isExpired ? (
                        <View style={styles.pillLateBadge}>
                          <MaterialIcons name="lock-clock" size={11} color={colors.white} />
                        </View>
                      ) : pillTiming.isUpcoming ? (
                        <View style={styles.pillUpcomingBadge}>
                          <MaterialIcons name="schedule" size={11} color={colors.white} />
                        </View>
                      ) : pillTiming.isGracePeriod ? (
                        <View style={styles.pillGraceBadge}>
                          <MaterialIcons name="alarm" size={11} color={colors.white} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.slotPillSub, isSelected && styles.slotPillSubActive]}>
                      {statusBadgeText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Time Warning, Upcoming or Expired Status Banner */}
          {!isSlotExecuted && slotTiming.isUpcoming && (
            <View style={styles.upcomingWarningBox}>
              <MaterialIcons name="schedule" size={18} color="#1D4ED8" />
              <Text style={styles.upcomingWarningText}>
                ⏳ <Text style={{fontFamily: FontFamily.bold}}>Upcoming Window ({slotTiming.startTimeStr} - {slotTiming.endTimeStr}):</Text> This slot has not started yet. Checklist submission is locked until {slotTiming.startTimeStr}.
              </Text>
            </View>
          )}

          {!isSlotExecuted && slotTiming.isExpired && (
            <View style={styles.expiredWarningBox}>
              <MaterialIcons name="lock-clock" size={18} color="#B91C1C" />
              <Text style={styles.expiredWarningText}>
                ⏰ <Text style={{fontFamily: FontFamily.bold}}>Submission Closed (Window Expired):</Text> Scheduled end was {slotTiming.endTimeStr} (+{lateThresholdMinutes}m allowed late). The deadline was {slotTiming.deadlineStr}. Submissions are strictly prohibited.
              </Text>
            </View>
          )}

          {!isSlotExecuted && slotTiming.isGracePeriod && (
            <View style={styles.graceWarningBox}>
              <MaterialIcons name="alarm" size={18} color="#B45309" />
              <Text style={styles.graceWarningText}>
                ⚠️ <Text style={{fontFamily: FontFamily.bold}}>Late Grace Period Active:</Text> Scheduled end was {slotTiming.endTimeStr}. You may submit until {slotTiming.deadlineStr} ({lateThresholdMinutes}m administrator allowance).
              </Text>
            </View>
          )}
        </View>

        {/* Executed Slot Status Banner */}
        {isSlotExecuted && (
          <View
            style={[
              styles.slotBannerBox,
              isEffectivelyLate
                ? styles.slotBannerBoxLate
                : isExecutionPartial
                ? styles.slotBannerBoxPartial
                : styles.slotBannerBoxDone,
            ]}>
            <MaterialIcons
              name={isEffectivelyLate ? 'alarm-on' : isExecutionPartial ? 'report-problem' : 'verified'}
              size={24}
              color={isEffectivelyLate ? '#DC2626' : isExecutionPartial ? '#D97706' : '#059669'}
            />
            <View style={styles.slotBannerTextWrap}>
              <Text
                style={[
                  styles.slotBannerTitle,
                  {
                    color: isEffectivelyLate
                      ? '#991B1B'
                      : isExecutionPartial
                      ? '#92400E'
                      : '#065F46',
                  },
                ]}>
                {activeSlotKey} • {
                  isExecutionPartial
                    ? isEffectivelyLate
                      ? `Partially Completed (Late by ${lateDelayFormatted})`
                      : 'Partially Completed (On Time)'
                    : isEffectivelyLate
                    ? `Completed (Late by ${lateDelayFormatted})`
                    : 'Completed (On Time)'
                }
              </Text>
              <Text style={styles.slotBannerSubtitle}>
                {activeSlotExecution?.executed_at ? `Submitted at ${activeSlotExecution.executed_at}. ` : ''}
                {isExecutionPartial && isEffectivelyLate
                  ? `Incomplete tasks were logged, and submission was delayed past scheduled slot end (${activeSlot.end_time}).`
                  : isExecutionPartial
                  ? 'Certain tasks were flagged with issues or not completed.'
                  : isEffectivelyLate
                  ? `All tasks completed, but submitted after scheduled slot time (${activeSlot.end_time}).`
                  : 'All tasks in this slot were completed on time.'}
              </Text>
            </View>
          </View>
        )}

        {/* Checklist Category Groups */}
        {checklistLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading checklist points...</Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="checklist" size={40} color={colors.grey} />
            <Text style={styles.emptyText}>No checklist points found for this task.</Text>
          </View>
        ) : (
          categories.map((category: any, catIdx: number) => {
            const catItems = category?.items || [];
            const groupIssues = catItems.filter((it: any) => {
              const itId = String(it.item_id || it.id);
              return currentSlotItems[itId]?.is_completed === 'No';
            }).length;
            const groupHasIssue = groupIssues > 0;

            return (
              <View key={category.category_id || catIdx} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <MaterialIcons name="cleaning-services" size={18} color={colors.primary} />
                    <Text style={styles.categoryTitle}>{category.category_name || 'Category'}</Text>
                    <Text style={styles.itemCountBadge}>{catItems.length} items</Text>
                  </View>
                  <View style={[styles.groupStatusBadge, groupHasIssue ? styles.groupBadgeIssue : styles.groupBadgeSuccess]}>
                    <MaterialIcons
                      name={groupHasIssue ? 'warning' : 'check-circle'}
                      size={12}
                      color={groupHasIssue ? '#DC2626' : '#059669'}
                    />
                    <Text style={[styles.groupStatusText, {color: groupHasIssue ? '#DC2626' : '#059669'}]}>
                      {groupHasIssue ? `${groupIssues} Issue${groupIssues > 1 ? 's' : ''}` : 'All Done ✓'}
                    </Text>
                  </View>
                </View>

                {catItems.map((item: any, itemIdx: number) => {
                  const itemId = String(item.item_id || item.id);
                  const state = currentSlotItems[itemId] || {
                    item_id: itemId,
                    is_completed: 'Yes',
                    remarks: '',
                    photo_url: '',
                  };
                  const isDone = state.is_completed === 'Yes';
                  const isUploading = uploadingItemId === itemId;

                  return (
                    <View key={itemId || itemIdx} style={styles.itemRow}>
                      <View style={styles.itemInfoCol}>
                        <Text style={styles.itemDescriptionText}>
                          {item.item_description || `Item #${itemIdx + 1}`}
                        </Text>

                        {/* Yes / No Toggle Buttons */}
                        <View style={styles.statusToggleGroup}>
                          <Pressable
                            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            android_ripple={{color: 'rgba(0,0,0,0.1)'}}
                            style={({pressed}) => [
                              styles.toggleBtn,
                              isDone ? styles.toggleBtnYesActive : styles.toggleBtnInactive,
                              pressed && styles.toggleBtnPressed,
                            ]}
                            onPress={() => toggleItemStatus(itemId, 'Yes')}>
                            <MaterialIcons
                              name="check"
                              size={16}
                              color={isDone ? colors.white : '#64748B'}
                            />
                            <Text
                              style={[
                                styles.toggleBtnText,
                                isDone && styles.toggleBtnTextActive,
                              ]}>
                              Done
                            </Text>
                          </Pressable>

                          <Pressable
                            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            android_ripple={{color: 'rgba(0,0,0,0.1)'}}
                            style={({pressed}) => [
                              styles.toggleBtn,
                              styles.toggleBtnSpacing,
                              !isDone ? styles.toggleBtnNoActive : styles.toggleBtnInactive,
                              pressed && styles.toggleBtnPressed,
                            ]}
                            onPress={() => toggleItemStatus(itemId, 'No')}>
                            <MaterialIcons
                              name="close"
                              size={16}
                              color={!isDone ? colors.white : '#64748B'}
                            />
                            <Text
                              style={[
                                styles.toggleBtnText,
                                !isDone && styles.toggleBtnTextActive,
                              ]}>
                              Issue / Not Done
                            </Text>
                          </Pressable>
                        </View>

                        {/* Optional Item Remarks Input */}
                        <TextInput
                          style={styles.remarksInput}
                          placeholder="Optional item notes / remarks..."
                          placeholderTextColor="#94A3B8"
                          value={state.remarks}
                          onChangeText={txt => updateItemRemarks(itemId, txt)}
                        />

                        {/* Photo Proof Action / Preview */}
                        <View style={styles.photoActionRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.photoAttachBtn}
                            onPress={() => handleTakePhoto(itemId)}
                            disabled={isUploading}>
                            {isUploading ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <>
                                <MaterialIcons
                                  name="add-a-photo"
                                  size={16}
                                  color={colors.primary}
                                />
                                <Text style={styles.photoAttachBtnText}>
                                  {state.photo_url ? 'Retake Photo' : 'Attach Photo'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>

                          {state.photo_url ? (
                            <View style={styles.previewThumbWrapper}>
                              <Image
                                source={{uri: state.photo_url}}
                                style={styles.previewThumb}
                              />
                              <Text style={styles.photoAttachedLabel}>Attached ✓</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {/* General Execution Remarks */}
        <View style={styles.generalRemarksCard}>
          <Text style={styles.cardSectionTitle}>General Remarks (Optional)</Text>
          <TextInput
            style={styles.generalRemarksInput}
            placeholder="Enter any additional supervisor / cleaning comments here..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={generalRemarks}
            onChangeText={setGeneralRemarks}
          />
        </View>

        {/* Submit Execution Button */}
        {!isToday ? (
          <View style={[styles.submitButton, styles.submitButtonViewOnly]}>
            <MaterialIcons name="lock" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>
              SUBMISSION DISABLED ({isPast ? 'PAST DATE' : 'UPCOMING DATE'})
            </Text>
          </View>
        ) : slotTiming.isUpcoming ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitButton, styles.submitButtonUpcoming]}
            onPress={handleSubmit}>
            <MaterialIcons name="lock" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>
              SUBMISSION LOCKED (OPENS AT {slotTiming.startTimeStr || activeSlot.start_time})
            </Text>
          </TouchableOpacity>
        ) : slotTiming.isExpired ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitButton, styles.submitButtonExpired]}
            onPress={handleSubmit}>
            <MaterialIcons name="lock" size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>
              SUBMISSION CLOSED (EXPIRED AT {slotTiming.deadlineStr || activeSlot.end_time})
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.submitButton,
              !isActiveSlotAllDone && styles.submitButtonPartial,
              slotTiming.isGracePeriod && styles.submitButtonGrace,
              submitLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitLoading || checklistLoading}>
            {submitLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialIcons name={isSlotExecuted ? 'edit' : 'send'} size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>
                  {isSlotExecuted ? 'UPDATE CHECKLIST' : 'SUBMIT CHECKLIST'}{' '}
                  ({isActiveSlotAllDone ? 'COMPLETED' : 'PARTIALLY COMPLETED'}{slotTiming.isGracePeriod ? ' - GRACE' : ''})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {customAlert && (
        <AppAlertModal
          visible={customAlert.visible}
          type={customAlert.type}
          title={customAlert.title}
          message={customAlert.message}
          badgeLabel={customAlert.badgeLabel}
          iconName={customAlert.iconName}
          buttons={customAlert.buttons}
          onClose={() => setCustomAlert(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  verifiedHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#059669',
  },
  verifiedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedInfo: {
    marginLeft: 12,
    flex: 1,
  },
  verifiedStatusTitle: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: '#059669',
    letterSpacing: 0.5,
  },
  verifiedAssetRef: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  verifiedSubDetail: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
  },
  slotCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timingBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 4,
  },
  slotPillRow: {
    marginTop: 12,
  },
  slotPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 100,
  },
  slotPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotPillDoneBorder: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  slotPillPartialBorder: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  slotPillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotPillTitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  slotPillTitleActive: {
    color: colors.white,
  },
  slotPillSub: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 2,
  },
  slotPillSubActive: {
    color: '#E0F2FE',
  },
  pillDoneBadge: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillPartialBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillLateBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillUpcomingBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillGraceBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  slotPillLateBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  slotPillPartialBorder: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  slotBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  slotBannerBoxDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  slotBannerBoxPartial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  slotBannerBoxLate: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  slotBannerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  slotBannerTitle: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
  },
  slotBannerSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    marginTop: 2,
  },
  groupStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  groupBadgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  groupBadgeIssue: {
    backgroundColor: '#FEF2F2',
  },
  groupStatusText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    marginLeft: 4,
  },
  submitButtonPartial: {
    backgroundColor: '#D97706',
  },
  lateWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  lateWarningText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: '#B91C1C',
    marginLeft: 8,
    flex: 1,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 8,
    flex: 1,
  },
  itemCountBadge: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.grey,
  },
  itemRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
    paddingBottom: 14,
  },
  itemInfoCol: {
    flex: 1,
  },
  itemDescriptionText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: '#1E293B',
    marginBottom: 10,
  },
  statusToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  toggleBtnPressed: {
    opacity: 0.7,
    transform: [{scale: 0.96}],
  },
  toggleBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  toggleBtnYesActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  toggleBtnNoActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  toggleBtnText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginLeft: 6,
  },
  toggleBtnTextActive: {
    color: colors.white,
    fontFamily: FontFamily.bold,
  },
  remarksInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.header,
    marginBottom: 8,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  photoAttachBtnText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.primary,
    marginLeft: 6,
  },
  previewThumbWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoAttachedLabel: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: '#059669',
    marginLeft: 6,
  },
  generalRemarksCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  generalRemarksInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.header,
    textAlignVertical: 'top',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 10,
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  toggleBtnSpacing: {
    marginLeft: 8,
  },
  emptyText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 10,
    textAlign: 'center',
  },
  viewOnlyDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  viewOnlyBannerPast: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  viewOnlyBannerFuture: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  viewOnlyDateBannerText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  viewOnlyTextPast: {
    color: '#991B1B',
  },
  viewOnlyTextFuture: {
    color: '#1E40AF',
  },
  submitButtonViewOnly: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonUpcoming: {
    backgroundColor: '#3B82F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonExpired: {
    backgroundColor: '#DC2626',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonGrace: {
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
  },
  upcomingWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  upcomingWarningText: {
    color: '#1E40AF',
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  expiredWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  expiredWarningText: {
    color: '#991B1B',
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  graceWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  graceWarningText: {
    color: '#B45309',
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default JanitorChecklistScreen;
