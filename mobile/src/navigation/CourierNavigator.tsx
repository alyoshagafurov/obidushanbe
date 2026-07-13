import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CourierStackParamList } from './types';
import { FeedScreen } from '../screens/courier/FeedScreen';
import { CourierOrdersScreen } from '../screens/courier/CourierOrdersScreen';
import { CourierMapScreen } from '../screens/courier/CourierMapScreen';
import { OrderDetailScreen } from '../screens/shared/OrderDetailScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { tabIcon } from './tabIcon';
import { defaultStackOptions, defaultTabOptions } from './options';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<CourierStackParamList>();

function CourierTabs() {
  return (
    <Tab.Navigator screenOptions={defaultTabOptions}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: t().courier.feedTitle, tabBarIcon: tabIcon('🆕') }} />
      <Tab.Screen name="MyOrders" component={CourierOrdersScreen} options={{ title: t().courier.myOrders, tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Map" component={CourierMapScreen} options={{ title: t().courier.map, tabBarIcon: tabIcon('🗺️') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t().tabs.profile, tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export function CourierNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Tabs" component={CourierTabs} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t().orders.order }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: t().chat.title }} />
    </Stack.Navigator>
  );
}
