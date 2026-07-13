/** Все обращения к API в одном месте (тот же бэкенд, что и у приложения). */
import {
  AddressSnapshot,
  CourierPayrollRow,
  CourierPublicProfile,
  ChatMessageDto,
  DashboardStats,
  LoginResponse,
  MeResponse,
  OrderDto,
  OrderStatus,
  PayoutDto,
  Product,
  ProductType,
  ReviewDto,
  SavedAddress,
  UserRole,
  WarehouseDaySummary,
  WarehouseReportDto,
} from '@obi/shared';
import { api } from './lib/api';

/* auth */
export const requestCode = (phone: string) =>
  api.post('/auth/request-code', { phone }).then((r) => r.data as { ok: boolean; devCode?: string });
export const verifyCode = (phone: string, code: string) =>
  api.post('/auth/verify', { phone, code }).then((r) => r.data as LoginResponse);
export const completeRegistration = (input: { name: string; role: UserRole; adminCode?: string }) =>
  api.post('/auth/complete-registration', input).then((r) => r.data as MeResponse);

/* users */
export const getMe = () => api.get('/users/me').then((r) => r.data as MeResponse);
export const updateName = (name: string) => api.patch('/users/me', { name }).then((r) => r.data as MeResponse);
export const getAddresses = () => api.get('/users/me/addresses').then((r) => r.data as SavedAddress[]);
export const createAddress = (input: Partial<SavedAddress> & { point?: { lat: number; lng: number } | null }) =>
  api.post('/users/me/addresses', input).then((r) => r.data as SavedAddress);
export const getUploadUrl = (contentType: string, kind: 'product' | 'avatar') =>
  api.post('/users/me/upload-url', { contentType, kind }).then((r) => r.data as { uploadUrl: string; publicUrl: string });

/* products */
export const getProducts = () => api.get('/products').then((r) => r.data as Product[]);

/* orders */
export const createOrder = (payload: { items: { productId: string; quantity: number }[]; address: AddressSnapshot }) =>
  api.post('/orders', payload).then((r) => r.data as OrderDto);
export const getMyOrders = () => api.get('/orders/my').then((r) => r.data as OrderDto[]);
export const getOrder = (id: string) => api.get(`/orders/${id}`).then((r) => r.data as OrderDto);
export const getFeed = (loc?: { lat: number; lng: number }) =>
  api.get('/orders/feed', { params: loc }).then((r) => r.data as OrderDto[]);
export const getCourierOrders = (active = true) =>
  api.get('/orders/courier', { params: { active } }).then((r) => r.data as OrderDto[]);
export const takeOrder = (id: string) => api.post(`/orders/${id}/take`).then((r) => r.data as OrderDto);
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  api.post(`/orders/${id}/status`, { status }).then((r) => r.data as OrderDto);

/* couriers */
export const getCourier = (id: string) => api.get(`/couriers/${id}`).then((r) => r.data as CourierPublicProfile);
export const getCourierReviews = (id: string) => api.get(`/couriers/${id}/reviews`).then((r) => r.data as ReviewDto[]);

/* reviews */
export const createReview = (input: { orderId: string; rating: number; text?: string }) =>
  api.post('/reviews', input).then((r) => r.data as ReviewDto);

/* chat */
export const sendMessage = (input: { recipientId: string; orderId?: string | null; text: string }) =>
  api.post('/chat', input).then((r) => r.data as ChatMessageDto);
export const getConversation = (withUserId: string, orderId?: string) =>
  api.get('/chat/conversation', { params: { withUserId, orderId } }).then((r) => r.data as ChatMessageDto[]);

/* operator */
export const lookupClient = (phone: string) =>
  api.get('/operator/clients/lookup', { params: { phone } }).then(
    (r) => r.data as { exists: boolean; id?: string; name?: string | null; addresses?: SavedAddress[] },
  );
export const createOperatorOrder = (input: {
  clientPhone: string;
  clientName?: string;
  items: { productId: string; quantity: number }[];
  address: AddressSnapshot;
}) => api.post('/operator/orders', input).then((r) => r.data as OrderDto);
export const getOperatorOrders = () => api.get('/operator/orders').then((r) => r.data as OrderDto[]);

/* admin */
export interface AdminCourier {
  id: string; name: string; phone: string; photoUrl: string | null; bio: string | null;
  rating: number; reviewsCount: number; deliveriesCount: number; isActive: boolean;
}
export interface AdminStaff { id: string; name: string | null; phone: string; isActive: boolean }
export const getStats = (params: { period?: 'day' | 'week' | 'month' | 'year' }) =>
  api.get('/admin/stats', { params }).then((r) => r.data as DashboardStats);
export const getAllProducts = () => api.get('/admin/products').then((r) => r.data as Product[]);
export const createProduct = (input: Partial<Product> & { name: string; price: number; type: ProductType }) =>
  api.post('/admin/products', input).then((r) => r.data as Product);
export const updateProduct = (id: string, input: Partial<Product>) =>
  api.patch(`/admin/products/${id}`, input).then((r) => r.data as Product);
export const deleteProduct = (id: string) => api.delete(`/admin/products/${id}`).then((r) => r.data);
export const getCouriers = () => api.get('/admin/couriers').then((r) => r.data as AdminCourier[]);
export const getOperators = () => api.get('/admin/operators').then((r) => r.data as AdminStaff[]);
export const getCashiers = () => api.get('/admin/cashiers').then((r) => r.data as AdminStaff[]);
export const createStaff = (input: { phone: string; name: string; role: 'COURIER' | 'OPERATOR' | 'CASHIER'; bio?: string }) =>
  api.post('/admin/staff', input).then((r) => r.data);
export const setStaffActive = (id: string, isActive: boolean) =>
  api.patch(`/admin/staff/${id}/active`, { isActive }).then((r) => r.data);
export const getAdminOrders = (params: { status?: string }) =>
  api.get('/admin/orders', { params }).then((r) => r.data as OrderDto[]);
export const reassignOrder = (id: string, courierId: string | null) =>
  api.post(`/admin/orders/${id}/reassign`, { courierId }).then((r) => r.data as OrderDto);
export const getAdminReviews = () =>
  api.get('/admin/reviews').then((r) => r.data as (ReviewDto & { courierName: string })[]);

/* cashier */
export const getPayroll = (date?: string) =>
  api.get('/cashier/payroll', { params: { date } }).then((r) => r.data as CourierPayrollRow[]);
export const saveEntry = (input: { courierId: string; bottles: number; date?: string }) =>
  api.post('/cashier/entries', input).then((r) => r.data as CourierPayrollRow[]);
export const payoutCourier = (input: { courierId: string; amount?: number }) =>
  api.post('/cashier/payouts', input).then((r) => r.data as { ok: boolean; paid: number; balanceAfter: number });
export const getPayouts = (courierId: string) =>
  api.get(`/cashier/payouts/${courierId}`).then((r) => r.data as PayoutDto[]);
export const setRate = (courierId: string, rate: number) =>
  api.patch(`/cashier/couriers/${courierId}/rate`, { rate }).then((r) => r.data);

/* warehouse (обмен тары) */
export const getWarehouse = (date?: string) =>
  api.get('/cashier/warehouse', { params: { date } }).then(
    (r) => r.data as { reports: WarehouseReportDto[]; summary: WarehouseDaySummary },
  );
export const createWarehouseReport = (input: {
  courierId: string;
  fullTaken: number;
  emptyReturned: number;
  fullReturned?: number;
  note?: string;
}) => api.post('/cashier/warehouse', input).then((r) => r.data as WarehouseReportDto);
export const deleteWarehouseReport = (id: string) =>
  api.delete(`/cashier/warehouse/${id}`).then((r) => r.data);

/* upload helper: presigned URL -> PUT file -> publicUrl */
export async function uploadImage(file: File, kind: 'product' | 'avatar'): Promise<string> {
  const contentType = file.type || 'image/jpeg';
  const { uploadUrl, publicUrl } = await getUploadUrl(contentType, kind);
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!put.ok) throw new Error('Не удалось загрузить файл');
  return publicUrl;
}
