/** Типы параметров навигации для всех ролей. */

export type AuthStackParamList = {
  Phone: undefined;
  Code: { phone: string; devCode?: string };
};

export type ClientStackParamList = {
  Tabs: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
  CourierProfile: { courierId: string; orderId?: string };
  Chat: { peerId: string; orderId?: string; peerName?: string };
  Review: { orderId: string; courierId: string };
};

export type CourierStackParamList = {
  Tabs: undefined;
  OrderDetail: { orderId: string };
  Chat: { peerId: string; orderId?: string; peerName?: string };
};

export type OperatorStackParamList = {
  Tabs: undefined;
  OrderDetail: { orderId: string };
};

export type AdminStackParamList = {
  Tabs: undefined;
  ManageProducts: undefined;
  ManageCouriers: undefined;
  ManageOperators: undefined;
  ManageCashiers: undefined;
  ManageOrders: undefined;
  Reviews: undefined;
  OrderDetail: { orderId: string };
};
