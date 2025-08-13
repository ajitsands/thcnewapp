import {
  Animated,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {InputView} from '../components/inputView';
import colors from '../../../themes/colors';
import {useAppSelector} from '../../../store';
import LoadingOverlay from '../../../core/components/loadingOverlay';

export const PersonalDetails = ({form}) => {
  const {data, error, status, loading} = useAppSelector(state => state.profile);
  const {employeeCode} = useAppSelector(state => state.app);
  const profileDetails = data?.data[0];
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{flex: 1}}
      showsVerticalScrollIndicator={false}>
      <LoadingOverlay visible={loading} />
      <InputView title="EMPLOYEE CODE" value={employeeCode} editable={false} />
      <InputView
        title="EMPLOYEE NAME"
        value={profileDetails?.employee_name}
        editable={false}
      />
      <InputView
        title="MOBILE NUMBER"
        value={profileDetails?.employee_contact_no}
        editable={false}
      />
      <InputView
        title="EMERGENCY CONTACT NUMBER"
        value={profileDetails?.emergency_contact_no}
        editable={false}
      />
      <InputView
        title="NATIVE CONTACT NUMBER"
        value={profileDetails?.native_number}
        editable={false}
      />
      <InputView
        title="ADDRESS"
        value={profileDetails?.native_address}
        editable={false}
        // multiline
      />
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: colors.primary,
    // flex: 1,
    marginHorizontal: 10,
    borderBottomRightRadius: 10,
  },
});
