import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {Loader} from '../../../core/components/loader';
import AudioPlayerUI from '../../jobDetails/components/audioPlayer';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getAssetServiceDetails,
  getAssetServiceImages,
  resetAssetServiceError,
} from '../../../store/reducers/assetReducers/getAssetDetails';
import {useToast} from 'react-native-toast-notifications';
import {scaleFont} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import moment from 'moment';

interface serviceProps {
  code: string;
}

export const AssetServices = (props: serviceProps) => {
  const {code} = props;
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const toast = useToast();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {
    assetServiceStatus,
    assetServiceError,
    assetServices,
    assetServiceLoading,
  } = useAppSelector(state => state.assetDetails);

  const serviceDetails = assetServices?.data || [];

  useEffect(() => {
    dispatch(
      getAssetServiceDetails({
        action: 'get_asset_service_details',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: code,
      }),
    );
    dispatch(
      getAssetServiceImages({
        action: 'get_asset_service_images',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: code,
      }),
    );
  }, []);

  useEffect(() => {
    if (assetServiceStatus === 'failed' && assetServiceError) {
      toast.show(assetServiceError);
      dispatch(resetAssetServiceError());
    }
  }, [assetServiceStatus]);

  // Select first service by default if available
  useEffect(() => {
    if (serviceDetails.length > 0 && selectedServiceIndex === null) {
      setSelectedServiceIndex(0);
      setSelectedService(serviceDetails[0]);
    }
  }, [serviceDetails]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = moment(dateStr);
    return parsed.isValid() ? parsed.format('DD MMM YYYY') : dateStr;
  };

  return (
    <View style={styles.container}>
      {assetServiceLoading ? (
        <View style={styles.loaderContainer}>
          <Loader />
        </View>
      ) : serviceDetails.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <MaterialIcons name="build-circle" size={48} color={colors.grey} />
          <Text style={styles.emptyTitle}>No Service History</Text>
          <Text style={styles.emptySubtitle}>
            There are no recorded service logs for asset #{code}
          </Text>
        </View>
      ) : (
        <>
          {/* Services Checklist Header */}
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="build" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Asset Service Records ({serviceDetails.length})</Text>
          </View>

          {/* Service Items List */}
          <View style={styles.servicesList}>
            {serviceDetails.map((service: any, index: number) => {
              const isSelected = selectedServiceIndex === index;
              const serviceDate =
                service.visit_date ||
                service.service_date ||
                service.date ||
                service.created_at;
              const technicianName =
                service.emp_name ||
                service.employee_name ||
                service.tech_name ||
                service.user_name ||
                service.created_by;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  style={[
                    styles.serviceCard,
                    isSelected && styles.selectedServiceCard,
                  ]}
                  onPress={() => {
                    setSelectedServiceIndex(index);
                    setSelectedService(service);
                  }}>
                  <View style={styles.serviceRow}>
                    <View
                      style={[
                        styles.indexBadge,
                        isSelected && styles.selectedIndexBadge,
                      ]}>
                      <Text
                        style={[
                          styles.indexBadgeText,
                          isSelected && styles.selectedIndexBadgeText,
                        ]}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.serviceInfoCol}>
                      <Text
                        style={[
                          styles.serviceTitleText,
                          isSelected && styles.selectedServiceTitleText,
                        ]}>
                        {service.service_description}
                      </Text>

                      {/* Meta Tags: Date & Performed By */}
                      <View style={styles.metaRow}>
                        {serviceDate ? (
                          <View style={styles.metaBadge}>
                            <MaterialIcons
                              name="event"
                              size={13}
                              color={isSelected ? colors.white : colors.primary}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                isSelected && styles.selectedMetaText,
                              ]}>
                              {formatDate(serviceDate)}
                            </Text>
                          </View>
                        ) : null}

                        {technicianName ? (
                          <View style={styles.metaBadge}>
                            <MaterialIcons
                              name="person"
                              size={13}
                              color={isSelected ? colors.white : colors.primary}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                isSelected && styles.selectedMetaText,
                              ]}>
                              {technicianName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <MaterialIcons
                      name={isSelected ? 'check-circle' : 'chevron-right'}
                      size={20}
                      color={isSelected ? colors.white : colors.grey}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Service Remarks & Audio Section */}
          {selectedService && (
            <View style={styles.remarksCard}>
              <View style={styles.remarksHeaderRow}>
                <MaterialIcons name="edit-note" size={20} color={colors.primary} />
                <Text style={styles.remarksTitle}>Technician Remarks & Voice Note</Text>
              </View>

              {/* Technician & Date Header in Remarks Card */}
              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>PERFORMED BY</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedService?.emp_name ||
                      selectedService?.employee_name ||
                      selectedService?.tech_name ||
                      selectedService?.user_name ||
                      selectedService?.created_by ||
                      'Technician'}
                  </Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>SERVICE DATE</Text>
                  <Text style={styles.detailMetaValue}>
                    {formatDate(
                      selectedService?.visit_date ||
                        selectedService?.service_date ||
                        selectedService?.date ||
                        selectedService?.created_at,
                    )}
                  </Text>
                </View>
              </View>

              <TextInput
                editable={false}
                multiline
                style={styles.remarksInput}
                value={selectedService?.tech_remarks || 'No remarks recorded for this service.'}
              />

              <AudioPlayerUI
                isAssets={true}
                track={selectedService?.tech_audio_file}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default AssetServices;

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: scaleFont(16),
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 6,
  },
  servicesList: {
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  selectedServiceCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedIndexBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indexBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  selectedIndexBadgeText: {
    color: colors.white,
  },
  serviceInfoCol: {
    flex: 1,
  },
  serviceTitleText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  selectedServiceTitleText: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginLeft: 4,
  },
  selectedMetaText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  remarksCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  remarksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  remarksTitle: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 6,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailMetaItem: {
    flex: 1,
  },
  detailMetaLabel: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 2,
  },
  detailMetaValue: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
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
    height: 80,
    marginBottom: 10,
  },
});
