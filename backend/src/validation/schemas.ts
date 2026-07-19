/** Zod-схемы валидации входных данных. Источник истины для всех роутов. */
import { z } from 'zod';
import { OrderStatus, ProductType, UserRole, PHONE_REGEX, SMS_CODE_LENGTH } from '@obi/shared';

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, 'Телефон в формате +992XXXXXXXXX');

export const addressSchema = z
  .object({
    point: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .nullable()
      .optional(),
    text: z.string().trim().max(500).nullable().optional(),
    landmark: z.string().trim().max(500).nullable().optional(),
  })
  .refine((a) => !!a.point || !!a.text?.trim(), {
    message: 'Нужна либо точка на карте, либо текстовый адрес',
  });

/* ----------------------------- auth ----------------------------- */

export const requestCodeSchema = z.object({ phone: phoneSchema });

export const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().length(SMS_CODE_LENGTH, `Код из ${SMS_CODE_LENGTH} цифр`),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(10) });

export const completeRegistrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.nativeEnum(UserRole),
  adminCode: z.string().trim().max(100).optional(),
});

/* ----------------------------- user ----------------------------- */

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createAddressSchema = z.object({
  label: z.string().trim().max(50).nullable().optional(),
  point: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .nullable()
    .optional(),
  text: z.string().trim().max(500).nullable().optional(),
  landmark: z.string().trim().max(500).nullable().optional(),
});

/* ---------------------------- orders ---------------------------- */

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы один товар'),
  address: addressSchema,
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const courierLocationQuery = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

/* --------------------------- operator --------------------------- */

export const operatorCreateOrderSchema = z.object({
  clientPhone: phoneSchema,
  clientName: z.string().trim().min(1).max(100).optional(),
  items: z.array(orderItemSchema).min(1),
  address: addressSchema,
});

/* ---------------------------- reviews --------------------------- */

export const createReviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(1000).optional(),
});

/* ----------------------------- chat ----------------------------- */

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  orderId: z.string().min(1).nullable().optional(),
  text: z.string().trim().min(1).max(2000),
});

/* ----------------------------- admin ---------------------------- */

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.nativeEnum(ProductType).default(ProductType.OTHER),
  price: z.number().min(0),
  photoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const createStaffSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum([UserRole.COURIER, UserRole.OPERATOR, UserRole.CASHIER]),
  bio: z.string().trim().max(1000).optional(), // для доставщика
});

export const updateCourierSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  // территория: произвольный GeoJSON (валидируем как объект)
  territory: z.any().optional(),
});

export const reassignOrderSchema = z.object({
  courierId: z.string().min(1).nullable(),
});

export const statsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  // period как удобный пресет
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
});

export const adminOrdersQuery = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  courierId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/* ----------------------------- cashier -------------------------- */

export const cashierDateQuery = z.object({
  date: z.string().optional(), // YYYY-MM-DD или ISO
});

export const cashierPayoutSchema = z.object({
  courierId: z.string().min(1),
  amount: z.number().positive().optional(),
  note: z.string().trim().max(300).optional(),
});

export const cashierRateSchema = z.object({
  rate: z.number().min(0).max(10000),
});

export const warehouseItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().min(0).max(1000000),
});

export const warehouseTripSchema = z.object({
  taken: z.number().int().min(0).max(100000),
  emptyReturned: z.number().int().min(0).max(100000).optional(),
  fullReturned: z.number().int().min(0).max(100000).optional(),
});

export const warehouseReportSchema = z.object({
  courierId: z.string().min(1),
  date: z.string().optional(),
  trips: z.array(warehouseTripSchema).max(12),
  note: z.string().trim().max(300).optional(),
  items: z.array(warehouseItemSchema).max(20).optional(),
});

export const uploadUrlSchema = z.object({
  contentType: z.string().regex(/^image\/(png|jpe?g|webp)$/, 'Только изображения'),
  kind: z.enum(['product', 'avatar']),
});
