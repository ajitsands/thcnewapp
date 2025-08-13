import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ProfileTabs} from '../components/profileTab';
import {useEffect, useState} from 'react';
import colors from '../../../themes/colors';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  resetError,
  resetPasswordStatus,
  updatePassword,
} from '../../../store/reducers/resetPassword';
import {useToast} from 'react-native-toast-notifications';
import {ErrorModal} from '../../../core/components/errorModal';
import {FontFamily} from '../../../themes/fonts';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import { scaleFont } from '../../../utils/helper';

export const ProfileScreen = () => {
  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const {data, error, status, loading} = useAppSelector(
    state => state.resetPassword,
  );
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordAgain: '',
  });
const [showError,setShowError]=useState(false)

useEffect(()=>{
  dispatch(resetPasswordStatus())
  dispatch(resetError());
},[])
  useEffect(() => {
    if (status == 'success') {
      toast.show('Password reset successfully', {
        style: styles.toast,
        textStyle: {
          fontFamily: FontFamily.regular,
          fontSize:scaleFont(18),
          color: colors.white,
        },
      });
      dispatch(resetPasswordStatus())
     
    } else if (error) {
      toast.show(error);
      dispatch(resetError());

     
    }
  }, [status, error]);
  const handleChange = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));
  };
  const handleResetPassword = () => {
    if (
      !form.oldPassword ||
      !form.newPassword ||
      form.newPassword !== form.newPasswordAgain
    ) {
      //   alert('Check password fields');
     
      return;
    }
    dispatch(
      updatePassword({
        action: 'reset_password',
        old_password: form.oldPassword,
        new_password: form.newPassword,
        APIKEY: apiKey,
        emp_code: employeeCode,
      }),
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      <Header isProfile />
      <View style={styles.container}>
        <HeaderBar title="PROFILE" />
        {/* <KeyboardAvoidingView style={{ flex: 1 }}> */}
        <LoadingOverlay visible={loading} />
        <ProfileTabs
          form={form}
          onChange={handleChange}
          onSubmit={handleResetPassword}
          
        />
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 30,
  },
  toast: {
    bottom: 50,
    fontFamily: FontFamily.regular,
    fontSize:scaleFont(22),
  },
});
