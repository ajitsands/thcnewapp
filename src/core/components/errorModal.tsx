import React from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import colors from '../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont} from '../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../themes/fonts';

interface ModalProps {
  visible: boolean;
  toggle: () => void;
  errorText: string;
}

export const ErrorModal = (props: ModalProps) => {
  const {visible, toggle, errorText} = props;

  return (
    <Modal
      isVisible={visible}
      useNativeDriver={true}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onBackdropPress={() => toggle()}
      backdropOpacity={0.5}>
      <View style={styles.modalContent}>
        {/* Top Handle Indicator */}
        <View style={styles.handleBar} />

        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="info" color={colors.primary} size={22} />
            <Text style={styles.headerTitle}>System Message</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => toggle()}>
            <MaterialIcons name="close" color={colors.grey} size={20} />
          </TouchableOpacity>
        </View>

        {/* Message Content Container */}
        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="notifications-active" color={colors.primary} size={24} />
          </View>
          <Text style={styles.messageText}>{errorText || 'Notice'}</Text>
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionBtn}
          onPress={() => toggle()}>
          <Text style={styles.actionBtnText}>GOT IT</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ErrorModal;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.header,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(16),
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(13),
    color: colors.header,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  actionBtnText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(14),
    letterSpacing: 0.5,
  },
});
