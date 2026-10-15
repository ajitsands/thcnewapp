import React, {useEffect, useState, useCallback} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {FontFamily} from '../../../themes/fonts';
import {useAppDispatch, useAppSelector} from '../../../store';
import {ErrorModal} from '../../../core/components/errorModal';
import moment from 'moment';
import {scaleFont} from '../../../utils/helper';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  getEmployeeWorkordersWithRequisitions,
  getRequisitionList,
  setSelectedWorkorder,
  setDetailsModalVisible,
  WorkorderRequisition,
} from '../../../store/reducers/requisitionReducers/requistionHistory';
import {RequisitionDetailsModal} from '../components/RequisitionDetailsModal';

export const RequisitionHistory = () => {
  const dispatch = useAppDispatch();
  const {apiKey, employeeCode, employeeId} = useAppSelector(state => state.app);
  const {
    workorders,
    loading,
    error,
    selectedWorkorder,
    isDetailsModalVisible,
    requisitionList,
    requisitionListLoading,
    requisitionListError,
  } = useAppSelector(state => state.requisitionHistory);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const effectiveId = (employeeId && String(employeeId).trim() !== '') ? String(employeeId).trim() : (employeeCode ? String(employeeCode).trim() : '');
  const effectiveCode = (employeeCode && String(employeeCode).trim() !== '') ? String(employeeCode).trim() : effectiveId;

  const loadWorkorders = useCallback(() => {
    dispatch(
      getEmployeeWorkordersWithRequisitions({
        action: 'getEmployeeWorkordersWithRequisitions',
        APIKEY: apiKey,
        employee_id: effectiveId,
        user_id: effectiveId,
        emp_id: effectiveId,
        emp_code: effectiveCode,
        employee_code: effectiveCode,
      }),
    );
  }, [dispatch, apiKey, effectiveCode, effectiveId]);

  useEffect(() => {
    loadWorkorders();
  }, [loadWorkorders]);

  useEffect(() => {
    if (error && !loading && !isDetailsModalVisible) {
      setShowErrorModal(true);
    }
  }, [error, loading, isDetailsModalVisible]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkorders();
    setRefreshing(false);
  };

  const handleWorkorderPress = (item: WorkorderRequisition) => {
    const woId = item.workorder_id || item.id || item.requisition_serial_no || item.wo_number || 0;
    dispatch(setSelectedWorkorder(item));
    dispatch(setDetailsModalVisible(true));
    if (apiKey && woId) {
      dispatch(
        getRequisitionList({
          action: 'getRequisitionList',
          APIKEY: apiKey,
          workorder_id: woId,
        }),
      );
    }
  };

  const handleCloseModal = () => {
    dispatch(setDetailsModalVisible(false));
    dispatch(setSelectedWorkorder(null));
  };

  const handleRetryDetails = () => {
    if (selectedWorkorder && apiKey) {
      const woId =
        selectedWorkorder.workorder_id ||
        selectedWorkorder.id ||
        selectedWorkorder.requisition_serial_no ||
        0;
      dispatch(
        getRequisitionList({
          action: 'getRequisitionList',
          APIKEY: apiKey,
          workorder_id: woId,
        }),
      );
    }
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

  const filteredList = (workorders || []).filter((item: WorkorderRequisition) => {
    const s = searchQuery.toLowerCase();
    const formattedWo = formatWorkOrderNumber(item).toLowerCase();
    const woNum = (
      item.workorder_ref ||
      item.workorder_no ||
      item.wo_number ||
      (item.workorder_id ? String(item.workorder_id) : '') ||
      (item.id ? String(item.id) : '') ||
      item.requisition_serial_no ||
      ''
    ).toLowerCase();
    const customer = (item.customer_name || item.client_name || item.service_name || '').toLowerCase();
    const location = (item.building_name || item.location_name || '').toLowerCase();
    const status = (item.status || item.req_status || '').toLowerCase();
    const date = item.requisition_date || item.created_at || item.date || '';

    return formattedWo.includes(s) || woNum.includes(s) || customer.includes(s) || location.includes(s) || status.includes(s) || date.includes(s);
  });

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

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading && !refreshing} />

      <View style={styles.mainContent}>
        <HeaderBar title="WORK ORDER REQUISITIONS" />

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search work order #, customer, status..."
            placeholderTextColor={colors.grey}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colors.grey} />
            </TouchableOpacity>
          )}
        </View>

        {/* Workorders List */}
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) =>
            item.workorder_id ? `wo-${item.workorder_id}` : `req-${item.id || index}`
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="assignment" size={48} color={colors.grey} />
                <Text style={styles.emptyTitle}>No Requisitions Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'No matching work orders found for your search.'
                    : 'There are no requisition work orders assigned to your account.'}
                </Text>
                <TouchableOpacity
                  style={styles.refreshEmptyBtn}
                  onPress={loadWorkorders}
                  activeOpacity={0.8}>
                  <MaterialIcons name="refresh" size={16} color={colors.white} />
                  <Text style={styles.refreshEmptyBtnText}>Check Again</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({item}) => {
            const woNumber = formatWorkOrderNumber(item);

            const customer = item.customer_name || item.client_name || item.service_name;
            const location = [item.building_name, item.location_name].filter(Boolean).join(' • ');
            const status = item.status || item.req_status || 'Active';
            const statusConfig = getStatusStyle(status);
            const dateStr = item.requisition_date || item.created_at || item.date;
            const itemCount = item.requisition_count || item.items_count || item.item_count;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => handleWorkorderPress(item)}>
                {/* Card Top Row: WO Number & Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.refRow}>
                    <MaterialIcons name="assignment" size={20} color={colors.primary} />
                    <Text style={styles.refText}>{woNumber}</Text>
                  </View>

                  <View style={[styles.statusBadge, {backgroundColor: statusConfig.bg}]}>
                    <MaterialIcons
                      name={statusConfig.icon}
                      size={12}
                      color={statusConfig.text}
                    />
                    <Text style={[styles.statusBadgeText, {color: statusConfig.text}]}>
                      {status}
                    </Text>
                  </View>
                </View>

                {/* Customer / Service Name if available */}
                {customer ? (
                  <View style={styles.customerRow}>
                    <MaterialIcons name="business" size={15} color="#64748B" />
                    <Text style={styles.customerNameText} numberOfLines={1}>
                      {customer}
                    </Text>
                  </View>
                ) : null}

                {/* Location / Building if available */}
                {location ? (
                  <View style={[styles.customerRow, {marginTop: 3}]}>
                    <MaterialIcons name="location-on" size={15} color={colors.secondary} />
                    <Text style={[styles.customerNameText, {color: colors.header}]} numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardDivider} />

                {/* Card Bottom Row: Date & View Items CTA */}
                <View style={styles.cardBody}>
                  <View style={styles.metaCol}>
                    {dateStr ? (
                      <View style={styles.infoRow}>
                        <MaterialIcons name="event" size={15} color={colors.grey} />
                        <Text style={styles.dateText}>
                          Date: <Text style={styles.dateValue}>{moment(dateStr).isValid() ? moment(dateStr).format('DD-MM-YYYY') : dateStr}</Text>
                        </Text>
                      </View>
                    ) : null}

                    {itemCount !== undefined && itemCount !== null ? (
                      <View style={[styles.infoRow, {marginTop: 3}]}>
                        <MaterialIcons name="inventory" size={15} color={colors.grey} />
                        <Text style={styles.dateText}>
                          Items: <Text style={styles.dateValue}>{itemCount}</Text>
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.viewItemsAction}>
                    <Text style={styles.viewItemsText}>View Items</Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Details Popup Modal */}
      <RequisitionDetailsModal
        visible={isDetailsModalVisible}
        onClose={handleCloseModal}
        workorder={selectedWorkorder}
        items={requisitionList}
        loading={requisitionListLoading}
        error={requisitionListError}
        onRetry={handleRetryDetails}
      />

      {showErrorModal && (
        <ErrorModal
          errorText={error}
          visible={showErrorModal}
          toggle={() => setShowErrorModal(false)}
        />
      )}
    </View>
  );
};

export default RequisitionHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  mainContent: {
    flex: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  refText: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    marginLeft: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  customerNameText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: '#475569',
    marginLeft: 6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginLeft: 6,
  },
  dateValue: {
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  viewItemsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  viewItemsText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  refreshEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  refreshEmptyBtnText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 6,
  },
});
