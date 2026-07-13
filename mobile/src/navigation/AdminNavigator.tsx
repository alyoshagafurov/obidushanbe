import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminStackParamList } from './types';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ManageScreen } from '../screens/admin/ManageScreen';
import { ManageProductsScreen } from '../screens/admin/ManageProductsScreen';
import { ManageCouriersScreen } from '../screens/admin/ManageCouriersScreen';
import { ManageOperatorsScreen } from '../screens/admin/ManageOperatorsScreen';
import { ManageCashiersScreen } from '../screens/admin/ManageCashiersScreen';
import { ManageOrdersScreen } from '../screens/admin/ManageOrdersScreen';
import { AdminReviewsScreen } from '../screens/admin/AdminReviewsScreen';
import { OrderDetailScreen } from '../screens/shared/OrderDetailScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { tabIcon } from './tabIcon';
import { defaultStackOptions, defaultTabOptions } from './options';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={defaultTabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t().admin.dashboard, tabBarIcon: tabIcon('📊') }} />
      <Tab.Screen name="Manage" component={ManageScreen} options={{ title: t().admin.manage, tabBarIcon: tabIcon('⚙️') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t().tabs.profile, tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Tabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ManageProducts" component={ManageProductsScreen} options={{ title: t().admin.products }} />
      <Stack.Screen name="ManageCouriers" component={ManageCouriersScreen} options={{ title: t().admin.couriers }} />
      <Stack.Screen name="ManageOperators" component={ManageOperatorsScreen} options={{ title: t().admin.operators }} />
      <Stack.Screen name="ManageCashiers" component={ManageCashiersScreen} options={{ title: t().admin.cashiers }} />
      <Stack.Screen name="ManageOrders" component={ManageOrdersScreen} options={{ title: t().admin.ordersAll }} />
      <Stack.Screen name="Reviews" component={AdminReviewsScreen} options={{ title: t().admin.reviews }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t().orders.order }} />
    </Stack.Navigator>
  );
}
