import { Suspense, lazy, useEffect, useMemo, useState, useRef } from "react";
import { Bell, BookOpenText, CircleDollarSign, FileBarChart2, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, UsersRound, WalletCards, X } from "lucide-react";
import type { AppData, Contact, Debt, LocalAccount, Page, Reminder } from "./types";
import { dateInput, debtRemaining, id } from "./lib/format";
import { clearAccountData, emptyData, getSession, readAccounts, seedDemoData, setSession } from "./lib/storage";
import { localStorageRepository } from "./lib/repository";
import { AuthPage } from "./pages/AuthPage";
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
import { DebtsPage } from "./pages/DebtsPage";
import { ContactsPage } from "./pages/ContactsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { RemindersPage } from "./pages/RemindersPage";
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
import { SettingsPage } from "./pages/SettingsPage";
import { Modal } from "./components/Modal";
import { ContactForm, DebtForm, PaymentForm, ReminderForm, type DebtInput } from "./components/Forms";
import { ContactDetail, DebtDetail } from "./components/DetailDialogs";

const NAV = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "debts", label: "Sổ nợ", icon: BookOpenText },
  { id: "contacts", label: "Người giao dịch", icon: UsersRound },
  { id: "payments", label: "Thanh toán", icon: WalletCards },
  { id: "reminders", label: "Nhắc nhở", icon: Bell },
  { id: "reports", label: "Báo cáo", icon: FileBarChart2 },
] as const;
const PAGE_LABELS: Record<Page, string> = { dashboard: "Tổng quan", debts: "Sổ nợ", contacts: "Người giao dịch", payments: "Thanh toán", reminders: "Nhắc nhở", reports: "Báo cáo", settings: "Cài đặt" };

export default function App() {
  const [initial] = useState(() => {
    const sessionId = getSession();
    const savedAccount = readAccounts().find((item) => item.id === sessionId) ?? null;
    return { account: savedAccount, data: savedAccount ? localStorageRepository.load(savedAccount) : emptyData("", "") };
  });
  const [account, setAccount] = useState<LocalAccount | null>(initial.account);
  const [data, setData] = useState<AppData>(initial.data);
  const [page, setPage] = useState<Page>("dashboard");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<"new-debt" | "edit-debt" | "payment" | "contact" | "edit-contact" | "debt-detail" | "contact-detail" | "reminder" | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState<"success" | "error">("success");

  function notify(message: string, kind: "success" | "error" = "success") {
    setToast(message); setToastKind(kind);
    window.setTimeout(() => setToast(""), 3200);
  }

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPage("debts"); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!account) return;
    try { localStorageRepository.save(account.id, data); }
    catch {
      window.setTimeout(() => {
        setToast("Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy."); setToastKind("error");
        window.setTimeout(() => setToast(""), 3200);
      }, 0);
    }
  }, [account, data]);
  const acceptAccount = (next: LocalAccount) => {
    setSession(next.id); setAccount(next); setData(localStorageRepository.load(next)); setPage("dashboard");
  };
  const logout = () => { setSession(null); setAccount(null); setData(emptyData("", "")); setDialog(null); setPage("dashboard"); };
  const navigate = (next: Page) => { setPage(next); setSearch(""); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const openDebt = (debt: Debt) => { setSelectedDebt(debt); setDialog("debt-detail"); };
  const openNewDebt = () => { setSelectedDebt(null); setDialog("new-debt"); };
  const openPayment = (debt?: Debt) => { setSelectedDebt(debt ?? null); setDialog("payment"); };
  const openContact = (contact?: Contact) => { setSelectedContact(contact ?? null); setDialog(contact ? "edit-contact" : "contact"); };

  const saveDebt = (value: DebtInput) => {
    const now = new Date().toISOString();
    let contacts = [...data.contacts];
    let contactId = value.contactId;
    let match = contacts.find((item) => item.id === contactId);
    if (!match) match = contacts.find((item) => !item.archived && ((value.phone && item.phone.replace(/\s/g, "") === value.phone.replace(/\s/g, "")) || item.name.trim().toLowerCase() === value.name.trim().toLowerCase()));
    if (match) {
      contactId = match.id;
      contacts = contacts.map((item) => item.id === match?.id ? { ...item, name: value.name, phone: value.phone, archived: false } : item);
    } else {
      contactId = id("contact");
      contacts.push({ id: contactId, name: value.name, phone: value.phone, note: "", createdAt: now });
    }
    if (dialog === "edit-debt" && selectedDebt) {
      const updated = { ...selectedDebt, contactId, type: value.type, amount: value.amount, transactionDate: value.transactionDate, dueDate: value.dueDate, description: value.description, note: value.note, updatedAt: now };
      setData({ ...data, contacts, debts: data.debts.map((item) => item.id === selectedDebt.id ? updated : item) });
      setSelectedDebt(updated); setDialog("debt-detail"); notify("Đã cập nhật khoản nợ.");
    } else {
      const newDebt: Debt = { id: id("debt"), code: "GN-" + Date.now().toString().slice(-7), contactId, type: value.type, amount: value.amount, transactionDate: value.transactionDate, dueDate: value.dueDate, description: value.description, note: value.note, createdAt: now, updatedAt: now };
      setData({ ...data, contacts, debts: [newDebt, ...data.debts] });
      setSelectedDebt(newDebt); setDialog("debt-detail"); notify("Đã thêm khoản nợ mới.");
    }
  };

  const savePayment = (value: { debtId: string; amount: number; paymentDate: string; method: "cash" | "transfer" | "other"; note: string }) => {
    const debt = data.debts.find((item) => item.id === value.debtId);
    if (!debt || value.amount <= 0 || value.amount > debtRemaining(debt, data.payments)) { notify("Số tiền thanh toán không hợp lệ.", "error"); return; }
    const payment = { id: id("payment"), debtId: debt.id, amount: value.amount, paymentDate: value.paymentDate, method: value.method, note: value.note, createdAt: new Date().toISOString() };
    setData({ ...data, payments: [...data.payments, payment] });
    setSelectedDebt(debt); setDialog("debt-detail"); notify("Đã ghi nhận thanh toán.");
  };

  const deleteDebt = () => {
    if (!selectedDebt) return;
    if (!window.confirm("Xóa khoản " + selectedDebt.code + " cùng lịch sử thanh toán và nhắc nhở liên quan?")) return;
    setData({ ...data, debts: data.debts.filter((item) => item.id !== selectedDebt.id), payments: data.payments.filter((item) => item.debtId !== selectedDebt.id), reminders: data.reminders.filter((item) => item.debtId !== selectedDebt.id) });
    setDialog(null); setSelectedDebt(null); notify("Đã xóa khoản nợ.");
  };

  const saveContact = (value: { name: string; phone: string; note: string }) => {
    const now = new Date().toISOString();
    if (dialog === "edit-contact" && selectedContact) {
      const updated = { ...selectedContact, ...value, archived: false };
      setData({ ...data, contacts: data.contacts.map((item) => item.id === selectedContact.id ? updated : item) });
      setSelectedContact(updated); notify("Đã cập nhật thông tin người giao dịch.");
    } else {
      const contact = { id: id("contact"), ...value, createdAt: now };
      setData({ ...data, contacts: [...data.contacts, contact] }); notify("Đã thêm người giao dịch.");
    }
    setDialog(null);
  };

  const deleteContact = (contact: Contact) => {
    const debts = data.debts.filter((debt) => debt.contactId === contact.id);
    const remaining = debts.reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0);
    if (remaining > 0) {
      if (!window.confirm(contact.name + " còn " + new Intl.NumberFormat("vi-VN").format(remaining) + " ₫ chưa tất toán. Ẩn người này khỏi danh bạ và giữ lại lịch sử công nợ?")) return;
      setData({ ...data, contacts: data.contacts.map((item) => item.id === contact.id ? { ...item, archived: true } : item) });
      notify("Đã ẩn người giao dịch; lịch sử nợ vẫn được giữ.");
      return;
    }
    if (debts.length > 0) {
      if (!window.confirm("Ẩn " + contact.name + " khỏi danh bạ? Lịch sử giao dịch sẽ được giữ lại.")) return;
      setData({ ...data, contacts: data.contacts.map((item) => item.id === contact.id ? { ...item, archived: true } : item) });
    } else {
      if (!window.confirm("Xóa " + contact.name + " khỏi danh bạ?")) return;
      setData({ ...data, contacts: data.contacts.filter((item) => item.id !== contact.id) });
    }
    notify("Đã xóa người giao dịch khỏi danh bạ.");
  };

  const restoreContact = (contact: Contact) => {
    setData({ ...data, contacts: data.contacts.map((item) => item.id === contact.id ? { ...item, archived: false } : item) });
    notify("Đã khôi phục người giao dịch.");
  };
  const saveReminder = (note: string) => {
    if (!selectedDebt) return;
    const reminder: Reminder = { id: id("reminder"), debtId: selectedDebt.id, reminderDate: dateInput(), note, status: "done", createdAt: new Date().toISOString() };
    setData({ ...data, reminders: [...data.reminders, reminder] });
    setDialog(null); notify("Đã lưu lịch sử nhắc nhở.");
  };

  const saveProfile = (value: AppData["profile"]) => {
    setData({ ...data, profile: value }); notify("Đã lưu thông tin cá nhân.");
  };
  const exportBackup = () => {
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), app: "So Ghi No", data }, null, 2);
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); link.download = "so-ghi-no-sao-luu-" + dateInput() + ".json"; link.click(); URL.revokeObjectURL(link.href); notify("Đã tải bản sao lưu.");
  };
  const importBackup = async (file: File) => {
    const parsed = JSON.parse(await file.text()) as { data?: Partial<AppData> } & Partial<AppData>;
    const candidate = (parsed.data ?? parsed) as Partial<AppData>;
    if (!Array.isArray(candidate.contacts) || !Array.isArray(candidate.debts) || !Array.isArray(candidate.payments) || !Array.isArray(candidate.reminders)) throw new Error("Tệp này không phải bản sao lưu hợp lệ của Sổ Ghi Nợ.");
    const next: AppData = { contacts: candidate.contacts, debts: candidate.debts, payments: candidate.payments, reminders: candidate.reminders, profile: { ...data.profile, ...(candidate.profile ?? {}) } };
    if (next.debts.some((debt) => debt.amount <= 0 || !next.contacts.some((contact) => contact.id === debt.contactId))) throw new Error("Bản sao lưu có khoản nợ không hợp lệ.");
    setData(next); notify("Đã khôi phục bản sao lưu.");
  };
  const resetDemo = () => {
    if (!account || account.email !== "demo@so-ghino.vn") { notify("Chỉ tài khoản mẫu mới có thể nạp lại dữ liệu demo.", "error"); return; }
    if (!window.confirm("Thay toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu?")) return;
    clearAccountData(account.id); const demo = seedDemoData(); setData(demo); notify("Đã nạp lại dữ liệu mẫu.");
  };

  const activeReminders = useMemo(() => data.debts.filter((debt) => debtRemaining(debt, data.payments) > 0 && debt.dueDate <= (() => { const limit = new Date(); limit.setDate(limit.getDate() + 7); return dateInput(limit); })()).length, [data]);
  if (!account) return <AuthPage onAuthenticated={acceptAccount} />;

  const navTo = (next: Page) => navigate(next);
  return <div className="app-frame">
    <div className={"mobile-scrim" + (mobileOpen ? " visible" : "")} onClick={() => setMobileOpen(false)} />
    <aside className={"sidebar" + (mobileOpen ? " sidebar-open" : "")}>
      <div className="sidebar-brand"><span className="brand-mark"><BookOpenText size={22} /><CircleDollarSign size={14} /></span><span><b>Sổ Ghi Nợ</b><small>QUẢN LÝ CÔNG NỢ</small></span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={18} /></button></div>
      <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
      <nav className="main-nav">{NAV.map(({ id: navId, label, icon: Icon }) => <button key={navId} className={"nav-item" + (page === navId ? " nav-active" : "")} onClick={() => navigate(navId)}><Icon size={18} /><span>{label}</span>{navId === "reminders" && activeReminders > 0 && <i className="nav-count">{activeReminders}</i>}</button>)}</nav>
      <div className="sidebar-promo"><span className="promo-spark">✦</span><b>Sổ sách gọn gàng</b><p>Đừng bỏ lỡ những ngày thanh toán quan trọng.</p><button onClick={() => navigate("reminders")}>Xem lịch nhắc <span>→</span></button></div>
      <button className={"nav-item settings-nav" + (page === "settings" ? " nav-active" : "")} onClick={() => navigate("settings")}><Settings size={18} /><span>Cài đặt</span></button>
      <div className="sidebar-user"><span className="user-avatar">{(data.profile.fullName || account.name).split(" ").map((part) => part[0]).slice(-2).join("")}</span><span className="user-meta"><b>{data.profile.fullName || account.name}</b><small>{account.email}</small></span><button className="icon-button logout-button" title="Đăng xuất" onClick={logout}><LogOut size={17} /></button></div>
    </aside>
    <main className="main-column">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Không gian</span><b>/</b><strong>{PAGE_LABELS[page]}</strong></div><div className="topbar-actions"><label className="global-search"><Search size={16} /><input ref={searchRef} value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value) setPage("debts"); }} placeholder="Tìm khoản nợ, người giao dịch..." /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Mở nhắc nhở" onClick={() => navigate("reminders")}><Bell size={18} />{activeReminders > 0 && <i />}</button><button className="button button-primary top-add" onClick={openNewDebt}><Plus size={16} /> Thêm khoản nợ</button></div></header>
      <div className="page-content">
        <Suspense fallback={<div className="surface"><div className="empty-state">Đang tải...</div></div>}>
        {page === "dashboard" && <Dashboard data={data} onAddDebt={openNewDebt} onShowDebt={openDebt} onNavigate={navTo} />}
        {page === "debts" && <DebtsPage data={data} query={search} onAdd={openNewDebt} onShow={openDebt} />}
        {page === "contacts" && <ContactsPage data={data} onAdd={() => openContact()} onEdit={(contact) => openContact(contact)} onDelete={deleteContact} onRestore={restoreContact} onShow={(contact) => { setSelectedContact(contact); setDialog("contact-detail"); }} />}
        {page === "payments" && <PaymentsPage data={data} onShow={openDebt} onAdd={() => openPayment()} />}
        {page === "reminders" && <RemindersPage data={data} onRemind={(debt) => { setSelectedDebt(debt); setDialog("reminder"); }} onShow={openDebt} />}
        {page === "reports" && <ReportsPage data={data} />}
        {page === "settings" && <SettingsPage data={data} account={account} onProfileSave={saveProfile} onExport={exportBackup} onImport={importBackup} onResetDemo={resetDemo} />}</Suspense>
      </div>
      <footer className="page-footer"><span>© 2026 Sổ Ghi Nợ</span><span>Rõ ràng trong từng khoản.</span></footer>
    </main>
    <nav className="mobile-nav">{[{ id: "dashboard" as const, icon: LayoutDashboard, label: "Tổng quan" }, { id: "debts" as const, icon: BookOpenText, label: "Sổ nợ" }, { id: "contacts" as const, icon: UsersRound, label: "Danh bạ" }, { id: "reminders" as const, icon: Bell, label: "Nhắc nhở" }].map(({ id: navId, icon: Icon, label }) => <button key={navId} className={page === navId ? "mobile-nav-active" : ""} onClick={() => navigate(navId)}><Icon size={19} /><span>{label}</span></button>)}</nav>
    <button className="mobile-fab" aria-label="Thêm khoản nợ" onClick={openNewDebt}><Plus size={23} /></button>

    {dialog === "new-debt" && <Modal title="Thêm khoản nợ" onClose={() => setDialog(null)} wide><DebtForm data={data} onSave={saveDebt} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === "edit-debt" && selectedDebt && <Modal title="Chỉnh sửa khoản nợ" onClose={() => setDialog("debt-detail")} wide><DebtForm data={data} initial={selectedDebt} onSave={saveDebt} onCancel={() => setDialog("debt-detail")} /></Modal>}
    {dialog === "payment" && <Modal title="Ghi nhận thanh toán" onClose={() => setDialog(selectedDebt ? "debt-detail" : null)}><PaymentForm data={data} defaultDebtId={selectedDebt?.id} onSave={savePayment} onCancel={() => setDialog(selectedDebt ? "debt-detail" : null)} /></Modal>}
    {dialog === "contact" && <Modal title="Thêm người giao dịch" onClose={() => setDialog(null)}><ContactForm onSave={saveContact} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === "edit-contact" && selectedContact && <Modal title="Chỉnh sửa thông tin" onClose={() => setDialog(null)}><ContactForm initial={selectedContact} onSave={saveContact} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === "debt-detail" && selectedDebt && <Modal title={"Chi tiết khoản nợ · " + selectedDebt.code} onClose={() => setDialog(null)} wide><DebtDetail data={data} debt={data.debts.find((item) => item.id === selectedDebt.id) ?? selectedDebt} onPay={() => openPayment(selectedDebt)} onEdit={() => setDialog("edit-debt")} onDelete={deleteDebt} /></Modal>}
    {dialog === "contact-detail" && selectedContact && <Modal title="Thông tin người giao dịch" onClose={() => setDialog(null)} wide><ContactDetail data={data} contact={data.contacts.find((item) => item.id === selectedContact.id) ?? selectedContact} onShowDebt={(debt) => openDebt(debt)} /></Modal>}
    {dialog === "reminder" && selectedDebt && <Modal title={"Ghi nhận nhắc · " + (data.contacts.find((item) => item.id === selectedDebt.contactId)?.name ?? "Người giao dịch")} onClose={() => setDialog(null)}><ReminderForm onSave={saveReminder} onCancel={() => setDialog(null)} /></Modal>}
    {toast && <div className={"toast toast-" + toastKind} role="status"><span>{toastKind === "success" ? "✓" : "!"}</span>{toast}</div>}
  </div>;
}













