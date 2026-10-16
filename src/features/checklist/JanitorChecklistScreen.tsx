import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

  // Active Selected Slot
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const activeSlot = parsedSlots[selectedSlotIndex] || {
    name: 'Slot 1',
    start_time: '08:00',
    end_time: '11:55',
    has_rule: 1,
  };

  // Evaluate timing for current slot with server threshold
  const slotTiming = evaluateSlotTiming(activeSlot, selectedDate, lateThresholdMinutes);

  // Checklist Items State: key is item_id
  const [itemsState, setItemsState] = useState<Record<string, ChecklistItemState>>({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState<string | number | null>(null);

  // Fetch checklist items on mount
  useEffect(() => {
    dispatch(
      getChecklistItems({
        checklist_id: checklistId || assignment?.checklist_id,
        assignment_id: assignmentId || assignment?.assignment_id,
      }),
    );
  }, [checklistId, assignmentId, assignment?.checklist_id, assignment?.assignment_id, dispatch]);

  // Initialize checklist items when data arrives
  useEffect(() => {
    if (Array.isArray(checklistData?.data)) {
      const initial: Record<string, ChecklistItemState> = {};
      checklistData.data.forEach((category: any) => {
        if (Array.isArray(category?.items)) {
          category.items.forEach((item: any) => {
            const id = String(item.item_id || item.id);
            initial[id] = {
              item_id: id,
              item_description: item.item_description || item.name || '',
              is_completed: 'Yes',
              remarks: '',
              photo_url: '',
            };
          });
        }
      });
      setItemsState(initial);
    }
  }, [checklistData]);

  // Handle submit response
  useEffect(() => {
    if (submitSuccess) {
      toast.show('Cleaning checklist submitted successfully!', {type: 'success'});
      dispatch(resetSubmitState());
      // Refresh schedules
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
    dispatch,
    employeeCode,
    employeeId,
    navigation,
    selectedDate,
    toast,
  ]);

  const toggleItemStatus = (itemId: string, status: 'Yes' | 'No') => {
    setItemsState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        is_completed: status,
      },
    }));
  };

  const updateItemRemarks = (itemId: string, text: string) => {
    setItemsState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        remarks: text,
      },
    }));
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
        setItemsState(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            photo_url: uploadRes.payload,
          },
        }));
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
    const points = Object.values(itemsState).map(item => ({
      checklist_item_id: item.item_id,
      is_completed: item.is_completed,
      remarks: item.remarks || '',
      photo_url: item.photo_url || '',
    }));

    if (points.length === 0) {
      Alert.alert('Notice', 'No checklist items found to submit.');
      return;
    }

    // Timing evaluation & late calculation
    const isLate = slotTiming.isLate;
    const delayMinutes = slotTiming.delayMinutes;
    const activeSlotName = activeSlot.name || activeSlot.slot_name || `Slot ${selectedSlotIndex + 1}`;

    let executionStatus = 'Completed';
    let finalRemarks = generalRemarks;

    if (isLate) {
      const lateDurationFormatted = formatLateDuration(delayMinutes);
      executionStatus = `Completed (Late by ${lateDurationFormatted})`;
      const lateNote = `[LATE EXECUTION: Completed ${lateDurationFormatted} after scheduled end time (${activeSlot.end_time}, threshold: ${lateThresholdMinutes}m)]`;
      finalRemarks = generalRemarks ? `${lateNote} ${generalRemarks}` : lateNote;
    }

    Alert.alert(
      'Confirm Submission',
      isLate
        ? `⚠️ This task is being completed LATE by ${formatLateDuration(delayMinutes)} (Scheduled end: ${activeSlot.end_time}, Allowed threshold: ${lateThresholdMinutes} mins).\n\nProceed with submission?`
        : `Submit completed checklist for ${activeSlotName}?`,
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
                slot: activeSlotName,
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

  return (
    <View style={styles.container}>
      <Header isHome={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                const timeRule = s.start_time && s.end_time && s.end_time !== '0'
                  ? `${s.start_time} - ${s.end_time}`
                  : 'Flexible';

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[styles.slotPill, isSelected && styles.slotPillActive]}
                    onPress={() => setSelectedSlotIndex(idx)}>
                    <Text style={[styles.slotPillTitle, isSelected && styles.slotPillTitleActive]}>
                      {slotLabel}
                    </Text>
                    <Text style={[styles.slotPillSub, isSelected && styles.slotPillSubActive]}>
                      {timeRule}
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
            return (
              <View key={category.category_id || catIdx} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <MaterialIcons name="cleaning-services" size={18} color={colors.primary} />
                  <Text style={styles.categoryTitle}>{category.category_name || 'Category'}</Text>
                  <Text style={styles.itemCountBadge}>{catItems.length} items</Text>
                </View>

                {catItems.map((item: any, itemIdx: number) => {
                  const itemId = String(item.item_id || item.id);
                  const state = itemsState[itemId] || {
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
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                              styles.toggleBtn,
                              isDone ? styles.toggleBtnYesActive : styles.toggleBtnInactive,
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
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                              styles.toggleBtn,
                              styles.toggleBtnSpacing,
                              !isDone ? styles.toggleBtnNoActive : styles.toggleBtnInactive,
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
                          </TouchableOpacity>
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
          style={[styles.submitButton, submitLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitLoading || checklistLoading}>
          {submitLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>
                {slotTiming.isLate ? 'SUBMIT CHECKLIST (LATE)' : 'SUBMIT CHECKLIST'}
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
  },
  slotPillSubActive: {
    color: '#E0F2FE',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  toggleBtnYesActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  toggleBtnNoActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
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
