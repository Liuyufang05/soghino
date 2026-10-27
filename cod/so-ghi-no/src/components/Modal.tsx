import { useEffect } from "react";
import { X } from "lucide-react";
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={"modal-panel" + (wide ? " modal-wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Đóng" onClick={onClose}><X size={19} /></button></header>
      <div className="modal-content">{children}</div>
    </section>
  </div>;
}
export function StatusPill({ status }: { status: "open" | "partial" | "paid" | "overdue" }) {
  const labels = { open: "Chưa thanh toán", partial: "Đang thanh toán", paid: "Đã thanh toán", overdue: "Quá hạn" };
  return <span className={"status-pill status-" + status}><i />{labels[status]}</span>;
}
export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

