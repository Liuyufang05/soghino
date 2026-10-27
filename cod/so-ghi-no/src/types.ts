export type DebtType = "lent" | "borrowed";
export type PaymentMethod = "cash" | "transfer" | "other";
export type DebtStatus = "open" | "partial" | "paid" | "overdue";
export interface Contact { id: string; name: string; phone: string; note: string; createdAt: string; archived?: boolean; }
export interface Debt { id: string; code: string; contactId: string; type: DebtType; amount: number; transactionDate: string; dueDate: string; description: string; note: string; createdAt: string; updatedAt: string; }
export interface Payment { id: string; debtId: string; amount: number; paymentDate: string; method: PaymentMethod; note: string; createdAt: string; archived?: boolean; }
export interface Reminder { id: string; debtId: string; reminderDate: string; note: string; status: "pending" | "done"; createdAt: string; }
export interface AppData { contacts: Contact[]; debts: Debt[]; payments: Payment[]; reminders: Reminder[]; profile: { fullName: string; email: string; phone: string }; }
export interface LocalAccount { id: string; name: string; email: string; passwordHash: string; }
export type Page = "dashboard" | "debts" | "contacts" | "payments" | "reminders" | "reports" | "settings";
export type DebtFilter = "all" | DebtType | DebtStatus;


