import { useMemo, useState } from "react";
import { ArrowUpRight, Pencil, Plus, RotateCcw, Search, Trash2, UsersRound } from "lucide-react";
import type { AppData, Contact } from "../types";
import { dateLabel, debtRemaining, money } from "../lib/format";
import { EmptyState } from "../components/Modal";
export function ContactsPage({ data, onAdd, onEdit, onDelete, onShow, onRestore }: { data: AppData; onAdd: () => void; onEdit: (contact: Contact) => void; onDelete: (contact: Contact) => void; onShow: (contact: Contact) => void; onRestore: (contact: Contact) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => data.contacts.filter((contact) => !contact.archived && (contact.name.toLowerCase().includes(query.toLowerCase()) || contact.phone.toLowerCase().includes(query.toLowerCase()))), [data.contacts, query]);
  const archived = data.contacts.filter((contact) => contact.archived && (contact.name.toLowerCase().includes(query.toLowerCase()) || contact.phone.toLowerCase().includes(query.toLowerCase())));
  const totals = (contact: Contact) => {
    const debts = data.debts.filter((debt) => debt.contactId === contact.id);
    return { lent: debts.filter((debt) => debt.type === "lent").reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0), borrowed: debts.filter((debt) => debt.type === "borrowed").reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0), count: debts.length, latest: debts.map((debt) => debt.transactionDate).sort().at(-1) };
  };
  return <div className="page-stack">
    <div className="page-title-row"><div><span className="eyebrow">DANH BẠ</span><h1>Người giao dịch</h1><p>Một nơi lưu thông tin và lịch sử công nợ.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Thêm người</button></div>
    <div className="surface table-surface">
      <div className="table-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc số điện thoại..." /></div><span className="count-label"><UsersRound size={15} /> {filtered.length} người</span></div>
      {filtered.length === 0 ? <EmptyState icon={<UsersRound />} title="Chưa có người giao dịch" description="Thêm người mới để lưu thông tin và ghi nhận khoản nợ." action={<button className="button button-secondary" onClick={onAdd}>Thêm người</button>} /> :
      <div className="contact-grid">{filtered.map((contact) => { const summary = totals(contact); return <article className="contact-card" key={contact.id}>
        <div className="contact-card-top"><span className="contact-avatar">{contact.name.split(" ").map((part) => part[0]).slice(-2).join("")}</span><div className="contact-actions"><button className="icon-button subtle" aria-label="Chỉnh sửa" title="Chỉnh sửa" onClick={() => onEdit(contact)}><Pencil size={15} /></button><button className="icon-button subtle contact-delete" aria-label="Xóa" title="Xóa" onClick={() => onDelete(contact)}><Trash2 size={15} /></button></div></div>
        <button className="contact-name-button" onClick={() => onShow(contact)}><h3>{contact.name}</h3><span>{contact.phone || "Chưa có số điện thoại"}</span></button>
        <div className="contact-balances"><div><small>Đang nợ bạn</small><b className="money-green">{money(summary.lent)}</b></div><div><small>Bạn đang nợ</small><b className="money-red">{money(summary.borrowed)}</b></div></div>
        <div className="contact-card-foot"><span>{summary.count} khoản giao dịch</span><span>{summary.latest ? dateLabel(summary.latest) : "Chưa giao dịch"}</span></div>
        <button className="contact-open" onClick={() => onShow(contact)}>Xem lịch sử <ArrowUpRight size={15} /></button>
      </article>; })}</div>}
      {archived.length > 0 && <section className="archived-contacts"><div className="section-heading"><div><h2>Người đã ẩn</h2><p>Lịch sử công nợ vẫn được giữ lại.</p></div></div>{archived.map((contact) => <div className="archived-contact-row" key={contact.id}><span className="contact-avatar">{contact.name.split(" ").map((part) => part[0]).slice(-2).join("")}</span><div><b>{contact.name}</b><small>{contact.phone || "Chưa có số điện thoại"}</small></div><button className="button button-quiet" onClick={() => onRestore(contact)}><RotateCcw size={14} /> Khôi phục</button></div>)}</section>}
    </div>
  </div>;
}
