/**
 * Кабинет кассира: зарплата доставщиков.
 * Доступ: CASHIER и ADMIN (активные).
 */
import { Router } from 'express';
import { UserRole } from '@obi/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, requireActive, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listPayroll,
  createPayout,
  setRate,
  listPayouts,
} from '../services/cashier.service';
import { createReport, listReports, listCourierReports, deleteReport } from '../services/warehouse.service';
import {
  cashierDateQuery,
  cashierPayoutSchema,
  cashierRateSchema,
  warehouseReportSchema,
} from '../validation/schemas';

export const cashierRouter = Router();
cashierRouter.use(authenticate, requireActive, requireRole(UserRole.CASHIER, UserRole.ADMIN));

// GET /cashier/payroll?date=YYYY-MM-DD — ведомость на день
cashierRouter.get(
  '/payroll',
  validate({ query: cashierDateQuery }),
  asyncHandler(async (req, res) => {
    res.json(await listPayroll(req.query.date as string | undefined));
  }),
);

// POST /cashier/payouts — выплата доставщику (по умолчанию вся копилка)
cashierRouter.post(
  '/payouts',
  validate({ body: cashierPayoutSchema }),
  asyncHandler(async (req, res) => {
    const { courierId, amount, note } = req.body;
    res.json(await createPayout(req.user!.id, courierId, amount, note));
  }),
);

// GET /cashier/payouts/:courierId — история выплат
cashierRouter.get(
  '/payouts/:courierId',
  asyncHandler(async (req, res) => {
    res.json(await listPayouts(req.params.courierId));
  }),
);

// PATCH /cashier/couriers/:id/rate — индивидуальная ставка за бутыль
cashierRouter.patch(
  '/couriers/:id/rate',
  validate({ body: cashierRateSchema }),
  asyncHandler(async (req, res) => {
    res.json(await setRate(req.params.id, req.body.rate));
  }),
);

/* --------------------- Складской отчёт (обмен тары) --------------------- */

// GET /cashier/warehouse?date= — отчёты за день + итоги
cashierRouter.get(
  '/warehouse',
  validate({ query: cashierDateQuery }),
  asyncHandler(async (req, res) => {
    res.json(await listReports(req.query.date as string | undefined));
  }),
);

// POST /cashier/warehouse — новый отчёт по доставщику
cashierRouter.post(
  '/warehouse',
  validate({ body: warehouseReportSchema }),
  asyncHandler(async (req, res) => {
    res.json(await createReport(req.user!.id, req.body));
  }),
);

// GET /cashier/warehouse/courier/:courierId — все отчёты доставщика (раскрытие «Копилки»)
cashierRouter.get(
  '/warehouse/courier/:courierId',
  asyncHandler(async (req, res) => {
    res.json(await listCourierReports(req.params.courierId));
  }),
);

// DELETE /cashier/warehouse/:id — удалить ошибочный отчёт
cashierRouter.delete(
  '/warehouse/:id',
  asyncHandler(async (req, res) => {
    await deleteReport(req.params.id);
    res.json({ ok: true });
  }),
);
