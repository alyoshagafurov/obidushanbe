import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ClientStackParamList } from './types';
import { CatalogScreen } from '../screens/client/CatalogScreen';
import { CartScreen } from '../screens/client/CartScreen';
import { MyOrdersScreen } from '../screens/client/MyOrdersScreen';
import { CheckoutScreen } from '../screens/client/CheckoutScreen';
import { CourierProfileScreen } from '../screens/client/CourierProfileScreen';
import { ReviewScreen } from '../screens/client/ReviewScreen';
import { OrderDetailScreen } from '../screens/shared/OrderDetailScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { tabIcon, cartTabIcon } from './tabIcon';
import { defaultStackOptions, defaultTabOptions } from './options';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<ClientStackParamList>();

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={defaultTabOptions}>
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: t().tabs.catalog, tabBarIcon: tabIcon('💧') }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: t().tabs.cart, tabBarIcon: cartTabIcon }}
      />
      <Tab.Screen
        name="Orders"
        component={MyOrdersScreen}
        options={{ title: t().tabs.orders, tabBarIcon: tabIcon('📦') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t().tabs.profile, tabBarIcon: tabIcon('👤') }}
      />
    </Tab.Navigator>
  );
}

export function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Tabs" component={ClientTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t().checkout.title }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t().orders.order }} />
      <Stack.Screen name="CourierProfile" component={CourierProfileScreen} options={{ title: t().orders.courier }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: t().chat.title }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: t().review.title }} />
    </Stack.Navigator>
  );
}
