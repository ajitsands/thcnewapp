import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {HeaderBar} from '../../core/components/headerBar';
import {FontFamily} from '../../themes/fonts';
import {useAppDispatch, useAppSelector} from '../../store';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {getTeamDetails} from '../../store/reducers/getTeam';
import {ImageView} from '../../core/components/imageView';
import {useToast} from 'react-native-toast-notifications';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {formatImageUrl, scaleFont} from '../../utils/helper';

interface WorkDetailProps {
  route: any;
}

const PhotoThumbnail = ({
  rawUrl,
  label,
  onPress,
}: {
  rawUrl?: string | null;
  label: string;
  onPress: (url: string) => void;
}) => {
  const formattedUrl = formatImageUrl(rawUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  console.log(`[PhotoThumbnail - ${label}] rawUrl:`, rawUrl, '-> formattedUrl:', formattedUrl);

  if (!formattedUrl) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.photoBox}
      onPress={() => onPress(formattedUrl)}>
      {error ? (
        <View style={styles.photoErrorBox}>
          <MaterialIcons name="broken-image" size={22} color="#94A3B8" />
          <Text style={styles.photoErrorText}>Image Error</Text>
        </View>
      ) : (
        <>
          <Image
            source={{uri: formattedUrl}}
            style={styles.photoThumb}
            resizeMode="cover"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={e => {
              console.log(`[PhotoThumbnail - ${label}] Image load ERROR for:`, formattedUrl, 'NativeEvent:', e.nativeEvent);
              setLoading(false);
              setError(true);
            }}
          />
          {loading && (
            <View style={styles.photoLoaderBox}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          )}
        </>
      )}
      <View style={styles.zoomPill}>
        <MaterialIcons name="zoom-in" size={14} color={colors.white} />
        <Text style={styles.zoomPillText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const WorkDetails = (props: WorkDetailProps) => {
  const {route} = props;
  const date = route?.params?.date;
  const [showImageView, setShowImageView] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const {data, loading, error} = useAppSelector(state => state.tickets);
  const {employeeCode, apiKey} = useAppSelector(state => state.app);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const ticketDetails = data?.data[0];

  const hasPhoto1 = Boolean(formatImageUrl(ticketDetails?.ticket_image));
  const hasPhoto2 = Boolean(formatImageUrl(ticketDetails?.second_ticket_image));

  useEffect(() => {
    if (error) {
      toast.show(error);
    }
  }, [error]);

  const handleTeamDetails = () => {
    dispatch(
      getTeamDetails({
        action: 'get_team_of_visit',
        APIKEY: apiKey,
        visit_date: date,
        amc_ticket_ref_no: ticketDetails?.ticket_ref_code,
        amc_tkt_id: ticketDetails?.ticket_id,
      }),
    );
  };

  const isEmergency = ticketDetails?.ticket_priority === 'Emergency';

  const renderBulletList = (text?: string) => {
    if (!text) return null;

    if (text.includes('*')) {
      const items = text
        .split('*')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      return (
        <View style={styles.bulletContainer}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    return <Text style={styles.descriptionText}>{text}</Text>;
  };

  const DetailGridRow = ({icon, label, value}: {icon: string; label: string; value?: string}) => (
    <View style={styles.detailTile}>
      <MaterialIcons name={icon} size={18} color={colors.primary} style={{marginRight: 8}} />
      <View style={{flex: 1}}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderBar title="WORK ORDER DETAILS" />

        {/* Hero Ticket Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.ticketRefBadge}>
              <MaterialIcons name="assignment" size={18} color={colors.white} />
              <Text style={styles.ticketRefText}>
                WO #{ticketDetails?.ticket_ref_code ? `${ticketDetails.ticket_ref_code}-${ticketDetails.ticket_id}` : '---'}
              </Text>
            </View>

            {/* Priority Pill */}
            <View
              style={[
                styles.priorityBadge,
                {backgroundColor: isEmergency ? '#FEE2E2' : '#DBEAFE'},
              ]}>
              <MaterialIcons
                name={isEmergency ? 'warning' : 'info'}
                size={14}
                color={isEmergency ? colors.red : colors.primary}
              />
              <Text
                style={[
                  styles.priorityText,
                  {color: isEmergency ? colors.red : colors.primary},
                ]}>
                {isEmergency ? 'EMERGENCY' : 'NORMAL'}
              </Text>
            </View>
          </View>

          {/* Ticket Photos Preview Section */}
          {(hasPhoto1 || hasPhoto2) ? (
            <View style={styles.photosRow}>
              <PhotoThumbnail
                rawUrl={ticketDetails?.ticket_image}
                label="Photo 1"
                onPress={url => {
                  setImageUrl(url);
                  setShowImageView(true);
                }}
              />
              <PhotoThumbnail
                rawUrl={ticketDetails?.second_ticket_image}
                label="Photo 2"
                onPress={url => {
                  setImageUrl(url);
                  setShowImageView(true);
                }}
              />
            </View>
          ) : null}
        </View>

        {/* Customer & Location Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="person-pin" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Customer & Location</Text>
          </View>

          <DetailGridRow
            icon="person"
            label="CUSTOMER NAME"
            value={`${ticketDetails?.customer_name || ''} [${ticketDetails?.customer_code || ''}]`}
          />
          <DetailGridRow
            icon="phone"
            label="CUSTOMER CONTACT"
            value={ticketDetails?.customer_contact_no}
          />
          <DetailGridRow
            icon="location-on"
            label="LOCATION"
            value={ticketDetails?.location_name}
          />
          <DetailGridRow
            icon="apartment"
            label="BUILDING"
            value={ticketDetails?.building_name}
          />
        </View>

        {/* Work Order Specifications */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="build" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Job Information</Text>
          </View>

          <DetailGridRow
            icon="category"
            label="CATEGORY"
            value={ticketDetails?.category_name}
          />
          <DetailGridRow
            icon="alt-route"
            label="TYPE"
            value={ticketDetails?.type_name}
          />
          <DetailGridRow
            icon="qr-code"
            label="ASSET CODE"
            value={ticketDetails?.asset_code}
          />
          <DetailGridRow
            icon="work"
            label="JOB CATEGORY"
            value={ticketDetails?.job_category}
          />
          <DetailGridRow
            icon="room-service"
            label="SERVICE REQUEST"
            value={ticketDetails?.service_request}
          />
        </View>

        {/* Description & Additional Info Card */}
        {(ticketDetails?.complaints_description || ticketDetails?.additional_info) ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="description" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Complaints & Info</Text>
            </View>

            {ticketDetails?.complaints_description ? (
              <View style={{marginBottom: 12}}>
                <Text style={styles.detailLabel}>COMPLAINT DESCRIPTION</Text>
                {renderBulletList(ticketDetails?.complaints_description)}
              </View>
            ) : null}

            {ticketDetails?.additional_info ? (
              <View>
                <Text style={styles.detailLabel}>ADDITIONAL INFO</Text>
                {renderBulletList(ticketDetails?.additional_info)}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Next Action Floating Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.teamButton}
          onPress={handleTeamDetails}>
          <MaterialIcons name="groups" size={22} color={colors.white} />
          <Text style={styles.teamButtonText}>VIEW TEAM MEMBERS & ATTENDANCE</Text>
          <MaterialIcons name="chevron-right" size={24} color={colors.white} />
        </TouchableOpacity>
      </ScrollView>

      {showImageView && (
        <ImageView
          visible={showImageView}
          toggle={() => setShowImageView(false)}
          imageUrl={imageUrl}
        />
      )}
    </View>
  );
};

export default WorkDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketRefText: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    marginLeft: 4,
  },
  photosRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  photoBox: {
    width: 105,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoLoaderBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  photoErrorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 4,
  },
  photoErrorText: {
    color: '#94A3B8',
    fontSize: scaleFont(8),
    fontFamily: FontFamily.bold,
    marginTop: 2,
    textAlign: 'center',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoomPillText: {
    color: colors.white,
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
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
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 8,
  },
  detailTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: scaleFont(9),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  descriptionText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: colors.header,
    lineHeight: 20,
    marginTop: 4,
  },
  bulletContainer: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.header,
    lineHeight: 20,
  },
  teamButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  teamButtonText: {
    color: colors.white,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    flex: 1,
    marginLeft: 10,
  },
});
