import React, {useEffect, useState} from 'react';
import {
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
import {scaleFont} from '../../utils/helper';

interface WorkDetailProps {
  route: any;
}

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
                WO #{ticketDetails?.ticket_ref_code || '---'}
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
          {(ticketDetails?.ticket_image || ticketDetails?.second_ticket_image) ? (
            <View style={styles.photosRow}>
              {ticketDetails?.ticket_image ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.photoBox}
                  onPress={() => {
                    setShowImageView(true);
                    setImageUrl(ticketDetails?.ticket_image);
                  }}>
                  <Image
                    source={{uri: ticketDetails?.ticket_image}}
                    style={styles.photoThumb}
                  />
                  <View style={styles.zoomPill}>
                    <MaterialIcons name="zoom-in" size={14} color={colors.white} />
                    <Text style={styles.zoomPillText}>Photo 1</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {ticketDetails?.second_ticket_image ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.photoBox}
                  onPress={() => {
                    setShowImageView(true);
                    setImageUrl(ticketDetails?.second_ticket_image);
                  }}>
                  <Image
                    source={{uri: ticketDetails?.second_ticket_image}}
                    style={styles.photoThumb}
                  />
                  <View style={styles.zoomPill}>
                    <MaterialIcons name="zoom-in" size={14} color={colors.white} />
                    <Text style={styles.zoomPillText}>Photo 2</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
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
              <View style={{marginBottom: 10}}>
                <Text style={styles.detailLabel}>COMPLAINT DESCRIPTION</Text>
                <Text style={styles.descriptionText}>
                  {ticketDetails?.complaints_description}
                </Text>
              </View>
            ) : null}

            {ticketDetails?.additional_info ? (
              <View>
                <Text style={styles.detailLabel}>ADDITIONAL INFO</Text>
                <Text style={styles.descriptionText}>
                  {ticketDetails?.additional_info}
                </Text>
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
    width: 100,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
