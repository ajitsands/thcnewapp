import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../themes/fonts';
import colors from '../../themes/colors';
import {scaleFont} from '../../utils/helper';

export type AppAlertType =
  | 'upcoming'
  | 'expired'
  | 'warning'
  | 'confirm'
  | 'success'
  | 'danger'
  | 'info';

export interface AppAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AppAlertProps {
  visible: boolean;
  type?: AppAlertType;
  title: string;
  message: string;
  badgeLabel?: string;
  iconName?: string;
  buttons?: AppAlertButton[];
  onClose?: () => void;
}

interface TypeTheme {
  primary: string;
  halo: string;
  haloInner: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  defaultBadge: string;
}

const TYPE_THEMES: Record<AppAlertType, TypeTheme> = {
  upcoming: {
    primary: '#2563EB',
    halo: '#DBEAFE',
    haloInner: '#BFDBFE',
    icon: 'schedule',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    defaultBadge: 'UPCOMING WINDOW',
  },
  expired: {
    primary: '#DC2626',
    halo: '#FEE2E2',
    haloInner: '#FECACA',
    icon: 'lock-clock',
    badgeBg: '#FEF2F2',
    badgeText: '#B91C1C',
    defaultBadge: 'DEADLINE EXPIRED',
  },
  warning: {
    primary: '#D97706',
    halo: '#FEF3C7',
    haloInner: '#FDE68A',
    icon: 'warning',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
    defaultBadge: 'ATTENTION REQUIRED',
  },
  confirm: {
    primary: colors.primary || '#0B2C51',
    halo: '#E0E7FF',
    haloInner: '#C7D2FE',
    icon: 'help-outline',
    badgeBg: '#EEF2FF',
    badgeText: '#3730A3',
    defaultBadge: 'CONFIRMATION',
  },
  success: {
    primary: '#059669',
    halo: '#D1FAE5',
    haloInner: '#A7F3D0',
    icon: 'check-circle',
    badgeBg: '#ECFDF5',
    badgeText: '#065F46',
    defaultBadge: 'COMPLETED',
  },
  danger: {
    primary: '#DC2626',
    halo: '#FEE2E2',
    haloInner: '#FECACA',
    icon: 'block',
    badgeBg: '#FEF2F2',
    badgeText: '#B91C1C',
    defaultBadge: 'SUBMISSION DISABLED',
  },
  info: {
    primary: '#3B82F6',
    halo: '#DBEAFE',
    haloInner: '#BFDBFE',
    icon: 'info-outline',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    defaultBadge: 'SYSTEM NOTICE',
  },
};

export const AppAlertModal: React.FC<AppAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  badgeLabel,
  iconName,
  buttons,
  onClose,
}) => {
  const theme = TYPE_THEMES[type] || TYPE_THEMES.info;
  const activeIcon = iconName || theme.icon;
  const displayBadge = badgeLabel || theme.defaultBadge;

  const defaultButtons: AppAlertButton[] = [
    {
      text: 'UNDERSTOOD',
      style: 'default',
      onPress: onClose,
    },
  ];

  const actionButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;
  const isMultiButton = actionButtons.length > 1;

  return (
    <Modal
      isVisible={visible}
      useNativeDriver={true}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={240}
      animationOutTiming={180}
      backdropOpacity={0.65}
      backdropTransitionOutTiming={0}
      onBackdropPress={() => {
        if (onClose) {
          onClose();
        }
      }}
      style={styles.modalBackdrop}>
      <View style={styles.cardContainer}>
        {/* Glow Header Accent Bar */}
        <View style={[styles.topAccentBar, {backgroundColor: theme.primary}]} />

        <View style={styles.cardInner}>
          {/* Layered Glowing Circular Icon */}
          <View style={[styles.outerHalo, {backgroundColor: theme.halo}]}>
            <View style={[styles.innerHalo, {backgroundColor: theme.haloInner}]}>
              <View style={[styles.iconCircle, {backgroundColor: theme.primary}]}>
                <MaterialIcons name={activeIcon} size={28} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Status Badge Capsule */}
          <View style={[styles.statusBadge, {backgroundColor: theme.badgeBg}]}>
            <Text style={[styles.statusBadgeText, {color: theme.badgeText}]}>
              {displayBadge}
            </Text>
          </View>

          {/* Dialog Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Dialog Message Card */}
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttonsRow, isMultiButton ? styles.buttonsMultiRow : styles.buttonsSingleRow]}>
            {actionButtons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const btnBgColor = isCancel
                ? '#F1F5F9'
                : isDestructive
                ? '#DC2626'
                : theme.primary;
              const btnTextColor = isCancel ? '#475569' : '#FFFFFF';

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.82}
                  style={[
                    styles.actionButton,
                    isMultiButton && (isCancel ? styles.cancelButtonFlex : styles.confirmButtonFlex),
                    {backgroundColor: btnBgColor},
                    !isCancel && styles.elevatedButton,
                  ]}
                  onPress={() => {
                    if (btn.onPress) {
                      btn.onPress();
                    } else if (onClose) {
                      onClose();
                    }
                  }}>
                  <Text style={[styles.buttonText, {color: btnTextColor}]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppAlertModal;

const styles = StyleSheet.create({
  modalBackdrop: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  topAccentBar: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  outerHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  innerHalo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusBadgeText: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: scaleFont(17),
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  messageText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: '#334155',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsSingleRow: {
    justifyContent: 'center',
  },
  buttonsMultiRow: {
    justifyContent: 'space-between',
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  elevatedButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  cancelButtonFlex: {
    flex: 1,
    marginRight: 10,
  },
  confirmButtonFlex: {
    flex: 1.25,
  },
  buttonText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
});
