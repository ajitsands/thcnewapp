import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {InputView} from '../components/inputView';
import colors from '../../../themes/colors';
import {useAppSelector} from '../../../store';

export const PasswordReset = ({form, onChange, onSubmit}) => {
  const {employeeCode} = useAppSelector(state => state.app);

  return (
    <ScrollView>
      <KeyboardAvoidingView style={styles.content}>
        <InputView
          title="EMPLOYEE CODE"
          value={employeeCode}
          editable={false}
        />
        <InputView
          title="OLD PASSWORD"
          value={form.oldPassword}
          onChange={v => onChange('oldPassword', v)}
          secure
        />
        <InputView
          title="NEW PASSWORD"
          value={form.newPassword}
          onChange={v => onChange('newPassword', v)}
          secure
        />
        <InputView
          title="RE - NEW PASSWORD"
          value={form.newPasswordAgain}
          onChange={v => onChange('newPasswordAgain', v)}
          showError={
            form.newPasswordAgain && form.newPassword !== form.newPasswordAgain
          }
          secure
        />
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={onSubmit}
          disabled={
            !form.oldPassword || !form.newPassword || !form.newPasswordAgain
          }>
          <Text style={styles.confirmText}>CONFIRM</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: colors.primary,
    marginHorizontal: 10,
    borderBottomRightRadius: 10,
    flex: 1,
  },
  inputContainer: {marginBottom: 12},
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#e3e3e3',
    borderColor: '#707070',
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 47,
    color: '#0b2c51',
  },
  confirmButton: {
    backgroundColor: colors.red,
    padding: 12,
    borderRadius: 24,
    alignSelf: 'flex-end',
    marginTop: 20,
    width: 149,
    alignItems: 'center',
  },
  confirmText: {
    fontWeight: '600',
    color: colors.white,
  },
});
