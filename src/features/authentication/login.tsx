import React, {useEffect, useState} from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import colors from '../../themes/colors';
import {Header} from '../../core/components/header';
import {FontFamily} from '../../themes/fonts';
import {navigate} from '../../navigators';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {useAppDispatch, useAppSelector} from '../../store';
import {
  resetError,
  resetloginStatus,
  userLogin,
} from '../../store/reducers/loginReducer';
import {useToast} from 'react-native-toast-notifications';
import {ErrorModal} from '../../core/components/errorModal';
import {SafeAreaView} from 'react-native-safe-area-context';
import LoadingOverlay from '../../core/components/loadingOverlay';
import {scaleFont} from '../../utils/helper';

const LoginScreen = () => {
  const [isFocused, setIsFocused] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [employeeIdError, setEmployeeIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorText, setErrorText] = useState('');

  const {data, error, status, loading} = useAppSelector(
    state => state.userLogin,
  );
  const toast = useToast();

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status == 'success') {
      navigate('HomeScreen');
      dispatch(resetloginStatus());
    } else if (error) {
      setErrorText(error);
      setShowErrorModal(true);
      dispatch(resetError());
    }
  }, [status, error]);

  const handleLogin = () => {
    let valid = true;

    if (!employeeId.trim()) {
      setEmployeeIdError('Please enter a valid Employee ID.');
      valid = false;
    } else {
      setEmployeeIdError('');
    }

    if (!password.trim() || password.length < 4) {
      setPasswordError('Use 4 Characters or more for your password');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (valid) {
      dispatch(
        userLogin({username: employeeId, password: password, action: 'login'}),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header isHome />
      <LoadingOverlay visible={loading} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/thc_logo.png')}
                style={styles.logo}
              />
            </View>

            {/* Login Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSub}>Sign in to manage your facility services</Text>

              {/* Employee ID Field */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Employee ID"
                  placeholderTextColor={colors.grey}
                  style={styles.input}
                  onFocus={() => setIsFocused(1)}
                  onBlur={() => setIsFocused(0)}
                  onChangeText={text => {
                    setEmployeeId(text);
                    if (!text.trim()) {
                      setEmployeeIdError('Please enter a valid Employee ID.');
                    } else {
                      setEmployeeIdError('');
                    }
                  }}
                />
              </View>
              {employeeIdError ? (
                <Text style={styles.errorText}>{employeeIdError}</Text>
              ) : null}

              {/* Password Field */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  placeholderTextColor={colors.grey}
                  style={styles.input}
                  onFocus={() => setIsFocused(2)}
                  onBlur={() => setIsFocused(0)}
                  onChangeText={text => {
                    setPassword(text);
                    if (!text.trim() || text.length < 4) {
                      setPasswordError(
                        'Use 4 characters or more for your password',
                      );
                    } else {
                      setPasswordError('');
                    }
                  }}
                />
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.button}
                onPress={() => handleLogin()}>
                <MaterialIcons name="login" size={22} color={colors.white} />
                <Text style={styles.title}>LOG IN</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {showErrorModal && (
        <ErrorModal
          visible={showErrorModal}
          toggle={() => setShowErrorModal(false)}
          errorText={errorText}
        />
      )}
    </SafeAreaView>
  );
};
export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: -10,
  },
  logo: {
    height: 260,
    width: 260,
    resizeMode: 'contain',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#0B2C51',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  welcomeTitle: {
    fontSize: scaleFont(22),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 4,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginVertical: 8,
    paddingHorizontal: 14,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: FontFamily.medium,
    color: colors.black,
  },
  errorText: {
    color: colors.red,
    marginLeft: 6,
    fontSize: scaleFont(11),
    marginBottom: 6,
  },
  button: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  title: {
    fontSize: scaleFont(15),
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
