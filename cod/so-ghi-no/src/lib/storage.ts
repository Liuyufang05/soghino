import type { AppData, Contact, Debt, LocalAccount, Payment } from "../types";
import { dateInput, id } from "./format";
const ACCOUNTS_KEY = "so-ghi-no:accounts";
const SESSION_KEY = "so-ghi-no:session";
const DATA_PREFIX = "so-ghi-no:data:";
const offsetDate = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return dateInput(date); };
export const emptyData = (name: string, email: string): AppData => ({ contacts: [], debts: [], payments: [], reminders: [], profile: { fullName: name, email, phone: "" } });
export const seedDemoData = (): AppData => {
  const createdAt = new Date().toISOString();
  const contacts: Contact[] = [
    { id: "contact-a", name: "Nguyễn Văn A", phone: "0901 234 567", note: "Bạn học cũ", createdAt },
    { id: "contact-b", name: "Trần Thị B", phone: "0912 345 678", note: "Đồng nghiệp", createdAt },
    { id: "contact-c", name: "Phạm Minh C", phone: "0987 654 321", note: "", createdAt },
    { id: "contact-d", name: "Lê Thu D", phone: "0933 222 111", note: "Người thân", createdAt },
  ];
  const debts: Debt[] = [
    { id: "debt-a", code: "GN-24001", contactId: "contact-a", type: "lent", amount: 5_000_000, transactionDate: offsetDate(-18), dueDate: offsetDate(8), description: "Vay sửa xe", note: "Đã nhận 2 triệu đợt đầu", createdAt, updatedAt: createdAt },
    { id: "debt-b", code: "GN-24002", contactId: "contact-b", type: "borrowed", amount: 1_200_000, transactionDate: offsetDate(-30), dueDate: offsetDate(-4), description: "Mượn tiền sinh hoạt", note: "", createdAt, updatedAt: createdAt },
    { id: "debt-c", code: "GN-24003", contactId: "contact-c", type: "lent", amount: 1_000_000, transactionDate: offsetDate(-45), dueDate: offsetDate(-12), description: "Ứng trước", note: "Đã hoàn tất", createdAt, updatedAt: createdAt },
    { id: "debt-d", code: "GN-24004", contactId: "contact-d", type: "lent", amount: 2_500_000, transactionDate: offsetDate(-5), dueDate: offsetDate(3), description: "Vay đóng học phí", note: "Hẹn trả đầu tháng", createdAt, updatedAt: createdAt },
    { id: "debt-e", code: "GN-24005", contactId: "contact-c", type: "borrowed", amount: 3_200_000, transactionDate: offsetDate(-12), dueDate: offsetDate(20), description: "Mượn mua laptop", note: "", createdAt, updatedAt: createdAt },
    { id: "debt-f", code: "GN-24006", contactId: "contact-a", type: "lent", amount: 900_000, transactionDate: offsetDate(-35), dueDate: offsetDate(-2), description: "Chia tiền đặt cọc", note: "", createdAt, updatedAt: createdAt },
  ];
  const payments: Payment[] = [
    { id: "payment-a", debtId: "debt-a", amount: 2_000_000, paymentDate: offsetDate(-6), method: "transfer", note: "Chuyển khoản lần 1", createdAt },
    { id: "payment-b", debtId: "debt-c", amount: 1_000_000, paymentDate: offsetDate(-8), method: "cash", note: "Thanh toán đủ", createdAt },
    { id: "payment-c", debtId: "debt-e", amount: 800_000, paymentDate: offsetDate(-2), method: "cash", note: "Trả trước", createdAt },
    { id: "payment-d", debtId: "debt-f", amount: 700_000, paymentDate: offsetDate(-1), method: "transfer", note: "", createdAt },
  ];
  return { contacts, debts, payments, reminders: [], profile: { fullName: "Nguyễn Minh Anh", email: "demo@so-ghino.vn", phone: "0900 000 000" } };
};
export const readAccounts = (): LocalAccount[] => { try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as LocalAccount[]; } catch { return []; } };
const writeAccounts = (accounts: LocalAccount[]) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
const hex = (bytes: Uint8Array) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
const derivePassword = async (password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return hex(new Uint8Array(bits));
};
export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iterations = 180000;
  return "pbkdf2$" + iterations + "$" + hex(salt) + "$" + await derivePassword(password, salt, iterations);
};
export const verifyPassword = async (password: string, encoded: string) => {
  const [scheme, rawIterations, saltHex, expected] = encoded.split("$");
  if (scheme !== "pbkdf2" || !rawIterations || !saltHex || !expected) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    return hex(new Uint8Array(digest)) === encoded;
  }
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((part) => parseInt(part, 16)) ?? []);
  const actual = await derivePassword(password, salt, Number(rawIterations));
  return actual === expected;
};export const getSession = () => localStorage.getItem(SESSION_KEY);
export const setSession = (accountId: string | null) => accountId ? localStorage.setItem(SESSION_KEY, accountId) : localStorage.removeItem(SESSION_KEY);
export const ensureDemoAccount = async (): Promise<LocalAccount> => {
  const email = "demo@so-ghino.vn";
  const accounts = readAccounts();
  let account = accounts.find((item) => item.email === email);
  if (!account) {
    account = { id: "demo-user", name: "Nguyễn Minh Anh", email, passwordHash: await hashPassword("demo1234") };
    writeAccounts([...accounts, account]);
  }
  if (account && !account.passwordHash.startsWith("pbkdf2$")) { account = { ...account, passwordHash: await hashPassword("demo1234") }; writeAccounts(accounts.map((item) => item.id === account?.id ? account! : item)); }
  if (!localStorage.getItem(DATA_PREFIX + account.id)) saveData(account.id, seedDemoData());
  return account;
};
export const registerAccount = async (name: string, email: string, password: string) => {
  const accounts = readAccounts();
  const normalized = email.trim().toLowerCase();
  if (accounts.some((account) => account.email === normalized)) throw new Error("Email này đã được đăng ký.");
  const account: LocalAccount = { id: id("user"), name: name.trim(), email: normalized, passwordHash: await hashPassword(password) };
  writeAccounts([...accounts, account]);
  saveData(account.id, emptyData(account.name, account.email));
  return account;
};
export const authenticate = async (email: string, password: string) => {
  const accounts = readAccounts(); const account = accounts.find((item) => item.email === email.trim().toLowerCase());
  if (!account || !await verifyPassword(password, account.passwordHash)) throw new Error("Email hoặc mật khẩu không chính xác.");
  if (!account.passwordHash.startsWith("pbkdf2$")) {
    const upgraded = { ...account, passwordHash: await hashPassword(password) };
    writeAccounts(accounts.map((item) => item.id === account.id ? upgraded : item)); return upgraded;
  }
  return account;
};export const loadData = (account: LocalAccount): AppData => {
  try { const saved = localStorage.getItem(DATA_PREFIX + account.id); return saved ? { ...emptyData(account.name, account.email), ...JSON.parse(saved) } as AppData : emptyData(account.name, account.email); } catch { return emptyData(account.name, account.email); }
};
export const saveData = (accountId: string, data: AppData) => localStorage.setItem(DATA_PREFIX + accountId, JSON.stringify(data));
export const clearAccountData = (accountId: string) => localStorage.removeItem(DATA_PREFIX + accountId);



