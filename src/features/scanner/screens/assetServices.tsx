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

                    <Text
                      style={[
                        styles.serviceTitleText,
                        isSelected && styles.selectedServiceTitleText,
                      ]}>
                      {service.service_description}
                    </Text>

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
  serviceTitleText: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  selectedServiceTitleText: {
    color: colors.white,
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
