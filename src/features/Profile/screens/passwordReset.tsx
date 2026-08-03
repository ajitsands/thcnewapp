import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {useAppSelector} from '../../../store';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';

export const PasswordReset = ({form, onChange, onSubmit}: any) => {
  const {employeeCode} = useAppSelector(state => state.app);
  const isMismatch =
    form.newPasswordAgain && form.newPassword !== form.newPasswordAgain;

  const isFormValid =
    form.oldPassword &&
    form.newPassword &&
    form.newPasswordAgain &&
    !isMismatch;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="lock" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Reset Your Password</Text>
        </View>

        <Text style={styles.cardSubtitle}>
          Ensure your new password is at least 6 characters long
        </Text>

        {/* Readonly Employee Code Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMPLOYEE CODE</Text>
          <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
            <MaterialIcons name="badge" size={18} color={colors.grey} style={styles.inputIcon} />
            <Text style={styles.disabledInputText}>{employeeCode}</Text>
          </View>
        </View>

        {/* Old Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock-outline" size={18} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter current password"
              placeholderTextColor={colors.grey}
              style={styles.input}
              value={form.oldPassword}
              onChangeText={v => onChange('oldPassword', v)}
              secureTextEntry
            />
          </View>
        </View>

        {/* New Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="vpn-key" size={18} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="Enter new password"
              placeholderTextColor={colors.grey}
              style={styles.input}
              value={form.newPassword}
              onChangeText={v => onChange('newPassword', v)}
              secureTextEntry
            />
          </View>
        </View>

        {/* Confirm New Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
          <View style={[styles.inputWrapper, isMismatch && styles.errorInputWrapper]}>
            <MaterialIcons name="check-circle-outline" size={18} color={isMismatch ? colors.red : colors.primary} style={styles.inputIcon} />
            <TextInput
              placeholder="Re-enter new password"
              placeholderTextColor={colors.grey}
              style={styles.input}
              value={form.newPasswordAgain}
              onChangeText={v => onChange('newPasswordAgain', v)}
              secureTextEntry
            />
          </View>
          {isMismatch && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {/* Confirm Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.confirmButton, !isFormValid && styles.disabledButton]}
          onPress={onSubmit}
          disabled={!isFormValid}>
          <MaterialIcons name="published-with-changes" size={20} color={colors.white} />
          <Text style={styles.confirmText}>UPDATE PASSWORD</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: '#F4F7FA',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  errorInputWrapper: {
    borderColor: colors.red,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.medium,
    color: colors.header,
  },
  disabledInputText: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.grey,
  },
  errorText: {
    color: colors.red,
    fontSize: scaleFont(11),
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  disabledButton: {
    backgroundColor: colors.grey,
    opacity: 0.6,
    elevation: 0,
  },
  confirmText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
