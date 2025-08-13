import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import colors from '../../themes/colors';
export const Loader = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={'large'} color={colors.blue} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
