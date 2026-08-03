import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {PersonalDetails} from '../screens/personalDetails';
import {PasswordReset} from '../screens/passwordReset';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {scaleFont} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const Tab = createMaterialTopTabNavigator();

interface ProfileTabProps {
  form: any;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  showError?: boolean;
}

export function ProfileTabs(props: ProfileTabProps) {
  const {form, onChange, onSubmit} = props;

  return (
    <Tab.Navigator
      tabBar={tabProps => <CustomTabBar {...tabProps} />}
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
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function CustomTabBar({state, descriptors, navigation}: any) {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const onPress = () => {
          if (!focused) {
            navigation.navigate(route.name);
          }
        };

        const iconName = index === 0 ? 'person' : 'lock';

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={[
              styles.tab,
              focused && styles.activeTab,
            ]}>
            <MaterialIcons
              name={iconName}
              size={18}
              color={focused ? colors.white : colors.primary}
              style={{marginRight: 6}}
            />
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
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
  },
});
