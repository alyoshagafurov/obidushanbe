import React from 'react';
import { Text, View } from 'react-native';
import { useCartStore } from '../store/cart.store';
import { colors } from '../theme';

/** Иконка вкладки на основе эмодзи (без сторонних icon-библиотек). */
export const tabIcon =
  (emoji: string) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    (
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6, color }}>{emoji}</Text>
    );

/** Иконка корзины с бейджем количества. */
export const cartTabIcon = ({ focused }: { focused: boolean }) => {
  // Хук используется в компоненте, который React Navigation рендерит как элемент.
  return <CartIcon focused={focused} />;
};

function CartIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.count());
  return (
    <View>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>🛒</Text>
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            right: -10,
            top: -4,
            backgroundColor: colors.danger,
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}
