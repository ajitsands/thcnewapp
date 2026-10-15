import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';
import moment from 'moment';
import {
  RequisitionItemDetail,
  WorkorderRequisition,
} from '../../../store/reducers/requisitionReducers/requistionHistory';

interface RequisitionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  workorder: WorkorderRequisition | null;
  items: RequisitionItemDetail[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export const RequisitionDetailsModal: React.FC<RequisitionDetailsModalProps> = ({
  visible,
  onClose,
  workorder,
  items,
  loading,
  error,
  onRetry,
}) => {
  if (!visible) return null;

  const getStatusStyle = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s.includes('APPROV') || s.includes('COMPLET') || s.includes('DELIVER') || s.includes('ISSUED')) {
      return {bg: '#DCFCE7', text: '#15803D', icon: 'check-circle'};
    }
    if (s.includes('PEND') || s.includes('PROCESS') || s.includes('ORDER')) {
      return {bg: '#FEF9C3', text: '#A16207', icon: 'hourglass-empty'};
    }
    if (s.includes('REJECT') || s.includes('CANCEL')) {
      return {bg: '#FEE2E2', text: '#B91C1C', icon: 'cancel'};
    }
    return {bg: '#DBEAFE', text: '#1D4ED8', icon: 'info'};
  };

  const formatWorkOrderNumber = (item: any) => {
    if (!item) return 'Work Order';
    const ref = item.workorder_ref || item.workorder_no || item.wo_number || '';
    const id = item.workorder_id || item.id || '';
    
    if (ref && id) {
      const cleanRef = ref.toUpperCase().startsWith('WO-') ? ref : `WO-${ref}`;
      return `${cleanRef}-${id}`;
    }
    if (ref) {
      return ref.toUpperCase().startsWith('WO-') ? ref : `WO-${ref}`;
    }
    if (id) {
      return `WO-${id}`;
    }
    return item.requisition_serial_no ? `WO-#${item.requisition_serial_no}` : 'Work Order';
  };

  const woNumber = formatWorkOrderNumber(workorder);

  const customerName =
    workorder?.customer_name ||
    workorder?.client_name ||
    workorder?.service_name ||
    '';

  const woStatus = workorder?.status || workorder?.req_status || 'Pending';
  const woStatusStyle = getStatusStyle(woStatus);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header Indicator Handle */}
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>

              {/* Header Bar */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.woBadge}>
                    <MaterialIcons name="assignment" size={16} color={colors.primary} />
                    <Text style={styles.woBadgeText}>{woNumber}</Text>
                  </View>
                  {customerName ? (
                    <Text style={styles.customerText} numberOfLines={1}>
                      {customerName}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}>
                  <MaterialIcons name="close" size={22} color={colors.grey} />
                </TouchableOpacity>
              </View>

              {/* Status & Summary Ribbon */}
              <View style={styles.ribbonContainer}>
                <View style={[styles.statusPill, {backgroundColor: woStatusStyle.bg}]}>
                  <MaterialIcons
                    name={woStatusStyle.icon}
                    size={13}
                    color={woStatusStyle.text}
                  />
                  <Text style={[styles.statusPillText, {color: woStatusStyle.text}]}>
                    {woStatus}
                  </Text>
                </View>

                <Text style={styles.itemCountText}>
                  {items.length} {items.length === 1 ? 'Item' : 'Items'} Requested
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Body Content */}
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading requisition items...</Text>
                </View>
              ) : error ? (
                <View style={styles.centerContainer}>
                  <MaterialIcons name="error-outline" size={40} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  {onRetry && (
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={onRetry}
                      activeOpacity={0.8}>
                      <MaterialIcons name="refresh" size={16} color={colors.white} />
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : items.length === 0 ? (
                <View style={styles.centerContainer}>
                  <MaterialIcons name="inventory-2" size={48} color={colors.grey} />
                  <Text style={styles.emptyTitle}>No Items Found</Text>
                  <Text style={styles.emptySubtitle}>
                    There are no requisition items listed for this work order.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}>
                  {items.map((item, index) => {
                    const itemStatus = item.status || item.item_status || 'Pending';
                    const itemStatusStyle = getStatusStyle(itemStatus);
                    const itemName = item.item_name || item.name || `Item #${index + 1}`;
                    const requestedQty = item.requested_qty || item.quantity || item.qty || '0';
                    const suppliedQty = item.supplied_qty || '0';
                    const balanceQty = item.balance_qty !== undefined && item.balance_qty !== null ? item.balance_qty : '0';
                    const unit = item.unit || 'Nos';
                    const category = item.category_name || item.category;
                    const code = item.item_code;
                    const reqItemId = item.request_item_id || item.item_id;
                    const remarks = item.remarks;
                    const dateStr = item.created_at || item.date || item.request_date;

                    return (
                      <View key={item.request_item_id ? `item-${item.request_item_id}` : item.id ? `id-${item.id}` : String(index)} style={styles.itemCard}>
                        {/* Top row: Name and Status */}
                        <View style={styles.itemCardHeader}>
                          <View style={styles.itemTitleCol}>
                            <Text style={styles.itemNameText}>{itemName}</Text>
                            <View style={styles.badgeRow}>
                              {code ? (
                                <View style={styles.codePill}>
                                  <Text style={styles.codePillText}>Code: {code}</Text>
                                </View>
                              ) : null}
                              {category ? (
                                <Text style={styles.itemSubtitleText}>{category}</Text>
                              ) : null}
                            </View>
                          </View>

                          <View
                            style={[
                              styles.itemStatusBadge,
                              {backgroundColor: itemStatusStyle.bg},
                            ]}>
                            <MaterialIcons
                              name={itemStatusStyle.icon}
                              size={12}
                              color={itemStatusStyle.text}
                            />
                            <Text
                              style={[
                                styles.itemStatusText,
                                {color: itemStatusStyle.text},
                              ]}>
                              {itemStatus}
                            </Text>
                          </View>
                        </View>

                        {/* 3-Column Quantities Grid: Requested | Supplied | Balance */}
                        <View style={styles.qtyGridContainer}>
                          <View style={styles.qtyGridCol}>
                            <Text style={styles.qtyGridLabel}>REQUESTED</Text>
                            <View style={[styles.qtyGridBox, {backgroundColor: '#EFF6FF', borderColor: '#BFDBFE'}]}>
                              <Text style={[styles.qtyGridValue, {color: colors.primary}]}>
                                {requestedQty} <Text style={styles.qtyGridUnit}>{unit}</Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.qtyGridCol}>
                            <Text style={styles.qtyGridLabel}>SUPPLIED</Text>
                            <View style={[styles.qtyGridBox, {backgroundColor: '#F0FDF4', borderColor: '#BBF7D0'}]}>
                              <Text style={[styles.qtyGridValue, {color: '#15803D'}]}>
                                {suppliedQty} <Text style={styles.qtyGridUnit}>{unit}</Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.qtyGridCol}>
                            <Text style={styles.qtyGridLabel}>BALANCE</Text>
                            <View style={[styles.qtyGridBox, {backgroundColor: '#FFFBEB', borderColor: '#FDE68A'}]}>
                              <Text style={[styles.qtyGridValue, {color: '#B45309'}]}>
                                {balanceQty} <Text style={styles.qtyGridUnit}>{unit}</Text>
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Remarks Box if present */}
                        {remarks ? (
                          <View style={styles.remarksBox}>
                            <MaterialIcons
                              name="notes"
                              size={14}
                              color="#64748B"
                              style={styles.remarksIcon}
                            />
                            <Text style={styles.remarksText}>
                              <Text style={{fontFamily: FontFamily.bold}}>Remarks: </Text>
                              {remarks}
                            </Text>
                          </View>
                        ) : null}

                        {/* Date if present */}
                        {dateStr ? (
                          <View style={styles.dateMeta}>
                            <MaterialIcons name="event" size={12} color={colors.grey} />
                            <Text style={styles.dateMetaText}>
                              {moment(dateStr).isValid() ? moment(dateStr).format('DD-MM-YYYY') : dateStr}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Footer Button */}
              <View style={styles.footerContainer}>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={onClose}
                  activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 44, 81, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '40%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  woBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  woBadgeText: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 6,
  },
  customerText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ribbonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    marginLeft: 4,
  },
  itemCountText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.grey,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  itemNameText: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  itemSubtitleText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  itemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemStatusText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    marginLeft: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  codePill: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  idPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  idPillText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  qtyGridContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  qtyGridCol: {
    flex: 1,
  },
  qtyGridLabel: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    color: '#64748B',
    marginBottom: 3,
    textAlign: 'center',
  },
  qtyGridBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyGridValue: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  qtyGridUnit: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  qtyText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.medium,
    color: colors.primary,
    marginLeft: 5,
  },
  qtyValue: {
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateMetaText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginLeft: 4,
  },
  remarksBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  remarksIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  remarksText: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: '#475569',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 10,
  },
  errorText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 6,
  },
  emptyTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 4,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doneBtnText: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
});
