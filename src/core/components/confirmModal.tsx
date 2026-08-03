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
  onConfirm: () => void;
}

export const ConfirmModal = (props: ModalProps) => {
  const {visible, toggle, errorText, onConfirm} = props;

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
        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="help-outline" color={colors.primary} size={22} />
            <Text style={styles.headerTitle}>Confirmation Required</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => toggle()}>
            <MaterialIcons name="close" color={colors.grey} size={20} />
          </TouchableOpacity>
        </View>

        {/* Body Message Card */}
        <View style={styles.body}>
          <Text style={styles.messageText}>{errorText || 'Are you sure you want to proceed?'}</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cancelBtn}
            onPress={() => toggle()}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.confirmBtn}
            onPress={() => {
              toggle();
              onConfirm();
            }}>
            <Text style={styles.confirmBtnText}>CONFIRM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;

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
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  messageText: {
    fontFamily: FontFamily.medium,
    fontSize: scaleFont(14),
    color: colors.header,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: colors.header,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(13),
  },
  confirmBtn: {
    flex: 1,
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
  confirmBtnText: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(13),
    letterSpacing: 0.5,
  },
});
