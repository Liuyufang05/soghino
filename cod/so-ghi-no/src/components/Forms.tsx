import { useState, type FormEvent } from "react";
import type { AppData, Contact, Debt, DebtType, PaymentMethod } from "../types";
import { dateInput, debtRemaining, money } from "../lib/format";

export interface DebtInput { contactId: string; name: string; phone: string; type: DebtType; amount: number; transactionDate: string; dueDate: string; description: string; note: string; }
export function DebtForm({ data, initial, onSave, onCancel }: { data: AppData; initial?: Debt; onSave: (value: DebtInput) => void; onCancel: () => void }) {
  const contact = initial ? data.contacts.find((item) => item.id === initial.contactId) : undefined;
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [type, setType] = useState<DebtType>(initial?.type ?? "lent");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [transactionDate, setTransactionDate] = useState(initial?.transactionDate ?? dateInput());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const selectContact = (id: string) => { setContactId(id); const selected = data.contacts.find((item) => item.id === id); if (selected) { setName(selected.name); setPhone(selected.phone); } };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError("");
    const numericAmount = Number(amount);
    if (!name.trim()) { setError("Vui lòng nhập tên người giao dịch."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError("Số tiền phải lớn hơn 0."); return; }
    if (initial) {
      const paid = initial.amount - debtRemaining(initial, data.payments);
      if (numericAmount < paid) { setError("Số tiền không thể nhỏ hơn tổng số đã thanh toán (" + money(paid) + ")."); return; }
    }
    if (!transactionDate || !dueDate) { setError("Vui lòng chọn ngày giao dịch và ngày đến hạn."); return; }
    if (dueDate < transactionDate) { setError("Ngày đến hạn không thể trước ngày giao dịch."); return; }
    if (!description.trim()) { setError("Vui lòng nhập nội dung khoản nợ."); return; }
    onSave({ contactId, name: name.trim(), phone: phone.trim(), type, amount: numericAmount, transactionDate, dueDate, description: description.trim(), note: note.trim() });
  };
  return <form className="form-grid" onSubmit={submit}>
    <div className="segmented-control"><button type="button" className={type === "lent" ? "selected lent-choice" : ""} onClick={() => setType("lent")}><span>↗</span> Người khác vay tiền của tôi</button><button type="button" className={type === "borrowed" ? "selected borrowed-choice" : ""} onClick={() => setType("borrowed")}><span>↙</span> Tôi vay tiền người khác</button></div>
    {data.contacts.filter((item) => !item.archived).length > 0 && <label className="field full"><span>Chọn người đã có</span><select value={contactId} onChange={(e) => selectContact(e.target.value)}><option value="">Thêm người mới...</option>{data.contacts.filter((item) => !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}{item.phone ? " · " + item.phone : ""}</option>)}</select></label>}
    <label className="field"><span>Họ và tên <i>*</i></span><input required value={name} onChange={(e) => { setName(e.target.value); setContactId(""); }} placeholder="Tên người giao dịch" /></label>
    <label className="field"><span>Số điện thoại</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" /></label>
    <label className="field full"><span>Số tiền (VNĐ) <i>*</i></span><div className="input-suffix"><input required type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /><span>₫</span></div></label>
    <label className="field"><span>Ngày giao dịch <i>*</i></span><input type="date" required value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} /></label>
    <label className="field"><span>Ngày đến hạn <i>*</i></span><input type="date" required value={dueDate} min={transactionDate} onChange={(e) => setDueDate(e.target.value)} /></label>
    <label className="field full"><span>Nội dung <i>*</i></span><input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ví dụ: Vay sửa xe, góp tiền đặt cọc..." /></label>
    <label className="field full"><span>Ghi chú</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thông tin thêm về khoản giao dịch..." /></label>
    {error && <div className="form-error full" role="alert">{error}</div>}
    <div className="form-actions full"><button type="button" className="button button-quiet" onClick={onCancel}>Hủy</button><button className="button button-primary">{initial ? "Lưu thay đổi" : "Lưu khoản nợ"}</button></div>
  </form>;
}

export function ContactForm({ initial, onSave, onCancel }: { initial?: Contact; onSave: (value: { name: string; phone: string; note: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? ""); const [phone, setPhone] = useState(initial?.phone ?? ""); const [note, setNote] = useState(initial?.note ?? ""); const [error, setError] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim().length < 2) { setError("Tên cần có ít nhất 2 ký tự."); return; } onSave({ name: name.trim(), phone: phone.trim(), note: note.trim() }); };
  return <form className="form-grid" onSubmit={submit}>
    <label className="field full"><span>Họ và tên <i>*</i></span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên người giao dịch" /></label>
    <label className="field full"><span>Số điện thoại</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" /></label>
    <label className="field full"><span>Ghi chú</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: bạn bè, đồng nghiệp..." /></label>
    {error && <div className="form-error full">{error}</div>}
    <div className="form-actions full"><button type="button" className="button button-quiet" onClick={onCancel}>Hủy</button><button className="button button-primary">{initial ? "Lưu thông tin" : "Thêm người"}</button></div>
  </form>;
}

export function PaymentForm({ data, defaultDebtId, onSave, onCancel }: { data: AppData; defaultDebtId?: string; onSave: (value: { debtId: string; amount: number; paymentDate: string; method: PaymentMethod; note: string }) => void; onCancel: () => void }) {
  const payable = data.debts.filter((debt) => debtRemaining(debt, data.payments) > 0);
  const [debtId, setDebtId] = useState(defaultDebtId ?? payable[0]?.id ?? "");
  const [amount, setAmount] = useState(""); const [paymentDate, setPaymentDate] = useState(dateInput()); const [method, setMethod] = useState<PaymentMethod>("cash"); const [note, setNote] = useState(""); const [error, setError] = useState("");
  const selected = payable.find((debt) => debt.id === debtId); const remaining = selected ? debtRemaining(selected, data.payments) : 0;
  const submit = (event: FormEvent) => { event.preventDefault(); const value = Number(amount); if (!selected) { setError("Vui lòng chọn khoản nợ còn số dư."); return; } if (!Number.isFinite(value) || value <= 0) { setError("Số tiền thanh toán phải lớn hơn 0."); return; } if (value > remaining) { setError("Số tiền vượt quá số dư còn lại (" + money(remaining) + ")."); return; } if (!paymentDate) { setError("Vui lòng chọn ngày thanh toán."); return; } onSave({ debtId, amount: value, paymentDate, method, note: note.trim() }); };
  return <form className="form-grid" onSubmit={submit}>
    {payable.length === 0 ? <div className="form-error full">Không còn khoản nợ nào cần thanh toán.</div> : <>
      <label className="field full"><span>Khoản nợ</span><select value={debtId} onChange={(e) => { setDebtId(e.target.value); setAmount(""); }}>{payable.map((debt) => { const person = data.contacts.find((contact) => contact.id === debt.contactId)?.name ?? "Người đã xóa"; return <option key={debt.id} value={debt.id}>{debt.code} · {person} · còn {money(debtRemaining(debt, data.payments))}</option>; })}</select></label>
      {selected && <div className="balance-hint full"><span>Số tiền còn lại</span><b>{money(remaining)}</b></div>}
      <label className="field full"><span>Số tiền thanh toán (VNĐ) <i>*</i></span><div className="input-suffix"><input required type="number" min="1" max={remaining} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /><span>₫</span></div></label>
      <label className="field"><span>Ngày thanh toán</span><input required type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></label>
      <label className="field"><span>Phương thức</span><select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}><option value="cash">Tiền mặt</option><option value="transfer">Chuyển khoản</option><option value="other">Khác</option></select></label>
      <label className="field full"><span>Ghi chú</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú thanh toán..." /></label>
    </>}
    {error && <div className="form-error full">{error}</div>}
    <div className="form-actions full"><button type="button" className="button button-quiet" onClick={onCancel}>Đóng</button><button className="button button-primary" disabled={!payable.length}>Ghi nhận thanh toán</button></div>
  </form>;
}

export function ReminderForm({ onSave, onCancel }: { onSave: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState(""); return <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(note.trim()); }}>
    <p className="form-intro full">Lưu lại nội dung đã trao đổi. Ứng dụng không tự gửi SMS hoặc email.</p>
    <label className="field full"><span>Ghi chú nhắc nhở</span><textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Đã nhắn tin nhắc lịch thanh toán..." /></label>
    <div className="form-actions full"><button type="button" className="button button-quiet" onClick={onCancel}>Hủy</button><button className="button button-primary">Lưu lần nhắc</button></div>
  </form>;
}


