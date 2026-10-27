import type { AppData, Debt, DebtStatus, Payment } from "../types";
export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
export const shortMoney = (value: number) => {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tỷ";
  if (value >= 1_000_000) return (value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tr";
  return (value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " nghìn";
};
export const dateLabel = (date: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date + "T00:00:00"));
export const dateInput = (date = new Date()) => { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); };
export const debtPaid = (debt: Debt, payments: Payment[]) => payments.filter((payment) => payment.debtId === debt.id).reduce((sum, payment) => sum + payment.amount, 0);
export const debtRemaining = (debt: Debt, payments: Payment[]) => Math.max(0, debt.amount - debtPaid(debt, payments));
export const debtStatus = (debt: Debt, payments: Payment[]): DebtStatus => {
  const remaining = debtRemaining(debt, payments);
  if (remaining === 0) return "paid";
  if (debt.dueDate && debt.dueDate < dateInput()) return "overdue";
  if (debtPaid(debt, payments) > 0) return "partial";
  return "open";
};
export const statusText: Record<DebtStatus, string> = { open: "Chưa thanh toán", partial: "Đang thanh toán", paid: "Đã thanh toán", overdue: "Quá hạn" };
export const methodText = (method: Payment["method"]) => ({ cash: "Tiền mặt", transfer: "Chuyển khoản", other: "Khác" }[method]);
export const contactName = (data: AppData, contactId: string) => data.contacts.find((contact) => contact.id === contactId)?.name ?? "Người đã xóa";
export const id = (prefix: string) => prefix + "-" + (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12));

