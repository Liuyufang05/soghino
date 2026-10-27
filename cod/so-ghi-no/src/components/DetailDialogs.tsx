import { CalendarDays, FileText, HandCoins, Pencil, Printer, Trash2 } from "lucide-react";
import type { AppData, Contact, Debt } from "../types";
import { contactName, dateLabel, debtPaid, debtRemaining, debtStatus, money } from "../lib/format";
import { StatusPill } from "./Modal";
export function DebtDetail({ data, debt, onPay, onEdit, onDelete }: { data: AppData; debt: Debt; onPay: () => void; onEdit: () => void; onDelete: () => void }) {
  const contact = data.contacts.find((item) => item.id === debt.contactId);
  const payments = data.payments.filter((item) => item.debtId === debt.id).sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  const paid = debtPaid(debt, data.payments); const remaining = debtRemaining(debt, data.payments);
  return <div className="debt-detail">
    <div className={"detail-hero " + debt.type}><span className="detail-person-avatar">{contact?.name.slice(0, 1) ?? "?"}</span><div><small>{debt.type === "lent" ? "NGƯỜI KHÁC NỢ BẠN" : "BẠN NỢ NGƯỜI KHÁC"}</small><h3>{contactName(data, debt.contactId)}</h3><span>{contact?.phone || "Chưa có số điện thoại"} · {debt.code}</span></div><StatusPill status={debtStatus(debt, data.payments)} /></div>
    <div className="detail-balance"><div><small>Số tiền ban đầu</small><b>{money(debt.amount)}</b></div><div><small>Đã thanh toán</small><b className="money-green">{money(paid)}</b></div><div><small>Còn lại</small><b className={remaining ? "money-red" : "money-green"}>{money(remaining)}</b></div></div>
    <div className="detail-meta"><div><CalendarDays size={16} /><span>Ngày giao dịch<b>{dateLabel(debt.transactionDate)}</b></span></div><div><CalendarDays size={16} /><span>Ngày đến hạn<b>{dateLabel(debt.dueDate)}</b></span></div><div><FileText size={16} /><span>Nội dung<b>{debt.description}</b></span></div></div>
    {debt.note && <div className="detail-note"><small>GHI CHÚ</small><p>{debt.note}</p></div>}
    <div className="detail-history"><div className="section-heading"><div><h3>Lịch sử thanh toán</h3><p>{payments.length} lần ghi nhận</p></div></div>{payments.length === 0 ? <p className="quiet-empty">Chưa có khoản thanh toán nào.</p> : <div className="payment-timeline">{payments.map((payment) => <div className="timeline-row" key={payment.id}><span className="timeline-dot"><HandCoins size={14} /></span><span><b>{money(payment.amount)}</b><small>{payment.method === "cash" ? "Tiền mặt" : payment.method === "transfer" ? "Chuyển khoản" : "Khác"}{payment.note ? " · " + payment.note : ""}</small></span><time>{dateLabel(payment.paymentDate)}</time></div>)}</div>}</div>
    <div className="detail-actions"><button className="button button-quiet danger-text" onClick={onDelete}><Trash2 size={15} /> Xóa khoản</button><button className="button button-quiet" onClick={() => window.print()}><Printer size={15} /> In phiếu</button><button className="button button-secondary" onClick={onEdit}><Pencil size={15} /> Chỉnh sửa</button>{remaining > 0 && <button className="button button-primary" onClick={onPay}><HandCoins size={16} /> Ghi nhận thanh toán</button>}</div>
  </div>;
}
export function ContactDetail({ data, contact, onShowDebt }: { data: AppData; contact: Contact; onShowDebt: (debt: Debt) => void }) {
  const debts = data.debts.filter((debt) => debt.contactId === contact.id).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  const lent = debts.filter((debt) => debt.type === "lent").reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0);
  const borrowed = debts.filter((debt) => debt.type === "borrowed").reduce((sum, debt) => sum + debtRemaining(debt, data.payments), 0);
  return <div className="contact-detail">
    <div className="contact-detail-hero"><span className="contact-avatar large">{contact.name.split(" ").map((part) => part[0]).slice(-2).join("")}</span><div><h3>{contact.name}</h3><p>{contact.phone || "Chưa có số điện thoại"}</p>{contact.note && <small>{contact.note}</small>}</div></div>
    <div className="detail-balance"><div><small>Đang nợ bạn</small><b className="money-green">{money(lent)}</b></div><div><small>Bạn đang nợ</small><b className="money-red">{money(borrowed)}</b></div><div><small>Số giao dịch</small><b>{debts.length}</b></div></div>
    <div className="detail-history"><div className="section-heading"><div><h3>Lịch sử giao dịch</h3><p>Các khoản vay và thanh toán của {contact.name}</p></div></div>{debts.length === 0 ? <p className="quiet-empty">Người này chưa có khoản giao dịch nào.</p> : <div className="contact-debt-list">{debts.map((debt) => <button key={debt.id} className="contact-debt-row" onClick={() => onShowDebt(debt)}><span className={"activity-symbol " + debt.type}><HandCoins size={17} /></span><span className="activity-main"><b>{debt.description}</b><small>{debt.code} · {dateLabel(debt.transactionDate)} · {debt.type === "lent" ? "Cho vay" : "Đi vay"}</small></span><span className="contact-debt-amount">{money(debtRemaining(debt, data.payments))}<small>còn lại</small></span><StatusPill status={debtStatus(debt, data.payments)} /></button>)}</div>}</div>
  </div>;
}
