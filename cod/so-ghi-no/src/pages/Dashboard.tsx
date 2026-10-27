import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, CircleDollarSign, Clock3, HandCoins, Plus, UsersRound, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData, Debt } from "../types";
import { contactName, dateInput, dateLabel, debtRemaining, debtStatus, money, shortMoney } from "../lib/format";
import { EmptyState, StatusPill } from "../components/Modal";
import { currentDate } from "../lib/time";
const monthLabel = (offset: number) => { const date = new Date(); date.setMonth(date.getMonth() - offset); return date.toLocaleDateString("vi-VN", { month: "short" }); };
export function Dashboard({ data, onAddDebt, onShowDebt, onNavigate }: { data: AppData; onAddDebt: () => void; onShowDebt: (debt: Debt) => void; onNavigate: (page: "debts" | "contacts" | "payments" | "reminders" | "reports" | "settings" | "dashboard") => void }) {
  const stats = useMemo(() => {
    const lent = data.debts.filter((debt) => debt.type === "lent"); const borrowed = data.debts.filter((debt) => debt.type === "borrowed");
    const sumLeft = (items: Debt[]) => items.reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0);
    const limit = currentDate(); limit.setDate(limit.getDate() + 7);
    const dueSoon = data.debts.filter((debt) => debtRemaining(debt, data.payments) > 0 && debt.dueDate >= dateInput() && debt.dueDate <= dateInput(limit)).length;
    const amountByType = (type: Debt["type"]) => data.payments.filter((payment) => data.debts.find((debt) => debt.id === payment.debtId)?.type === type).reduce((sum, payment) => sum + payment.amount, 0);
    return { lent: sumLeft(lent), borrowed: sumLeft(borrowed), recovered: amountByType("lent"), paid: amountByType("borrowed"), dueSoon, contacts: new Set(data.debts.map((debt) => debt.contactId)).size };
  }, [data]);
  const monthly = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index; const monthDate = currentDate(); monthDate.setDate(1); monthDate.setMonth(monthDate.getMonth() - offset);
    const key = monthDate.getFullYear() + "-" + String(monthDate.getMonth() + 1).padStart(2, "0");
    const loaned = data.debts.filter((debt) => debt.type === "lent" && debt.transactionDate.slice(0, 7) === key).reduce((sum, debt) => sum + debt.amount, 0);
    const borrowed = data.debts.filter((debt) => debt.type === "borrowed" && debt.transactionDate.slice(0, 7) === key).reduce((sum, debt) => sum + debt.amount, 0);
    return { month: monthLabel(offset), "Cho vay": loaned, "Đi vay": borrowed };
  }), [data.debts]);
  const pie = useMemo(() => { const total = data.debts.reduce((sum, debt) => sum + debt.amount, 0); const balance = data.debts.reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0); return [{ name: "Còn lại", value: balance }, { name: "Đã thanh toán", value: Math.max(0, total - balance) }]; }, [data]);
  const cashflow = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index; const monthDate = currentDate(); monthDate.setDate(1); monthDate.setMonth(monthDate.getMonth() - offset);
    const key = monthDate.getFullYear() + "-" + String(monthDate.getMonth() + 1).padStart(2, "0"); const payments = data.payments.filter((payment) => payment.paymentDate.slice(0, 7) === key);
    const amount = (type: "lent" | "borrowed") => payments.filter((payment) => data.debts.find((debt) => debt.id === payment.debtId)?.type === type).reduce((sum, payment) => sum + payment.amount, 0);
    return { month: monthLabel(offset), "Đã thu": amount("lent"), "Đã trả": amount("borrowed") };
  }), [data]);  const recent = useMemo(() => {
    const debtItems = data.debts.map((debt) => ({ kind: "debt" as const, date: debt.transactionDate, debt }));
    const paymentItems = data.payments.map((payment) => ({ kind: "payment" as const, date: payment.paymentDate, payment }));
    return [...debtItems, ...paymentItems].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [data]);
  const cards = [
    { label: "Đang phải thu", value: stats.lent, icon: ArrowDownLeft, tint: "mint", note: "Người khác nợ bạn" },
    { label: "Đang phải trả", value: stats.borrowed, icon: ArrowUpRight, tint: "rose", note: "Bạn nợ người khác" },
    { label: "Đã thu hồi", value: stats.recovered, icon: HandCoins, tint: "blue", note: "Tổng khoản đã nhận" },
    { label: "Đã thanh toán", value: stats.paid, icon: WalletCards, tint: "amber", note: "Tổng khoản đã trả" },
  ];
  return <div className="page-stack">
    <section className="welcome-banner"><div><span className="eyebrow light-eyebrow">{currentDate().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}</span><h1>Chào bạn, {data.profile.fullName.split(" ").slice(-1)[0]} <span>✦</span></h1><p>Mọi khoản thu chi của bạn, rõ ràng trong một cuốn sổ.</p><button className="button button-white" onClick={onAddDebt}><Plus size={17} /> Thêm khoản nợ</button></div><div className="welcome-orbit"><div className="orbit-ring" /><div className="orbit-center"><div className="book-decor"><span>₫</span><i /></div></div><span className="orbit-coin coin-one">₫</span><span className="orbit-coin coin-two">✓</span></div></section>
    <section className="stats-grid">{cards.map(({ label, value, icon: Icon, tint, note }) => <article className="stat-card" key={label}><div className={"stat-icon " + tint}><Icon size={19} /></div><p>{label}</p><strong>{money(value)}</strong><small>{note}</small></article>)}</section>
    <section className="mini-stats"><button onClick={() => onNavigate("contacts")}><span className="mini-icon mint"><UsersRound size={18} /></span><span><b>{stats.contacts}</b><small>người có giao dịch</small></span><ArrowDownLeft size={15} /></button><button onClick={() => onNavigate("reminders")}><span className="mini-icon amber"><CalendarClock size={18} /></span><span><b>{stats.dueSoon}</b><small>khoản sắp đến hạn</small></span><ArrowDownLeft size={15} /></button></section>
    <section className="dashboard-grid">
      <article className="surface chart-card"><div className="section-heading"><div><h2>Dòng tiền công nợ</h2><p>Giá trị khoản vay tạo theo tháng</p></div><span className="period-tag">6 tháng gần đây</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} barGap={7} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eef1ed" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8b948e", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b948e", fontSize: 10 }} tickFormatter={(value) => shortMoney(Number(value))} /><Tooltip formatter={(value) => money(Number(value ?? 0))} contentStyle={{ borderRadius: 12, border: "1px solid #edf0ed", fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /><Bar dataKey="Cho vay" fill="#3b8d66" radius={[5, 5, 0, 0]} maxBarSize={25} /><Bar dataKey="Đi vay" fill="#d7a45e" radius={[5, 5, 0, 0]} maxBarSize={25} /></BarChart></ResponsiveContainer></div></article>
      <article className="surface chart-card balance-chart"><div className="section-heading"><div><h2>Tình trạng thanh toán</h2><p>Tổng hợp toàn bộ khoản nợ</p></div></div>{stats.lent + stats.borrowed === 0 ? <EmptyState icon={<CircleDollarSign />} title="Chưa có số liệu" description="Thêm khoản nợ để xem biểu đồ." /> : <><div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={84} paddingAngle={4} stroke="none"><Cell fill="#3b8d66" /><Cell fill="#e8eee8" /></Pie><Tooltip formatter={(value) => money(Number(value ?? 0))} /></PieChart></ResponsiveContainer><div className="pie-center"><small>Còn phải thu/trả</small><b>{shortMoney(pie[0].value)}</b></div></div><div className="chart-legend"><span><i className="dot-green" /> Còn lại <b>{money(pie[0].value)}</b></span><span><i className="dot-gray" /> Đã thanh toán <b>{money(pie[1].value)}</b></span></div></>}</article>
    </section>
    <section className="surface chart-card cashflow-chart"><div className="section-heading"><div><h2>Tiền thu và tiền trả</h2><p>Các khoản thanh toán đã ghi nhận theo tháng</p></div><span className="period-tag">6 tháng gần đây</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={cashflow} barGap={9} margin={{ top: 10, right: 12, bottom: 0, left: -10 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eef1ed" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8b948e", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b948e", fontSize: 10 }} tickFormatter={(value) => shortMoney(Number(value))} /><Tooltip formatter={(value) => money(Number(value ?? 0))} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /><Bar dataKey="Đã thu" fill="#3b8d66" radius={[5, 5, 0, 0]} maxBarSize={25} /><Bar dataKey="Đã trả" fill="#d7a45e" radius={[5, 5, 0, 0]} maxBarSize={25} /></BarChart></ResponsiveContainer></div></section>    <section className="surface activity-card"><div className="section-heading"><div><h2>Hoạt động gần đây</h2><p>Cập nhật mới nhất trong sổ của bạn</p></div><button className="text-link" onClick={() => onNavigate("payments")}>Xem tất cả <ArrowDownLeft size={15} /></button></div>{recent.length === 0 ? <EmptyState icon={<Clock3 />} title="Sổ đang còn trống" description="Giao dịch gần đây sẽ xuất hiện tại đây." action={<button className="button button-secondary" onClick={onAddDebt}>Thêm khoản đầu tiên</button>} /> : <div className="activity-list">{recent.map((item) => {
      if (item.kind === "debt") return <button className="activity-row" key={"d" + item.debt.id} onClick={() => onShowDebt(item.debt)}><span className={"activity-symbol " + item.debt.type}><CircleDollarSign size={17} /></span><span className="activity-main"><b>{contactName(data, item.debt.contactId)}</b><small>{item.debt.type === "lent" ? "Khoản cho vay" : "Khoản đi vay"} · {item.debt.description}</small></span><span className="activity-date">{dateLabel(item.debt.transactionDate)}</span><span className={"activity-amount " + item.debt.type}>{item.debt.type === "lent" ? "+" : "−"}{money(item.debt.amount)}</span><StatusPill status={debtStatus(item.debt, data.payments)} /></button>;
      const debt = data.debts.find((candidate) => candidate.id === item.payment.debtId); if (!debt) return null;
      return <button className="activity-row" key={"p" + item.payment.id} onClick={() => onShowDebt(debt)}><span className={"activity-symbol " + debt.type}><HandCoins size={17} /></span><span className="activity-main"><b>{contactName(data, debt.contactId)}</b><small>{debt.type === "lent" ? "Đã thu hồi" : "Đã thanh toán"} · {debt.description}</small></span><span className="activity-date">{dateLabel(item.payment.paymentDate)}</span><span className={"activity-amount " + debt.type}>{debt.type === "lent" ? "+" : "−"}{money(item.payment.amount)}</span><StatusPill status={debtStatus(debt, data.payments)} /></button>;
    })}</div>}</section>
  </div>;
}



