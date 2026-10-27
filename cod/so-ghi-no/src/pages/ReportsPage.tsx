import { useMemo, useState } from "react";
import { Download, FileBarChart, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData } from "../types";
import { contactName, dateInput, dateLabel, debtRemaining, money, shortMoney } from "../lib/format";
import { EmptyState } from "../components/Modal";
import { currentDate } from "../lib/time";
export function ReportsPage({ data }: { data: AppData }) {
  const now = currentDate(); const monthStart = dateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  const [from, setFrom] = useState(monthStart); const [to, setTo] = useState(dateInput()); const [kind, setKind] = useState("all");
  const filtered = useMemo(() => data.debts.filter((debt) => debt.transactionDate >= from && debt.transactionDate <= to && (kind === "all" || debt.type === kind)), [data, from, to, kind]);
  const sums = useMemo(() => {
    const paidByType = (type: "lent" | "borrowed") => filtered.filter((debt) => debt.type === type).reduce((sum, debt) => sum + debt.amount - debtRemaining(debt, data.payments), 0);
    return { lent: filtered.filter((debt) => debt.type === "lent").reduce((sum, debt) => sum + debt.amount, 0), borrowed: filtered.filter((debt) => debt.type === "borrowed").reduce((sum, debt) => sum + debt.amount, 0), left: filtered.reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0), recovered: paidByType("lent"), paid: paidByType("borrowed") };
  }, [filtered, data.payments]);  const chartData = [{ name: "Cho vay", value: sums.lent }, { name: "Đi vay", value: sums.borrowed }];
  const exportCsv = () => {
    const rows = [["Mã khoản", "Người giao dịch", "Loại", "Nội dung", "Ngày giao dịch", "Ngày đến hạn", "Số tiền", "Đã thanh toán", "Còn lại", "Trạng thái"]];
    for (const debt of filtered) {
      const paid = debt.amount - debtRemaining(debt, data.payments);
      const status = debtRemaining(debt, data.payments) === 0 ? "Đã thanh toán" : debt.dueDate < dateInput() ? "Quá hạn" : paid > 0 ? "Đang thanh toán" : "Chưa thanh toán";
      rows.push([debt.code, contactName(data, debt.contactId), debt.type === "lent" ? "Tôi cho vay" : "Tôi đi vay", debt.description, debt.transactionDate, debt.dueDate, String(debt.amount), String(paid), String(debtRemaining(debt, data.payments)), status]);
    }
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => "\"" + cell.replaceAll("\"", "\"\"") + "\"").join(",")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "so-ghi-no-" + from + "-den-" + to + ".csv"; link.click(); URL.revokeObjectURL(link.href);
  };
  return <div className="page-stack">
    <div className="page-title-row"><div><span className="eyebrow">PHÂN TÍCH</span><h1>Báo cáo</h1><p>Tổng hợp giá trị khoản vay theo khoảng thời gian.</p></div><button className="button button-secondary" onClick={exportCsv}><Download size={16} /> Xuất CSV</button></div>
    <section className="surface report-filters"><label className="field compact"><span>Từ ngày</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} /></label><label className="field compact"><span>Đến ngày</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} /></label><label className="field compact"><span>Loại giao dịch</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">Tất cả giao dịch</option><option value="lent">Tôi cho vay</option><option value="borrowed">Tôi đi vay</option></select></label><span className="report-period"><Search size={15} /> {filtered.length} khoản trong kỳ</span></section>
    <section className="stats-grid report-stats"><article className="stat-card"><div className="stat-icon mint">↗</div><p>Tổng tiền cho vay</p><strong>{money(sums.lent)}</strong><small>Khoản tạo trong kỳ</small></article><article className="stat-card"><div className="stat-icon rose">↙</div><p>Tổng tiền đi vay</p><strong>{money(sums.borrowed)}</strong><small>Khoản tạo trong kỳ</small></article><article className="stat-card"><div className="stat-icon blue">↓</div><p>Đã thu hồi</p><strong>{money(sums.recovered)}</strong><small>Từ các khoản cho vay</small></article><article className="stat-card"><div className="stat-icon amber">↑</div><p>Đã thanh toán</p><strong>{money(sums.paid)}</strong><small>Từ các khoản đi vay</small></article><article className="stat-card"><div className="stat-icon blue"><FileBarChart size={18} /></div><p>Còn phải thu / trả</p><strong>{money(sums.left)}</strong><small>Số dư còn lại trong kỳ</small></article></section>
    <section className="surface chart-card report-chart"><div className="section-heading"><div><h2>Cho vay và đi vay</h2><p>Giá trị ban đầu của các khoản trong kỳ</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eef1ed" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#758078", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b948e", fontSize: 10 }} tickFormatter={(value) => shortMoney(Number(value))} /><Tooltip formatter={(value) => money(Number(value ?? 0))} /><Bar dataKey="value" name="Số tiền" fill="#438c67" radius={[8, 8, 0, 0]} maxBarSize={90} /></BarChart></ResponsiveContainer></div></section>
    <section className="surface table-surface"><div className="section-heading padded-heading"><div><h2>Chi tiết giao dịch</h2><p>Dữ liệu khoản nợ theo bộ lọc đang chọn</p></div></div>{filtered.length === 0 ? <EmptyState icon={<FileBarChart />} title="Không có giao dịch trong kỳ" description="Hãy chọn khoảng thời gian khác để xem báo cáo." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>MÃ KHOẢN</th><th>NGƯỜI GIAO DỊCH</th><th>LOẠI</th><th>NGÀY</th><th>SỐ TIỀN</th><th>ĐÃ TRẢ</th><th>CÒN LẠI</th></tr></thead><tbody>{filtered.map((debt) => <tr key={debt.id}><td><b>{debt.code}</b></td><td>{contactName(data, debt.contactId)}</td><td>{debt.type === "lent" ? "Cho vay" : "Đi vay"}</td><td>{dateLabel(debt.transactionDate)}</td><td className="numeric">{money(debt.amount)}</td><td className="numeric muted-cell">{money(debt.amount - debtRemaining(debt, data.payments))}</td><td className="numeric"><b>{money(debtRemaining(debt, data.payments))}</b></td></tr>)}</tbody></table></div>}</section>
  </div>;
}


