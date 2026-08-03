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
import {useAppDispatch, useAppSelector} from '../../../store';
import {ErrorModal} from '../../../core/components/errorModal';
import {scaleFont} from '../../../utils/helper';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {getTicketDetails} from '../../../store/reducers/getTicketDetails';

export const HistoryScreen = () => {
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const {data, loading, error} = useAppSelector(state => state.history);
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const ticketLoading = useAppSelector(state => state.tickets.loading);
  const historyData = data?.data || [];

  useEffect(() => {
    if (error) {
      setShowModal(true);
    }
  }, [error]);

  // Filtered List based on Search & Status Filter
  const filteredHistory = historyData.filter((item: any) => {
    const matchesSearch =
      (item.ticket_ref_no &&
        item.ticket_ref_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.visit_date && item.visit_date.includes(searchQuery));

    if (selectedFilter === 'ALL') return matchesSearch;
    return (
      matchesSearch &&
      item.ticket_status &&
      item.ticket_status.toUpperCase() === selectedFilter.toUpperCase()
    );
  });

  const getStatusColor = (statusText: string) => {
    const s = (statusText || '').toUpperCase();
    if (s.includes('COMPLETE') || s.includes('CLOSED')) {
      return {bg: '#DCFCE7', text: '#15803D', icon: 'check-circle'};
    }
    if (s.includes('PENDING') || s.includes('SCHEDULED')) {
      return {bg: '#FEF9C3', text: '#A16207', icon: 'schedule'};
    }
    if (s.includes('PROGRESS') || s.includes('START')) {
      return {bg: '#DBEAFE', text: '#1D4ED8', icon: 'sync'};
    }
    return {bg: '#F1F5F9', text: colors.header, icon: 'info'};
  };

  const handleTicketPress = (item: any) => {
    dispatch(
      getTicketDetails({
        action: 'get_amc_ticket_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
        visit_date: item.visit_date,
        amc_ticket_ref_no: item.ticket_ref_no,
      }),
    );
  };

  const filterOptions = ['ALL', 'COMPLETED', 'PENDING', 'IN PROGRESS'];

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading || ticketLoading} />

      <View style={styles.mainContent}>
        <HeaderBar title="WORK ORDER HISTORY" />

        {/* Search Input Bar */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by Work Order # or Date..."
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

        {/* Filter Badges Carousel */}
        <View style={styles.filterContainer}>
          {filterOptions.map(filter => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedFilter(filter)}>
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History List */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => item.ticket_ref_no || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="history" size={48} color={colors.grey} />
                <Text style={styles.emptyTitle}>No History Records Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try clearing search filters or check back later
                </Text>
              </View>
            ) : null
          }
          renderItem={({item}) => {
            const statusConfig = getStatusColor(item.ticket_status);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.historyCard}
                onPress={() => handleTicketPress(item)}>
                <View style={styles.cardHeader}>
                  <View style={styles.ticketRefRow}>
                    <MaterialIcons name="assignment" size={18} color={colors.primary} />
                    <Text style={styles.ticketRefText}>{item.ticket_ref_no}</Text>
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
                      {item.ticket_status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="event" size={16} color={colors.grey} />
                    <Text style={styles.dateText}>
                      Date: <Text style={styles.dateValue}>{item.visit_date}</Text>
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

export default HistoryScreen;

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
    marginBottom: 8,
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
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  historyCard: {
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
  ticketRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketRefText: {
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
