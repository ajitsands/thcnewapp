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

  // Parse Slots
  let parsedSlots: SlotRuleInfo[] = [];
  try {
    if (typeof slotsDetail === 'string' && slotsDetail.startsWith('[')) {
      parsedSlots = JSON.parse(slotsDetail);
    } else if (Array.isArray(slotsDetail)) {
      parsedSlots = slotsDetail;
    } else if (Array.isArray(assignment?.slots_list)) {
      parsedSlots = assignment.slots_list;
    }
  } catch (e) {
    parsedSlots = [];
  }

  // Helper to extract a consistent slot key
  const getSlotKey = (s: any, idx: number) => {
    return String(s?.name || s?.slot_name || s?.slot_time || `Slot ${idx + 1}`).trim();
  };

  // Active Selected Slot
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const activeSlot = parsedSlots[selectedSlotIndex] || {
    name: 'Slot 1',
    start_time: '08:00',
    end_time: '11:55',
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

  const currentSlotItems = slotStates[activeSlotKey] || {};
  const activeSlotExecution = slotExecutions[activeSlotKey] || null;
  const isSlotExecuted = Boolean(activeSlotExecution?.execution_id);

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

  // Initialize per-slot checklist items and previous executions when data arrives
  useEffect(() => {
    if (Array.isArray(checklistData?.data)) {
      const executionsBySlot = checklistData?.executions_by_slot || {};
      const categoriesList = checklistData.data;

      // Populate slot executions
      setSlotExecutions(prev => {
        const nextExecs = {...prev};
        parsedSlots.forEach((s, idx) => {
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

      // Populate per-slot items state
      setSlotStates(prev => {
        const nextStates: Record<string, Record<string, ChecklistItemState>> = {...prev};

        parsedSlots.forEach((s, idx) => {
          const sKey = getSlotKey(s, idx);
          const exec = executionsBySlot[sKey];

          if (!nextStates[sKey]) {
            nextStates[sKey] = {};
          }

          categoriesList.forEach((cat: any) => {
            if (Array.isArray(cat?.items)) {
              cat.items.forEach((item: any) => {
                const id = String(item.item_id || item.id);
                // If this slot was already executed on this date, load executed point
                if (exec?.points && exec.points[id]) {
                  nextStates[sKey][id] = {
                    item_id: id,
                    item_description: item.item_description || item.name || '',
                    is_completed: exec.points[id].is_completed === 'No' ? 'No' : 'Yes',
                    remarks: exec.points[id].remarks || '',
                    photo_url: exec.points[id].photo_url || '',
                  };
                } else if (!nextStates[sKey][id]) {
                  // Default fresh items for this slot
                  nextStates[sKey][id] = {
                    item_id: id,
                    item_description: item.item_description || item.name || '',
                    is_completed: 'Yes',
                    remarks: '',
                    photo_url: '',
                  };
                } else if (!nextStates[sKey][id].item_description) {
                  nextStates[sKey][id].item_description = item.item_description || item.name || '';
                }
              });
            }
          });
        });

        return nextStates;
      });
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
      toast.show(submitError, {type: 'danger'});
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
    setSlotStates(prev => {
      const currentSlotMap = prev[activeSlotKey] || {};
      const existing = currentSlotMap[itemId] || {
        item_id: itemId,
        item_description: '',
        is_completed: 'Yes',
        remarks: '',
        photo_url: '',
      };
      // If clicking currently active status, toggle to other status; otherwise set to clicked status
      const nextStatus = existing.is_completed === status
        ? (status === 'Yes' ? 'No' : 'Yes')
        : status;

      return {
        ...prev,
        [activeSlotKey]: {
          ...currentSlotMap,
          [itemId]: {
            ...existing,
            is_completed: nextStatus,
          },
        },
      };
    });
  };

  const updateItemRemarks = (itemId: string, text: string) => {
    setSlotStates(prev => {
      const currentSlotMap = prev[activeSlotKey] || {};
      const existing = currentSlotMap[itemId] || {
        item_id: itemId,
        item_description: '',
        is_completed: 'Yes',
        remarks: '',
        photo_url: '',
      };
      return {
        ...prev,
        [activeSlotKey]: {
          ...currentSlotMap,
          [itemId]: {
            ...existing,
            remarks: text,
          },
        },
      };
    });
  };

  const handleTakePhoto = async (itemId: string) => {
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
          return {
            ...prev,
            [activeSlotKey]: {
              ...currentSlotMap,
              [itemId]: {
                ...existing,
                photo_url: uploadRes.payload,
              },
            },
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
      Alert.alert('Notice', 'No checklist items found to submit.');
      return;
    }

    // Determine completion status:
    // If every item across all groups is completed, then 'Completed', else 'Partially Completed'
    const isCompletedAll = issuesCountInSlot === 0 && totalPointsInSlot > 0;
    const baseStatus = isCompletedAll ? 'Completed' : 'Partially Completed';

    // Timing evaluation & late calculation
    const isLate = slotTiming.isLate;
    const delayMinutes = slotTiming.delayMinutes;

    let executionStatus = baseStatus;
    let finalRemarks = generalRemarks;

    if (isLate) {
      const lateDurationFormatted = formatLateDuration(delayMinutes);
      executionStatus = `${baseStatus} (Late by ${lateDurationFormatted})`;
      const lateNote = `[LATE EXECUTION: Completed ${lateDurationFormatted} after scheduled end time (${activeSlot.end_time}, threshold: ${lateThresholdMinutes}m)]`;
      finalRemarks = generalRemarks ? `${lateNote} ${generalRemarks}` : lateNote;
    }

    Alert.alert(
      isSlotExecuted ? 'Update Slot Execution' : 'Confirm Submission',
      isCompletedAll
        ? `All ${totalPointsInSlot} checklist tasks are marked as Done.\n\nThis slot (${activeSlotKey}) will be logged as COMPLETED.${isLate ? `\n\n(Late by ${formatLateDuration(delayMinutes)})` : ''}\n\nProceed with submission?`
        : `⚠️ NOTICE: ${issuesCountInSlot} of ${totalPointsInSlot} tasks are marked as Issue / Not Done.\n\nThis slot (${activeSlotKey}) will be logged as PARTIALLY COMPLETED.${isLate ? `\n\n(Late by ${formatLateDuration(delayMinutes)})` : ''}\n\nProceed with submission?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit Now',
          style: 'default',
          onPress: async () => {
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
    );
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
  const isActiveSlotAllDone = activeSlotIssuesCount === 0 && activeSlotTotalCount > 0;

  return (
    <View style={styles.container}>
      <Header isHome={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}>
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
            <View style={[styles.timingBadge, {backgroundColor: slotTiming.badgeColor}]}>
              <MaterialIcons
                name={slotTiming.isLate ? 'alarm' : 'check-circle'}
                size={14}
                color={colors.white}
              />
              <Text style={styles.timingBadgeText}>{slotTiming.statusLabel}</Text>
            </View>
          </View>

          {/* Slot Selector Pills */}
          {parsedSlots.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotPillRow}>
              {parsedSlots.map((s, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const slotLabel = s.name || s.slot_name || `Slot ${idx + 1}`;
                const slotKey = getSlotKey(s, idx);
                const exec = slotExecutions[slotKey];
                const isCompleted = exec?.status?.includes('Completed') && !exec?.status?.includes('Partially');
                const isPartial = exec?.status?.includes('Partially');
                const timeRule = s.start_time && s.end_time && s.end_time !== '0'
                  ? `${s.start_time} - ${s.end_time}`
                  : 'Flexible';

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[
                      styles.slotPill,
                      isSelected && styles.slotPillActive,
                      isCompleted && !isSelected && styles.slotPillDoneBorder,
                      isPartial && !isSelected && styles.slotPillPartialBorder,
                    ]}
                    onPress={() => setSelectedSlotIndex(idx)}>
                    <View style={styles.slotPillTopRow}>
                      <Text style={[styles.slotPillTitle, isSelected && styles.slotPillTitleActive]}>
                        {slotLabel}
                      </Text>
                      {isCompleted ? (
                        <View style={styles.pillDoneBadge}>
                          <MaterialIcons name="check" size={11} color={colors.white} />
                        </View>
                      ) : isPartial ? (
                        <View style={styles.pillPartialBadge}>
                          <MaterialIcons name="warning" size={11} color={colors.white} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.slotPillSub, isSelected && styles.slotPillSubActive]}>
                      {isCompleted ? 'Done ✓' : isPartial ? 'Partial ⚠️' : timeRule}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Time Warning if Late */}
          {slotTiming.isLate && (
            <View style={styles.lateWarningBox}>
              <MaterialIcons name="warning" size={18} color="#DC2626" />
              <Text style={styles.lateWarningText}>
                Scheduled window ended at {activeSlot.end_time}. This job will be logged as{' '}
                <Text style={{fontFamily: FontFamily.bold}}>
                  Late by {formatLateDuration(slotTiming.delayMinutes)}
                </Text>.
              </Text>
            </View>
          )}
        </View>

        {/* Executed Slot Status Banner */}
        {isSlotExecuted && (
          <View style={[styles.slotBannerBox, isActiveSlotAllDone ? styles.slotBannerBoxDone : styles.slotBannerBoxPartial]}>
            <MaterialIcons
              name={isActiveSlotAllDone ? 'verified' : 'report-problem'}
              size={24}
              color={isActiveSlotAllDone ? '#059669' : '#D97706'}
            />
            <View style={styles.slotBannerTextWrap}>
              <Text style={[styles.slotBannerTitle, {color: isActiveSlotAllDone ? '#065F46' : '#92400E'}]}>
                {activeSlotKey} • {activeSlotExecution.status}
              </Text>
              <Text style={styles.slotBannerSubtitle}>
                {activeSlotExecution.executed_at ? `Submitted at ${activeSlotExecution.executed_at}. ` : ''}
                {isActiveSlotAllDone
                  ? 'All tasks in this slot were completed.'
                  : 'Certain tasks were flagged with issues or not completed.'}
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
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.submitButton,
            !isActiveSlotAllDone && styles.submitButtonPartial,
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
                ({isActiveSlotAllDone ? 'COMPLETED' : 'PARTIALLY COMPLETED'}{slotTiming.isLate ? ' - LATE' : ''})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
});

export default JanitorChecklistScreen;
