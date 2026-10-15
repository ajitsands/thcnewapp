import React, {useState, useEffect, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  fetchRequisitionCategories,
  fetchRequisitionItems,
  submitBookRequisition,
  resetRequisitionSubmitState,
  RequisitionCategory,
  RequisitionItem,
  StagedRequisitionItem,
} from '../../../store/reducers/requisitionReducers/bookRequisitionReducer';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const UNIT_OPTIONS = ['Nos', 'Pcs', 'Mtr', 'Kg', 'Set', 'Box', 'Ltr', 'Roll', 'Packet', 'Pair', 'Length'];

interface MaterialRequisitionModalProps {
  visible: boolean;
  onClose: () => void;
  ticketDetails: any;
  effectiveEmpId: string | number;
}

export const MaterialRequisitionModal = ({
  visible,
  onClose,
  ticketDetails,
  effectiveEmpId,
}: MaterialRequisitionModalProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {
    categories,
    categoriesLoading,
    items,
    itemsLoading,
    submitLoading,
    submitSuccess,
    submitError,
    submitResponse,
  } = useAppSelector(state => state.bookRequisition);

  // Local Form State
  const [selectedCategory, setSelectedCategory] = useState<RequisitionCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<RequisitionItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Nos');
  const [remarks, setRemarks] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Staged Items List
  const [stagedItems, setStagedItems] = useState<StagedRequisitionItem[]>([]);

  // Attachment State
  const [attachment, setAttachment] = useState<{uri: string; name?: string; type?: string} | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Load categories when modal opens
  useEffect(() => {
    if (visible && apiKey) {
      dispatch(fetchRequisitionCategories({APIKEY: apiKey}));
      dispatch(resetRequisitionSubmitState());
    }
  }, [visible, apiKey, dispatch]);

  // Handle successful submission
  useEffect(() => {
    if (submitSuccess) {
      const msg = submitResponse?.message || 'Material Requisition submitted successfully!';
      const reqId = submitResponse?.request_id ? ` (Req ID: #${submitResponse.request_id})` : '';
      toast.show(`${msg}${reqId}`, {type: 'success'});
      // Reset local state and close
      setStagedItems([]);
      setSelectedCategory(null);
      setSelectedItem(null);
      setQuantity('1');
      setRemarks('');
      setAttachment(null);
      dispatch(resetRequisitionSubmitState());
      onClose();
    } else if (submitError) {
      Alert.alert('Submission Error', submitError, [{text: 'OK'}]);
      toast.show(submitError, {type: 'danger'});
      dispatch(resetRequisitionSubmitState());
    }
  }, [submitSuccess, submitError, submitResponse, dispatch, onClose, toast]);

  // Select Category handler
  const handleSelectCategory = (cat: RequisitionCategory) => {
    setSelectedCategory(cat);
    setSelectedItem(null);
    setItemSearchQuery('');
    setShowItemPicker(false);
    if (apiKey && cat?.name) {
      dispatch(fetchRequisitionItems({APIKEY: apiKey, category: cat.name}));
    }
  };

  // Filtered items list by search query
  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return items;
    const q = itemSearchQuery.toLowerCase();
    return items.filter(
      it =>
        it.item_name?.toLowerCase().includes(q) ||
        it.item_code?.toLowerCase().includes(q) ||
        it.type_name?.toLowerCase().includes(q),
    );
  }, [items, itemSearchQuery]);

  // Add Item to Staged List
  const handleAddItem = () => {
    if (!selectedCategory) {
      toast.show('Please select a Category first.', {type: 'warning'});
      return;
    }
    if (!selectedItem) {
      toast.show('Please select an Item from the list.', {type: 'warning'});
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.show('Please enter a valid quantity (minimum 1).', {type: 'warning'});
      return;
    }

    const newItem: StagedRequisitionItem = {
      category_id: selectedCategory.id,
      category_name: selectedCategory.name,
      item_id: Number(selectedItem.id) || selectedItem.id,
      item_name: selectedItem.item_name,
      item_code: selectedItem.item_code,
      quantity: parsedQty,
      unit: unit.trim() || 'Nos',
      remarks: remarks.trim(),
    };

    setStagedItems(prev => [...prev, newItem]);
    toast.show(`Added "${selectedItem.item_name}" to requisition.`, {type: 'success'});

    // Reset item selection fields for next item
    setSelectedItem(null);
    setQuantity('1');
    setRemarks('');
    setItemSearchQuery('');
    setShowItemPicker(false);
  };

  // Remove item from staged list
  const handleRemoveStagedItem = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Image / Photo picker
  const handlePickAttachment = async (isCamera: boolean) => {
    try {
      setShowAttachmentMenu(false);
      if (Platform.OS === 'android' && isCamera) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          return;
        }
      }

      const result = isCamera
        ? await launchCamera({mediaType: 'photo', quality: 0.7})
        : await launchImageLibrary({mediaType: 'photo', quality: 0.7});

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setAttachment({
            uri: asset.uri,
            name: asset.fileName || `req_image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
        }
      }
    } catch (err: any) {
      console.log('[MaterialRequisitionModal] Pick image error:', err);
    }
  };

  // Submit Requisition
  const handleSubmitRequisition = () => {
    if (stagedItems.length === 0) {
      toast.show('Please add at least one line item to the requisition.', {type: 'warning'});
      return;
    }

    const customerId = ticketDetails?.customer_id || ticketDetails?.cust_id || 1;
    const workorderId = ticketDetails?.ticket_id || ticketDetails?.amc_tkt_id || 1;
    const userId = effectiveEmpId || 1;

    dispatch(
      submitBookRequisition({
        APIKEY: apiKey,
        customer_id: customerId,
        workorder_id: workorderId,
        user_id: userId,
        items: stagedItems.map(it => ({
          item_id: it.item_id,
          quantity: it.quantity,
          unit: it.unit,
          remarks: it.remarks,
        })),
        attachment: attachment,
      }),
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons name="inventory-2" size={22} color={colors.white} />
              </View>
              <View style={{marginLeft: 10, flex: 1}}>
                <Text style={styles.headerTitle}>Material Requisition</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  WO #{ticketDetails?.ticket_ref_code ? `${ticketDetails.ticket_ref_code}-${ticketDetails.ticket_id}` : ticketDetails?.ticket_id} • {ticketDetails?.customer_name || 'Customer'}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={colors.header} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Step 1: Select Category */}
            <View style={styles.formSection}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="category" size={18} color={colors.primary} />
                <Text style={styles.sectionLabel}>1. Select Category</Text>
                {categoriesLoading && <ActivityIndicator size="small" color={colors.primary} style={{marginLeft: 8}} />}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
                {categories.map(cat => {
                  const isCatSelected = selectedCategory?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCategory(cat)}
                      style={[styles.categoryPill, isCatSelected && styles.selectedCategoryPill]}>
                      <Text style={[styles.categoryPillText, isCatSelected && styles.selectedCategoryPillText]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 2: Select Item */}
            {selectedCategory && (
              <View style={styles.formSection}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="list-alt" size={18} color={colors.primary} />
                  <Text style={styles.sectionLabel}>2. Select Item ({selectedCategory.name})</Text>
                  {itemsLoading && <ActivityIndicator size="small" color={colors.primary} style={{marginLeft: 8}} />}
                </View>

                {/* Selected Item Trigger / Dropdown */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowItemPicker(!showItemPicker)}
                  style={styles.dropdownTrigger}>
                  <View style={{flex: 1}}>
                    {selectedItem ? (
                      <View>
                        <Text style={styles.selectedItemName}>{selectedItem.item_name}</Text>
                        <Text style={styles.selectedItemCode}>
                          Code: {selectedItem.item_code || 'N/A'} • Type: {selectedItem.type_name || 'Goods'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.dropdownPlaceholder}>
                        {items.length > 0 ? 'Tap to choose an item...' : 'No items found in this category'}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name={showItemPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color={colors.header}
                  />
                </TouchableOpacity>

                {/* Item Search & List Modal / Drawer */}
                {showItemPicker && items.length > 0 && (
                  <View style={styles.itemPickerContainer}>
                    <View style={styles.searchBarRow}>
                      <MaterialIcons name="search" size={20} color={colors.grey} style={{marginRight: 6}} />
                      <TextInput
                        placeholder="Search item name or code..."
                        placeholderTextColor={colors.grey}
                        value={itemSearchQuery}
                        onChangeText={setItemSearchQuery}
                        style={styles.searchInput}
                      />
                      {itemSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setItemSearchQuery('')}>
                          <MaterialIcons name="cancel" size={18} color={colors.grey} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <ScrollView style={{maxHeight: 200}} nestedScrollEnabled>
                      {filteredItems.map(item => {
                        const isItSelected = selectedItem?.id === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.7}
                            onPress={() => {
                              setSelectedItem(item);
                              setShowItemPicker(false);
                            }}
                            style={[styles.itemOptionRow, isItSelected && styles.selectedItemOptionRow]}>
                            <View style={{flex: 1}}>
                              <Text style={[styles.itemOptionName, isItSelected && styles.selectedItemOptionName]}>
                                {item.item_name}
                              </Text>
                              <Text style={styles.itemOptionSub}>
                                Code: {item.item_code || '---'} | Type: {item.type_name}
                              </Text>
                            </View>
                            {isItSelected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <Text style={styles.noItemsText}>No matching items found</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Quantity, Unit, & Remarks */}
            {selectedItem && (
              <View style={styles.formSection}>
                <View style={styles.qtyUnitRow}>
                  {/* Quantity with Steppers */}
                  <View style={{flex: 1, marginRight: 10}}>
                    <Text style={styles.inputSubLabel}>Quantity</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          const q = parseInt(quantity, 10) || 1;
                          if (q > 1) setQuantity(String(q - 1));
                        }}
                        style={styles.stepperBtn}>
                        <MaterialIcons name="remove" size={18} color={colors.header} />
                      </TouchableOpacity>

                      <TextInput
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={t => setQuantity(t.replace(/[^0-9]/g, ''))}
                        style={styles.stepperInput}
                      />

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          const q = parseInt(quantity, 10) || 0;
                          setQuantity(String(q + 1));
                        }}
                        style={styles.stepperBtn}>
                        <MaterialIcons name="add" size={18} color={colors.header} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Unit Selector */}
                  <View style={{flex: 1}}>
                    <Text style={styles.inputSubLabel}>Unit</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowUnitPicker(!showUnitPicker)}
                      style={styles.unitDropdownBtn}>
                      <Text style={styles.unitDropdownText}>{unit}</Text>
                      <MaterialIcons name="arrow-drop-down" size={22} color={colors.header} />
                    </TouchableOpacity>

                    {showUnitPicker && (
                      <View style={styles.unitPickerMenu}>
                        <ScrollView style={{maxHeight: 150}} nestedScrollEnabled>
                          {UNIT_OPTIONS.map(u => (
                            <TouchableOpacity
                              key={u}
                              onPress={() => {
                                setUnit(u);
                                setShowUnitPicker(false);
                              }}
                              style={styles.unitOption}>
                              <Text style={[styles.unitOptionText, unit === u && {color: colors.primary, fontFamily: FontFamily.bold}]}>
                                {u}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Line Item Remarks */}
                <View style={{marginTop: 10}}>
                  <Text style={styles.inputSubLabel}>Item Remarks (Optional)</Text>
                  <TextInput
                    placeholder="e.g. Urgent replacement, damaged seal..."
                    placeholderTextColor={colors.grey}
                    value={remarks}
                    onChangeText={setRemarks}
                    style={styles.lineItemRemarksInput}
                  />
                </View>

                {/* Add Item Button */}
                <TouchableOpacity activeOpacity={0.85} onPress={handleAddItem} style={styles.addItemBtn}>
                  <MaterialIcons name="add-circle" size={20} color={colors.white} style={{marginRight: 6}} />
                  <Text style={styles.addItemBtnText}>Add Item to Requisition</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 4: Staged Line Items List */}
            {stagedItems.length > 0 && (
              <View style={styles.formSection}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="shopping-bag" size={18} color={colors.primary} />
                  <Text style={styles.sectionLabel}>
                    Requested Items ({stagedItems.length})
                  </Text>
                </View>

                {stagedItems.map((item, idx) => (
                  <View key={idx} style={styles.stagedItemCard}>
                    <View style={styles.stagedItemHeader}>
                      <View style={{flex: 1}}>
                        <Text style={styles.stagedItemName}>{item.item_name}</Text>
                        <Text style={styles.stagedItemSub}>
                          Category: {item.category_name} • Code: {item.item_code || 'N/A'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveStagedItem(idx)}
                        style={styles.removeStagedItemBtn}>
                        <MaterialIcons name="delete-outline" size={22} color={colors.red} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stagedItemFooter}>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>
                          Qty: {item.quantity} {item.unit}
                        </Text>
                      </View>
                      {item.remarks ? (
                        <Text style={styles.stagedRemarksText} numberOfLines={2}>
                          "{item.remarks}"
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Step 5: Optional Photo Attachment */}
            <View style={styles.formSection}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="attach-file" size={18} color={colors.primary} />
                <Text style={styles.sectionLabel}>Attachment (Optional)</Text>
              </View>

              {attachment ? (
                <View style={styles.attachmentPreviewCard}>
                  <Image source={{uri: attachment.uri}} style={styles.attachmentThumb} />
                  <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.attachmentNameText} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Text style={styles.attachmentStatusText}>Photo attached</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAttachment(null)}
                    style={styles.removeAttachmentBtn}>
                    <MaterialIcons name="cancel" size={22} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAttachmentMenu(true)}
                  style={styles.addAttachmentBtn}>
                  <MaterialIcons name="add-a-photo" size={22} color={colors.primary} />
                  <Text style={styles.addAttachmentText}>Take Photo / Choose from Gallery</Text>
                </TouchableOpacity>
              )}

              {/* Attachment Picker Sheet */}
              {showAttachmentMenu && (
                <View style={styles.attachmentOptionsCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePickAttachment(true)}
                    style={styles.attachmentOptionBtn}>
                    <MaterialIcons name="photo-camera" size={20} color={colors.primary} style={{marginRight: 8}} />
                    <Text style={styles.attachmentOptionText}>Take Photo with Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePickAttachment(false)}
                    style={styles.attachmentOptionBtn}>
                    <MaterialIcons name="photo-library" size={20} color={colors.primary} style={{marginRight: 8}} />
                    <Text style={styles.attachmentOptionText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={stagedItems.length === 0 || submitLoading}
              onPress={handleSubmitRequisition}
              style={[
                styles.submitBtn,
                (stagedItems.length === 0 || submitLoading) && styles.disabledSubmitBtn,
              ]}>
              {submitLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={colors.white} style={{marginRight: 6}} />
                  <Text style={styles.submitBtnText}>
                    SUBMIT REQUISITION ({stagedItems.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 44, 81, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.7,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  headerSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 20,
  },
  formSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 6,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedCategoryPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  selectedCategoryPillText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
  },
  dropdownTrigger: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownPlaceholder: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.grey,
  },
  selectedItemName: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  selectedItemCode: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.primary,
    marginTop: 2,
  },
  itemPickerContainer: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
    padding: 4,
  },
  itemOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedItemOptionRow: {
    backgroundColor: '#EEF2FF',
  },
  itemOptionName: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  selectedItemOptionName: {
    color: colors.primary,
  },
  itemOptionSub: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
  },
  noItemsText: {
    textAlign: 'center',
    padding: 14,
    color: colors.grey,
    fontSize: scaleFont(12),
  },
  qtyUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputSubLabel: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginBottom: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
    padding: 0,
  },
  unitDropdownBtn: {
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  unitDropdownText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  unitPickerMenu: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    zIndex: 100,
    elevation: 4,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unitOptionText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  lineItemRemarksInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  addItemBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 12,
  },
  addItemBtnText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
  },
  stagedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  stagedItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stagedItemName: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  stagedItemSub: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
  },
  removeStagedItemBtn: {
    padding: 4,
  },
  stagedItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  qtyBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  qtyBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  stagedRemarksText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: '#64748B',
    fontStyle: 'italic',
    flex: 1,
  },
  attachmentPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
  },
  attachmentThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
  },
  attachmentNameText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  attachmentStatusText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: '#15803D',
    marginTop: 2,
  },
  removeAttachmentBtn: {
    padding: 6,
  },
  addAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addAttachmentText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginLeft: 8,
  },
  attachmentOptionsCard: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  attachmentOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  attachmentOptionText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.grey,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#15803D',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#15803D',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledSubmitBtn: {
    backgroundColor: colors.grey,
    opacity: 0.6,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
