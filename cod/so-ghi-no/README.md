# Sổ Ghi Nợ

Ứng dụng web tiếng Việt để quản lý công nợ cá nhân. Giao diện dùng React, TypeScript, Tailwind CSS, Lucide React và Recharts. Bản hiện tại chạy độc lập với dữ liệu lưu trong localStorage.

## Chạy ứng dụng

Yêu cầu Node.js 20.19+.

    cd so-ghi-no
    npm install
    npm run dev

Mở địa chỉ Vite in ra trong terminal. Tạo production build bằng:

    npm run build
    npm run preview

## Đăng nhập dùng thử

Chọn **Dùng thử với dữ liệu mẫu** ở trang đăng nhập hoặc đăng nhập với:

- Email: demo@so-ghino.vn
- Mật khẩu: demo1234

Dữ liệu demo gồm nhiều người giao dịch, khoản cho vay/đi vay, khoản đã trả một phần, đã tất toán và quá hạn. Có thể nạp lại từ **Cài đặt → Nạp lại dữ liệu mẫu**.

Tài khoản mới bắt đầu với sổ trống. Mật khẩu trong chế độ local được lưu dưới dạng PBKDF2 hash có salt; dữ liệu sổ vẫn nằm trong localStorage của trình duyệt và không được mã hóa.

## Chức năng

- Tổng quan số tiền còn phải thu, phải trả, đã thu hồi, đã thanh toán, số người có giao dịch và khoản sắp đến hạn.
- Biểu đồ công nợ theo tháng, tiền thu/trả theo tháng và tỷ lệ đã thanh toán/còn lại.
- Tạo, sửa, lọc, sắp xếp, tìm kiếm, xem chi tiết, in phiếu và xóa khoản nợ.
- Quản lý người giao dịch, xem lịch sử, chỉnh sửa, xóa hoặc ẩn người có khoản chưa tất toán.
- Ghi nhận thanh toán bằng tiền mặt, chuyển khoản hoặc phương thức khác. Ứng dụng chặn khoản thanh toán vượt số dư.
- Theo dõi khoản sắp đến hạn/quá hạn, ghi nhận lịch sử nhắc và ghi chú. Ứng dụng không tự gửi SMS hoặc email.
- Báo cáo theo ngày và loại khoản nợ, xuất CSV.
- Sao lưu/khôi phục dữ liệu JSON và chỉnh sửa hồ sơ cá nhân.
- Responsive cho màn hình desktop và điện thoại; dữ liệu vẫn còn sau khi tải lại trang.

## Chế độ local và Supabase

Môi trường này chưa có URL/khóa Supabase nên ứng dụng đang dùng localStorage. Lớp dữ liệu được tách qua src/lib/repository.ts để có thể thay bằng repository Supabase. Tệp supabase/schema.sql chuẩn bị các bảng users, contacts, debts, payments, reminders, RLS theo auth.uid() và kiểm tra tổng thanh toán ở database.

Để dùng Supabase thật, cần tạo project, bật Supabase Auth, chạy schema SQL trong SQL Editor, rồi triển khai repository/auth adapter Supabase. Chỉ thêm biến vào .env.local chưa bật kết nối trong bản hiện tại:

    VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
    VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

Không đưa service_role key vào trình duyệt. Chế độ local hữu ích cho demo trên một thiết bị, không phải ranh giới bảo mật cho môi trường production hoặc dữ liệu tài chính thật.

