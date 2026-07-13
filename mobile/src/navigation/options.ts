import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

export const defaultStackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 18 },
  headerTitleAlign: 'center',
  contentStyle: { backgroundColor: colors.background },
};

export const defaultTabOptions: BottomTabNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 20 },
  headerTitleAlign: 'left',
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.hairline,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
};
