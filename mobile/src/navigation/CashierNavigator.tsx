import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CashierDayScreen } from '../screens/cashier/CashierDayScreen';
import { CashierWarehouseScreen } from '../screens/cashier/CashierWarehouseScreen';
import { CashierBalancesScreen } from '../screens/cashier/CashierBalancesScreen';
import { CashierRatesScreen } from '../screens/cashier/CashierRatesScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { tabIcon } from './tabIcon';
import { defaultStackOptions, defaultTabOptions } from './options';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CashierTabs() {
  return (
    <Tab.Navigator screenOptions={defaultTabOptions}>
      <Tab.Screen name="Day" component={CashierDayScreen} options={{ title: t().cashier.dayTab, tabBarIcon: tabIcon('📝') }} />
      <Tab.Screen name="Warehouse" component={CashierWarehouseScreen} options={{ title: t().cashier.warehouseTab, tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Balances" component={CashierBalancesScreen} options={{ title: t().cashier.balancesTab, tabBarIcon: tabIcon('🐷') }} />
      <Tab.Screen name="Rates" component={CashierRatesScreen} options={{ title: t().cashier.ratesTab, tabBarIcon: tabIcon('⚖️') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t().tabs.profile, tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export function CashierNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Tabs" component={CashierTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
