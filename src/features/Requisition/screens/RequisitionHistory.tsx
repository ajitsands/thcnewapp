import React, {useEffect, useState} from 'react';
import {
  FlatList,
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
import {useAppSelector} from '../../../store';
import {ErrorModal} from '../../../core/components/errorModal';
import moment from 'moment';
import {scaleFont} from '../../../utils/helper';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {navigate} from '../../../navigators';

export const RequisitionHistory = () => {
  const {data, loading, error} = useAppSelector(
    state => state.requisitionHistory,
  );
  const historyData = data?.data || [];
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (error) {
      setShowModal(true);
    }
  }, [error]);

  const filteredHistory = historyData.filter((item: any) => {
    const s = searchQuery.toLowerCase();
    return (
      (item.requisition_serial_no && item.requisition_serial_no.toLowerCase().includes(s)) ||
      (item.status && item.status.toLowerCase().includes(s)) ||
      (item.requisition_date && item.requisition_date.includes(s))
    );
  });

  const getStatusStyle = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s.includes('APPROV') || s.includes('COMPLETE')) {
      return {bg: '#DCFCE7', text: '#15803D', icon: 'check-circle'};
    }
    if (s.includes('PENDING')) {
      return {bg: '#FEF9C3', text: '#A16207', icon: 'hourglass-empty'};
    }
    return {bg: '#DBEAFE', text: '#1D4ED8', icon: 'info'};
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <View style={styles.mainContent}>
        <HeaderBar title="REQUISITION HISTORY" />

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search requisition # or status..."
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

        {/* History Cards List */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => item.requisition_serial_no || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="assignment" size={48} color={colors.grey} />
                <Text style={styles.emptyTitle}>No Requisitions Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try entering a different serial number or check back later
                </Text>
              </View>
            ) : null
          }
          renderItem={({item}) => {
            const statusConfig = getStatusStyle(item.status);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => {
                  navigate('RequisitionScreen', {requisitionId: item.requisition_serial_no});
                }}>
                <View style={styles.cardHeader}>
                  <View style={styles.refRow}>
                    <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
                    <Text style={styles.refText}>
                      #{item.requisition_serial_no}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: statusConfig.bg},
                    ]}>
                    <MaterialIcons
                      name={statusConfig.icon}
                      size={12}
                      color={statusConfig.text}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {color: statusConfig.text},
                      ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="event" size={16} color={colors.grey} />
                    <Text style={styles.dateText}>
                      Date: <Text style={styles.dateValue}>{moment(item.requisition_date).format('DD-MM-YYYY')}</Text>
                    </Text>
                  </View>

                  <MaterialIcons name="chevron-right" size={24} color={colors.grey} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {showModal && (
        <ErrorModal
          errorText={error}
          visible={showModal}
          toggle={() => setShowModal(false)}
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
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refText: {
    fontSize: scaleFont(14),
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    marginTop: 4,
  },
});
