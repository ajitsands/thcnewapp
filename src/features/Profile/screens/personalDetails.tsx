import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {useAppSelector} from '../../../store';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';

export const PersonalDetails = ({form}: any) => {
  const {data, loading} = useAppSelector(state => state.profile);
  const {employeeCode} = useAppSelector(state => state.app);
  const profileDetails = data?.data[0];

  const getInitials = (name?: string) => {
    if (!name) return 'EMP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const InfoTile = ({icon, label, value}: {icon: string; label: string; value?: string}) => (
    <View style={styles.tile}>
      <View style={styles.tileIconBg}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.tileContent}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue}>{value || 'Not Provided'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <LoadingOverlay visible={loading} />

      {/* User Hero Avatar Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {getInitials(profileDetails?.employee_name)}
          </Text>
        </View>

        <Text style={styles.userName}>
          {profileDetails?.employee_name || 'Facility Staff'}
        </Text>

        <View style={styles.codeBadge}>
          <MaterialIcons name="badge" size={14} color={colors.secondary} />
          <Text style={styles.codeBadgeText}>EMP CODE: {employeeCode}</Text>
        </View>
      </View>

      {/* Contact Details Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>CONTACT INFORMATION</Text>
        
        <InfoTile
          icon="phone"
          label="MOBILE NUMBER"
          value={profileDetails?.employee_contact_no}
        />
        <InfoTile
          icon="phone-forwarded"
          label="EMERGENCY CONTACT"
          value={profileDetails?.emergency_contact_no}
        />
        <InfoTile
          icon="contact-phone"
          label="NATIVE CONTACT"
          value={profileDetails?.native_number}
        />
      </View>

      {/* Address Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>PERMANENT ADDRESS</Text>
        <InfoTile
          icon="home"
          label="ADDRESS"
          value={profileDetails?.native_address}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: '#F4F7FA',
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: scaleFont(22),
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  userName: {
    fontSize: scaleFont(18),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 6,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  codeBadgeText: {
    color: colors.white,
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    marginLeft: 4,
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
  sectionHeader: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.5,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tileIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tileContent: {
    flex: 1,
  },
  tileLabel: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 2,
  },
  tileValue: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
});
