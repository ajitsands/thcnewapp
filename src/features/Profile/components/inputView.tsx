import {StyleSheet, Text, TextInput, View} from 'react-native';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';
interface inputProps {
  title: string;
  multiline?: boolean;
  value: string;
  editable: boolean;
  onChange?: () => void;
  secure?: boolean;
  showError: boolean;
}
export const InputView = (props: inputProps) => {
  const {title, multiline, value, onChange, editable, secure, showError} =
    props;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{title}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && {height: 80},
          showError && {paddingTop: 0},
        ]}
        value={value}
        onChangeText={onChange}
        editable={editable}
        secureTextEntry={secure}
        multiline={multiline}
      />

      {showError && (
        <Text style={styles.errorText}>Password not matching.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {marginBottom: 12, marginHorizontal: -5},
  label: {
    color: colors.white,
    fontFamily: FontFamily.bold,
    fontSize: scaleFont(14),
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#e3e3e3',
    borderColor: '#707070',
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 45,
    color: '#0b2c51',
    fontFamily: FontFamily.deupRegular,
    fontSize: 18,
  },
  errorText: {
    color: colors.red,
    fontSize: scaleFont(10),
    position: 'absolute',
    top: 50,
    marginLeft: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
});
