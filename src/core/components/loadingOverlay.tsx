// import React from "react";
// import { ActivityIndicator, StyleSheet, View } from "react-native";
// import colors from "../../themes/colors";
//  export const Loader=()=>{
//     return(
//         <View style={styles.container}>
//              <ActivityIndicator size={'large'} color={colors.blue}/>
//         </View>

//     )
// }
// const styles=StyleSheet.create({
//     container:{
//         flex:1,

//     }
// })
import React from 'react';
import {ActivityIndicator, StyleSheet, View, Modal} from 'react-native';
import colors from '../../themes/colors';

const LoadingOverlay = ({visible = false}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // faded background
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingOverlay;
