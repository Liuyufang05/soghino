import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpenText, CircleDollarSign, ShieldCheck, Sparkles } from "lucide-react";
import { authenticate, ensureDemoAccount, registerAccount } from "../lib/storage";
import type { LocalAccount } from "../types";
export function AuthPage({ onAuthenticated }: { onAuthenticated: (account: LocalAccount) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { onAuthenticated(mode === "login" ? await authenticate(email, password) : await registerAccount(name, email, password)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đăng nhập. Vui lòng thử lại."); }
    finally { setBusy(false); }
  };
  const enterDemo = async () => { setBusy(true); setError(""); try { onAuthenticated(await ensureDemoAccount()); } catch { setError("Không thể mở dữ liệu mẫu trong trình duyệt này."); } finally { setBusy(false); } };
  return <main className="auth-screen">
    <section className="auth-story">
      <div className="auth-brand"><span className="brand-mark"><BookOpenText size={23} /><CircleDollarSign size={15} /></span><span>Sổ Ghi Nợ</span></div>
      <div className="auth-hero">
        <span className="eyebrow"><Sparkles size={14} /> Quản lý tài chính thật nhẹ nhàng</span>
        <h1>Rõ ràng từng khoản.<br /><em>An tâm mỗi ngày.</em></h1>
        <p>Ghi lại khoản vay, theo dõi thanh toán và giữ mọi cuộc hẹn tài chính trong tầm tay.</p>
        <div className="auth-feature"><span><ShieldCheck size={17} /></span><div><b>Riêng tư theo thiết kế</b><small>Dữ liệu demo được lưu ngay trên thiết bị của bạn.</small></div></div>
        <div className="auth-illustration"><div className="illustration-card"><div className="illustration-line"><span className="avatar-dot">A</span><div><b>Nguyễn Văn A</b><small>Vay sửa xe · còn lại</small></div><strong>3.000.000 ₫</strong></div><div className="illustration-progress"><span /></div><div className="illustration-foot"><span>Đã thanh toán</span><b>40%</b></div></div><div className="floating-note">✦ Sổ sách gọn gàng</div></div>
      </div>
      <div className="auth-copy">© 2026 Sổ Ghi Nợ · Quản lý riêng tư, rõ ràng.</div>
    </section>
    <section className="auth-form-side">
      <div className="auth-mobile-brand"><span className="brand-mark"><BookOpenText size={21} /><CircleDollarSign size={14} /></span><span>Sổ Ghi Nợ</span></div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">{mode === "login" ? "CHÀO MỪNG BẠN TRỞ LẠI" : "BẮT ĐẦU MIỄN PHÍ"}</span>
        <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
        <p>{mode === "login" ? "Đăng nhập để xem lại sổ công nợ của bạn." : "Tạo sổ riêng để quản lý các khoản giao dịch."}</p>
        {mode === "register" && <label className="field"><span>Họ và tên</span><input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Minh Anh" /></label>}
        <label className="field"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" /></label>
        <label className="field"><span>Mật khẩu</span><input required type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary button-full" disabled={busy}>{busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={17} /></button>
        <div className="auth-switch">{mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"} <button type="button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Đăng ký" : "Đăng nhập"}</button></div>
        {mode === "login" && <><div className="auth-divider"><span>hoặc trải nghiệm trước</span></div><button className="button button-demo button-full" type="button" onClick={enterDemo} disabled={busy}>Dùng thử với dữ liệu mẫu <ArrowRight size={16} /></button><small className="demo-hint">Tài khoản mẫu: demo@so-ghino.vn · Mật khẩu: demo1234</small></>}
        <p className="auth-local-note">Bản xem trước lưu dữ liệu trên trình duyệt này. Kết nối Supabase để dùng xác thực và đồng bộ an toàn.</p>
      </form>
    </section>
  </main>;
}
