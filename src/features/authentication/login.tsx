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
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled">
            <View style={styles.contentContainer}>
              <Image
                source={require('../../assets/images/thc_logo.png')}
                style={styles.logo}
              />
            </View>

            <TextInput
              placeholder="Employee id"
              placeholderTextColor={colors.grey}
              style={[
                styles.input,
                {
                  borderColor: employeeIdError
                    ? colors.red
                    : isFocused === 1
                    ? colors.blue
                    : colors.grey,
                },
              ]}
              onFocus={() => setIsFocused(1)}
              onBlur={() => setIsFocused(2)}
              onChangeText={text => {
                setEmployeeId(text);
                if (!text.trim()) {
                  setEmployeeIdError('Please enter a valid Employee id.');
                } else {
                  setEmployeeIdError('');
                }
              }}
            />
            {employeeIdError ? (
              <Text style={styles.errorText}>{employeeIdError}</Text>
            ) : null}

            <TextInput
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={colors.grey}
              style={[
                styles.input,
                {
                  borderColor: passwordError
                    ? colors.red
                    : isFocused === 2
                    ? colors.blue
                    : colors.grey,
                },
              ]}
              onFocus={() => setIsFocused(2)}
              onBlur={() => setIsFocused(1)}
              onChangeText={text => {
                setPassword(text);
                if (!text.trim() || text.length < 4) {
                  setPasswordError(
                    'Use 4 Characters or more for your password',
                  );
                } else {
                  setPasswordError('');
                }
              }}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleLogin()}>
              <MaterialIcons name="login" size={20} color={colors.white} />
              {/* <Image source={require('../../assets/images/2.0x/triangle.png')} style={styles.icon}/> */}
              <Text style={styles.title}>Login</Text>
            </TouchableOpacity>
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
    backgroundColor: colors.white,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  errorText: {
    color: colors.red,
    marginLeft: 22,
    fontSize: scaleFont(12),
    marginBottom: 5,
  },

  logo: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
  },
  input: {
    height: 60,
    borderWidth: 2,
    borderColor: colors.grey,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 5,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 5,
  },
  title: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.medium,
    color: colors.white,
    marginLeft: 5,
  },
  icon: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  },
});
