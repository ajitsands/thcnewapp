import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {PersonalDetails} from '../screens/personalDetails';
import {PasswordReset} from '../screens/passwordReset';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';

const Tab = createMaterialTopTabNavigator();
interface ProfileTabProps {
  form: any;
  onChange: () => void;
  onSubmit: () => void;
  showError: boolean;
}
export function ProfileTabs(props: ProfileTabProps) {
  const {form, onChange, onSubmit, showError} = props;

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{tabBarIndicatorStyle: {height: 0}}}>
      <Tab.Screen name="PERSONAL DETAILS">
        {() => <PersonalDetails form={form} />}
      </Tab.Screen>
      <Tab.Screen name="RESET PASSWORD">
        {() => (
          <PasswordReset
            form={form}
            onChange={onChange}
            onSubmit={onSubmit}
            showError={showError}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
function CustomTabBar({state, descriptors, navigation}) {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          if (!focused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tab,
              focused ? styles.activeTab : styles.inactiveTab,
            ]}>
            <Text
              style={[
                styles.tabText,
                {color: focused ? colors.white : colors.primary},
              ]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
  },
  activeTab: {
    backgroundColor: colors.red,
  },
  inactiveTab: {
    backgroundColor: colors.grey,
  },
  tabText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
  },
});
