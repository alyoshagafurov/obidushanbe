import { CourierPayrollRow, PayoutDto, WarehouseDaySummary, WarehouseReportDto } from '@obi/shared';
import { api } from '../lib/api';

/** Ведомость по доставщикам на день (YYYY-MM-DD). */
export async function getPayroll(date?: string): Promise<CourierPayrollRow[]> {
  const { data } = await api.get('/cashier/payroll', { params: { date } });
  return data;
}

/** Вписать количество бутылей 20л за день. Возвращает обновлённую ведомость. */
export async function saveEntry(input: {
  courierId: string;
  bottles: number;
  date?: string;
}): Promise<CourierPayrollRow[]> {
  const { data } = await api.post('/cashier/entries', input);
  return data;
}

/** Выплата доставщику (по умолчанию — вся копилка). */
export async function payout(input: {
  courierId: string;
  amount?: number;
  note?: string;
}): Promise<{ ok: boolean; paid: number; balanceAfter: number }> {
  const { data } = await api.post('/cashier/payouts', input);
  return data;
}

export async function getPayouts(courierId: string): Promise<PayoutDto[]> {
  const { data } = await api.get(`/cashier/payouts/${courierId}`);
  return data;
}

/** Установить индивидуальную ставку за бутыль. */
export async function setRate(courierId: string, rate: number): Promise<void> {
  await api.patch(`/cashier/couriers/${courierId}/rate`, { rate });
}

/* ---- Складской отчёт (обмен тары) ---- */
export async function getWarehouse(date?: string): Promise<{ reports: WarehouseReportDto[]; summary: WarehouseDaySummary }> {
  const { data } = await api.get('/cashier/warehouse', { params: { date } });
  return data;
}

export async function createWarehouseReport(input: {
  courierId: string;
  fullTaken: number;
  emptyReturned: number;
  fullReturned?: number;
}): Promise<WarehouseReportDto> {
  const { data } = await api.post('/cashier/warehouse', input);
  return data;
}

export async function deleteWarehouseReport(id: string): Promise<void> {
  await api.delete(`/cashier/warehouse/${id}`);
}
