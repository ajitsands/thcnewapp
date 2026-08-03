import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import colors from '../../../themes/colors';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont, screenHeight, screenWidth} from '../../../utils/helper';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getAssetDetails,
  resetError,
} from '../../../store/reducers/assetReducers/getAssetDetails';
import {useToast} from 'react-native-toast-notifications';
import {navigationRef} from '../../../navigators/navRef';
import {ImageView} from '../../../core/components/imageView';
import {AssetServices} from './assetServices';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import MaterialIcons from '@react-native-vector-icons/material-icons';

interface AssetProps {
  route: any;
}

export const AssetDetails = (props: AssetProps) => {
  const {route} = props;
  const assetCode = route?.params?.assetCode || '';
  const [pageNumber, setPageNumber] = useState(0);
  const [serviceImage, setServiceImage] = useState('');
  
  const {assets, assetsLoading, assetsError, assetsStatus} = useAppSelector(
    state => state.assetDetails,
  );
  const {
    assetServicesImages,
    assetServiceImagesStatus,
  } = useAppSelector(state => state.assetDetails);
  
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const assetDetails = assets?.data[0];
  const [showImageModal, setShowImageModal] = useState(false);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(
      getAssetDetails({
        action: 'get_asset_basic_details',
        APIKEY: apiKey,
        emp_code: employeeCode,
        asset_code: assetCode.trim(),
      }),
    );
  }, [assetCode]);

  useEffect(() => {
    if (assetsStatus === 'failed' && assetsError) {
      navigationRef.goBack();
      toast.show(assetsError);
      dispatch(resetError());
    }
  }, [assetsStatus]);

  const handleSlide = (newPage: number) => {
    if (newPage < 0 || newPage > 1) return;
    Animated.timing(translateX, {
      toValue: -screenWidth * newPage,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setPageNumber(newPage);
  };

  const FieldRow = ({label, value, icon}: {label: string; value?: string; icon?: string}) => (
    <View style={styles.fieldItem}>
      {icon && <MaterialIcons name={icon} size={16} color={colors.primary} style={{marginRight: 6}} />}
      <View style={{flex: 1}}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={assetsLoading} />

      <View style={styles.mainWrapper}>
        <HeaderBar title="ASSET DETAILS" isAssetDetails={true} />

        {/* Tab Segment Controls */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabButton, pageNumber === 0 && styles.tabButtonActive]}
            onPress={() => handleSlide(0)}>
            <MaterialIcons
              name="info"
              size={18}
              color={pageNumber === 0 ? colors.white : colors.primary}
            />
            <Text
              style={[
                styles.tabText,
                pageNumber === 0 && styles.tabTextActive,
              ]}>
              Basic Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabButton, pageNumber === 1 && styles.tabButtonActive]}
            onPress={() => handleSlide(1)}>
            <MaterialIcons
              name="build"
              size={18}
              color={pageNumber === 1 ? colors.white : colors.primary}
            />
            <Text
              style={[
                styles.tabText,
                pageNumber === 1 && styles.tabTextActive,
              ]}>
              Asset Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sliding Content Pages */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.slider,
              {
                transform: [{translateX}],
              },
            ]}>
            {/* PAGE 0: BASIC DETAILS */}
            <View style={styles.pageCard}>
              {/* Asset Hero Header */}
              <View style={styles.heroBanner}>
                <TouchableOpacity
                  disabled={pageNumber === 0}
                  onPress={() => handleSlide(pageNumber - 1)}
                  style={styles.arrowButton}>
                  <MaterialIcons name="chevron-left" size={26} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.heroInfo}>
                  <Text style={styles.heroBadgeTitle}>ASSET NUMBER</Text>
                  <Text style={styles.heroCodeText}>{assetCode}</Text>
                </View>

                <TouchableOpacity
                  disabled={pageNumber === 1}
                  onPress={() => handleSlide(pageNumber + 1)}
                  style={styles.arrowButton}>
                  <MaterialIcons name="chevron-right" size={26} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Attachment Image Preview Card */}
              {assetDetails?.asset_attachment ? (
                <View style={styles.attachmentCard}>
                  <Text style={styles.sectionHeaderTitle}>ASSET PHOTO</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.photoContainer}
                    onPress={() => setShowImageModal(true)}>
                    <Image
                      source={{uri: assetDetails?.asset_attachment}}
                      style={styles.photoImage}
                    />
                    <View style={styles.zoomBadge}>
                      <MaterialIcons name="zoom-in" size={18} color={colors.white} />
                      <Text style={styles.zoomText}>View</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Section 1: Customer & Location */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="location-on" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Location & Customer</Text>
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="CUSTOMER NAME" value={assetDetails?.customer_name} />
                  <FieldRow label="CUSTOMER CODE" value={assetDetails?.customer_code} />
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="BUILDING" value={assetDetails?.asset_building} />
                  <FieldRow label="LOCATION" value={assetDetails?.asset_location} />
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="ZONE / FLOOR" value={assetDetails?.zone_floor} />
                  <FieldRow label="FLAT / AREA CODE" value={assetDetails?.flat_area_code} />
                  <FieldRow label="ROOM NO" value={assetDetails?.room_no} />
                </View>
              </View>

              {/* Section 2: Asset Specifications */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="category" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Specifications</Text>
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="CATEGORY" value={assetDetails?.asset_category_name} />
                  <FieldRow label="TYPE" value={assetDetails?.asset_type_name} />
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="BRAND" value={assetDetails?.asset_brand} />
                  <FieldRow label="MODEL / SERIAL NO" value={assetDetails?.asset_serial_no} />
                  <FieldRow label="CAPACITY" value={assetDetails?.asset_capacity} />
                </View>
              </View>

              {/* Section 3: Warranty Details */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="verified" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Warranty Status</Text>
                </View>
                <View style={styles.gridRow}>
                  <FieldRow label="WARRANTY / GUARANTEE" value={assetDetails?.is_warentee} />
                  <FieldRow label="END DATE" value={assetDetails?.warentee_end_date} />
                </View>
              </View>

              {/* Section 4: Description */}
              {assetDetails?.asset_description ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialIcons name="description" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Description</Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {assetDetails?.asset_description}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* PAGE 1: ASSET SERVICES */}
            <View style={styles.pageCard}>
              <AssetServices code={assetCode} />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Service Gallery Images Footer */}
        {pageNumber === 1 && assetServiceImagesStatus === 'success' && (
          <View style={styles.galleryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assetServicesImages?.data?.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowImageModal(true);
                    setServiceImage(item.service_image_name);
                  }}>
                  <Image
                    source={{uri: item.service_image_name}}
                    style={styles.galleryImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Image Modal Viewer */}
      {showImageModal && (
        <ImageView
          visible={showImageModal}
          imageUrl={
            pageNumber === 0 ? assetDetails?.asset_attachment : serviceImage
          }
          toggle={() => setShowImageModal(false)}
        />
      )}
    </View>
  );
};

export default AssetDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  mainWrapper: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  slider: {
    flexDirection: 'row',
    width: screenWidth * 2,
  },
  pageCard: {
    width: screenWidth - 32,
    marginHorizontal: 16,
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    alignItems: 'center',
  },
  heroBadgeTitle: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  heroCodeText: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginTop: 2,
  },
  attachmentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderTitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 10,
  },
  photoContainer: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(11, 44, 81, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  zoomText: {
    color: colors.white,
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 8,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  fieldItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldLabel: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  descriptionText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: colors.header,
    lineHeight: 20,
  },
  galleryContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  galleryImage: {
    height: 56,
    width: 56,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
