import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { UserRole } from '@obi/shared';
import { useAuthStore } from '../store/auth.store';
import { setAuthFailureHandler } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { Loading } from '../components/ui';
import { Logo } from '../components/widgets';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { CourierNavigator } from './CourierNavigator';
import { OperatorNavigator } from './OperatorNavigator';
import { AdminNavigator } from './AdminNavigator';
import { CashierNavigator } from './CashierNavigator';
import { RegistrationScreen } from '../screens/auth/RegistrationScreen';
import { PendingScreen } from '../screens/auth/PendingScreen';
import { colors } from '../theme';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const signOut = useAuthStore((s) => s.signOut);

  // Старт: проверяем сохранённый токен, вешаем обработчик протухшей сессии.
  useEffect(() => {
    setAuthFailureHandler(() => void signOut());
    void bootstrap();
  }, [bootstrap, signOut]);

  // Подключаем/отключаем сокет при изменении статуса авторизации.
  useEffect(() => {
    if (status === 'authenticated') void connectSocket();
    else disconnectSocket();
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <Logo />
        <Loading />
      </View>
    );
  }

  const renderByRole = () => {
    if (status !== 'authenticated' || !user) return <AuthNavigator />;

    // Регистрация не завершена (нет имени) — экран выбора имени и роли.
    if (!user.name) return <RegistrationScreen />;

    // Доставщик/оператор/кассир без активации — ждут подтверждения админом.
    if (
      (user.role === UserRole.COURIER ||
        user.role === UserRole.OPERATOR ||
        user.role === UserRole.CASHIER) &&
      !user.isActive
    ) {
      return <PendingScreen />;
    }

    switch (user.role) {
      case UserRole.CLIENT:
        return <ClientNavigator />;
      case UserRole.COURIER:
        return <CourierNavigator />;
      case UserRole.OPERATOR:
        return <OperatorNavigator />;
      case UserRole.CASHIER:
        return <CashierNavigator />;
      case UserRole.ADMIN:
        return <AdminNavigator />;
      default:
        return <AuthNavigator />;
    }
  };

  return <NavigationContainer>{renderByRole()}</NavigationContainer>;
}
