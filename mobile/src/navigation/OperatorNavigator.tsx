import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OperatorStackParamList } from './types';
import { OperatorOrderFormScreen } from '../screens/operator/OperatorOrderFormScreen';
import { OperatorOrdersScreen } from '../screens/operator/OperatorOrdersScreen';
import { OrderDetailScreen } from '../screens/shared/OrderDetailScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { tabIcon } from './tabIcon';
import { defaultStackOptions, defaultTabOptions } from './options';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<OperatorStackParamList>();

function OperatorTabs() {
  return (
    <Tab.Navigator screenOptions={defaultTabOptions}>
      <Tab.Screen name="New" component={OperatorOrderFormScreen} options={{ title: t().tabs.new, tabBarIcon: tabIcon('➕') }} />
      <Tab.Screen name="Orders" component={OperatorOrdersScreen} options={{ title: t().operator.myOrders, tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t().tabs.profile, tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export function OperatorNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Tabs" component={OperatorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t().orders.order }} />
    </Stack.Navigator>
  );
}
