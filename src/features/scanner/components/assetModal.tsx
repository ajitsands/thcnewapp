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
import {scaleFont, screenHeight} from '../../../utils/helper';
import {FontFamily} from '../../../themes/fonts';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {navigate} from '../../../navigators';
import {useAppDispatch, useAppSelector} from '../../../store';
import {getAssetDetails} from '../../../store/reducers/assetReducers/getAssetDetails';
import {useToast} from 'react-native-toast-notifications';

interface AssetModalProps {
  visible: boolean;
  toggle: () => void;
}
const AssetModal = (props: AssetModalProps) => {
  const {visible, toggle} = props;
  const [assetCode, setAssetCode] = useState('');
  const dispatch = useAppDispatch();
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const toast = useToast();

  const getAssetInfo = () => {
    toggle()
    if (!assetCode) {
      toast.show('Please enter an asset number', {
        style: styles.toast, // not {styles.toast}
      });
      
    } else {
     navigate('AssetDetails',{assetCode:assetCode})
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
      backdropOpacity={0.6}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <View style={styles.headingContainer}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <MaterialIcons name="message" color={colors.white} size={20} />
              <Text style={styles.assetText}>Asset Number</Text>
            </View>
            <TouchableOpacity style={styles.cancel} onPress={() => toggle()}>
              <MaterialIcons
                name="minimize"
                color={colors.primary}
                size={20}
                style={{top: -6}}
              />
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          placeholder="ASSET NUMBER"
          style={styles.assetButton}
          onChangeText={(text: any) => setAssetCode(text)}
          focusable
        />
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => getAssetInfo()}>
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
    margin: 10,
    marginBottom: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    height: screenHeight * 0.25,
    borderRadius: Platform.OS == 'ios' ? 30 : 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoButton: {
    marginHorizontal: 20,
    backgroundColor: '#33485E',
    borderWidth: 3,
    borderColor: '#959595',
    borderRadius: 12,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
  },
  assetButton: {
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: '#959595',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 20,
    color: colors.primary,
    fontSize:scaleFont(18),
    padding: 5,
    // marginHorizontal:20,
    margin: 10,
    fontFamily: FontFamily.deupRegular,
    textAlign: 'center',
  },
  cancel: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetText: {
    color: colors.white,
    fontFamily: FontFamily.medium,
    fontSize:scaleFont(16),
    marginLeft: 10,
  },
  header: {
    backgroundColor: colors.primary,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  toast:{
    bottom:50
  }
});
