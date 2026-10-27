import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { AppData, Debt, DebtFilter } from "../types";
import { contactName, dateLabel, debtPaid, debtRemaining, debtStatus, money } from "../lib/format";
import { EmptyState, StatusPill } from "../components/Modal";
export function DebtsPage({ data, query, onAdd, onShow }: { data: AppData; query: string; onAdd: () => void; onShow: (debt: Debt) => void }) {
  const [filter, setFilter] = useState<DebtFilter>("all"); const [sort, setSort] = useState("newest"); const [localSearch, setLocalSearch] = useState("");
  const term = (query || localSearch).trim().toLowerCase();
  const filtered = useMemo(() => data.debts.filter((debt) => {
    const contact = data.contacts.find((candidate) => candidate.id === debt.contactId);
    const matches = !term || [debt.code, debt.description, contact?.name, contact?.phone].some((value) => value?.toLowerCase().includes(term));
    const status = debtStatus(debt, data.payments);
    return matches && (filter === "all" || filter === debt.type || filter === status);
  }).sort((a, b) => {
    if (sort === "oldest") return a.transactionDate.localeCompare(b.transactionDate);
    if (sort === "high") return b.amount - a.amount;
    if (sort === "low") return a.amount - b.amount;
    return b.transactionDate.localeCompare(a.transactionDate);
  }), [data, filter, sort, term]);
  const filters: [DebtFilter, string][] = [["all", "Tất cả"], ["lent", "Tôi cho vay"], ["borrowed", "Tôi đi vay"], ["open", "Chưa thanh toán"], ["partial", "Đang thanh toán"], ["paid", "Đã thanh toán"], ["overdue", "Quá hạn"]];
  return <div className="page-stack">
    <div className="page-title-row"><div><span className="eyebrow">SỔ CÔNG NỢ</span><h1>Khoản nợ</h1><p>Theo dõi từng khoản vay và các lần thanh toán.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Thêm khoản nợ</button></div>
    <div className="surface table-surface">
      <div className="table-toolbar"><div className="search-box"><Search size={17} /><input value={query || localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder="Tìm tên, số điện thoại hoặc mã..." /><kbd>⌘ K</kbd></div><label className="sort-select"><ArrowUpDown size={15} /><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="high">Số tiền cao nhất</option><option value="low">Số tiền thấp nhất</option></select></label></div>
      <div className="filter-tabs">{filters.map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}{value === "all" && <span>{data.debts.length}</span>}</button>)}</div>
      {filtered.length === 0 ? <EmptyState icon={<SlidersHorizontal />} title={data.debts.length ? "Không tìm thấy khoản nợ" : "Chưa có khoản nợ nào"} description={data.debts.length ? "Thử thay đổi từ khóa hoặc bộ lọc." : "Thêm khoản giao dịch đầu tiên để bắt đầu ghi sổ."} action={!data.debts.length ? <button className="button button-secondary" onClick={onAdd}>Thêm khoản nợ</button> : undefined} /> :
      <div className="table-scroll"><table className="data-table"><thead><tr><th>NGƯỜI GIAO DỊCH</th><th>LOẠI</th><th>SỐ TIỀN BAN ĐẦU</th><th>ĐÃ THANH TOÁN</th><th>CÒN LẠI</th><th>ĐẾN HẠN</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>{filtered.map((debt) => {
        const status = debtStatus(debt, data.payments); const paid = debtPaid(debt, data.payments);
        return <tr key={debt.id} onClick={() => onShow(debt)} className="click-row"><td><div className="table-person"><span className={"person-avatar " + debt.type}>{contactName(data, debt.contactId).slice(0, 1)}</span><span><b>{contactName(data, debt.contactId)}</b><small>{debt.code}</small></span></div></td><td><span className={"type-label " + debt.type}>{debt.type === "lent" ? "↑ Cho vay" : "↓ Đi vay"}</span></td><td className="numeric">{money(debt.amount)}</td><td className="numeric muted-cell">{money(paid)}</td><td className="numeric"><b>{money(debtRemaining(debt, data.payments))}</b></td><td className={status === "overdue" ? "overdue-cell" : "muted-cell"}>{dateLabel(debt.dueDate)}</td><td><StatusPill status={status} /></td><td><button className="row-action" aria-label="Xem chi tiết" onClick={(event) => { event.stopPropagation(); onShow(debt); }}><Eye size={16} /></button></td></tr>;
      })}</tbody></table></div>}
      <div className="table-footer"><span>Hiển thị {filtered.length} / {data.debts.length} khoản</span><button className="text-link" onClick={() => { setFilter("all"); setSort("newest"); setLocalSearch(""); }}>Đặt lại bộ lọc</button></div>
    </div>
  </div>;
}


