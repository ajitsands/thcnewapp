import React, {useState} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import colors from '../../../themes/colors';
import {scaleFont} from '../../../utils/helper';
import {FontFamily} from '../../../themes/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {navigate} from '../../../navigators';
import {useAppDispatch, useAppSelector} from '../../../store';
import {useToast} from 'react-native-toast-notifications';

interface AssetModalProps {
  visible: boolean;
  toggle: () => void;
}

const AssetModal = (props: AssetModalProps) => {
  const {visible, toggle} = props;
  const [assetCode, setAssetCode] = useState('');
  const toast = useToast();

  const getAssetInfo = () => {
    toggle();
    if (!assetCode.trim()) {
      toast.show('Please enter an asset number', {
        style: styles.toast,
      });
    } else {
      navigate('AssetDetails', {assetCode: assetCode.trim()});
    }
  };

  return (
    <Modal
      isVisible={visible}
      useNativeDriver={true}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
      onBackdropPress={() => toggle()}
      backdropOpacity={0.5}>
      <View style={styles.modalContent}>
        {/* Modal Handle Bar */}
        <View style={styles.handleBar} />

        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="edit-note" color={colors.primary} size={24} />
            <Text style={styles.headerTitle}>Manual Asset Entry</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => toggle()}>
            <MaterialIcons name="close" color={colors.grey} size={22} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>
          Enter the asset code manually to fetch detailed information
        </Text>

        {/* Input Wrapper */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="qr-code" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            placeholder="e.g. THC-C0001-CY-1001"
            placeholderTextColor={colors.grey}
            style={styles.input}
            onChangeText={(text: string) => setAssetCode(text)}
            value={assetCode}
            autoCapitalize="characters"
            autoFocus
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.infoButton}
          onPress={getAssetInfo}>
          <MaterialIcons name="search" size={20} color={colors.white} />
          <Text style={styles.infoButtonText}>GET ASSET INFORMATION</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default AssetModal;

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
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.header,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(17),
    marginLeft: 8,
  },
  subTitle: {
    color: colors.grey,
    fontFamily: FontFamily.regular,
    fontSize: scaleFont(12),
    marginBottom: 18,
  },
  closeBtn: {
    padding: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  infoButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  infoButtonText: {
    color: colors.white,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  toast: {
    bottom: 50,
  },
});
