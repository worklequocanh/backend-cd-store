<div align="center">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
    <h1 style="color: white; margin: 0; font-size: 2.6rem; font-weight: 800;">⚙️ CD Store - Backend Enterprise API</h1>
    <p style="color: #cbd5e1; font-size: 1.1rem; margin-top: 10px;">Đồ án Môn học Chuyên đề Backend • RESTful API Fullstack Node.js & MongoDB</p>
  </div>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![SePay](https://img.shields.io/badge/SePay-VietQR_Webhook-0052CC?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGRiIgZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTAgMTAgMTAgMCAwIDAtMTAtMTB6Ii8+PC9zdmc+)](https://sepay.vn/)
  [![PDFKit](https://img.shields.io/badge/PDFKit-In-Memory_Buffer-red?style=for-the-badge)](https://pdfkit.org/)
</div>

---

## 🌟 Tổng Quan Dự Án (`Overview`)

**CD Store Backend API** là nền tảng dịch vụ máy chủ hiệu năng cao được xây dựng dựa trên kiến trúc **Node.js (V8 Engine)**, **Express.js** và **MongoDB NoSQL**. Hệ thống không chỉ cung cấp trọn bộ API nghiệp vụ bán lẻ thương mại điện tử thông thường mà còn tích hợp **4 cụm mô-đun chuẩn Enterprise**:
1. **Thanh toán VietQR động qua SePay Webhook/IPN** (xác nhận giao dịch chuyển khoản thời gian thực không cần thao tác tay).
2. **Kiểm toán kho chuyên sâu (Dual-Audit Stock Ledger & Low Stock Alerts)** (ghi nhận dấu vết mọi giao dịch nhúng trong `StockLog Schema`).
3. **Xuất Hóa đơn điện tử PDF tự động (PDFKit In-Memory Buffer) & Email Marketing** (gửi kèm hóa đơn qua Nodemailer và phục hồi giỏ hàng bỏ quên `Abandoned Cart Recovery`).
4. **Engine Thống kê Aggregation Pipeline & Xuất Excel/CSV** (tính toán doanh thu 30 ngày song song trên tầng CSDL).

---

## ✨ Tính Năng Cốt LõI & Enterprise (`Key Capabilities`)

### 🔐 1. Xác thực & Phân quyền Bảo mật (`Security & RBAC`)
- **JSON Web Token (JWT) Dual-Token**: Access Token (`15m`) cho API call và Refresh Token (`7d`) lưu trữ an toàn trong HTTP-only Cookie ngăn chặn tuyệt đối tấn công XSS.
- **Mật khẩu & Mã hóa**: Băm mật khẩu đa vòng bằng `bcryptjs`.
- **Role-Based Access Control (RBAC)**: Phân tách quyền hạn `user` (Khách hàng) và `admin` (Quản trị viên) qua middleware `verifyRole(['admin'])`.
- **CORS Protection**: Thiết lập cấu hình nguồn domain nghiêm ngặt, bảo vệ API trước các truy cập trái phép.

### 💳 2. Cổng Thanh Toán Tự Động SePay VietQR (`Automated Payment Gateway`)
- **Sinh link chuyển khoản VietQR động**: API `POST /api/orders/:id/create-sepay-link` cấu trúc mã đơn theo định dạng `CDS...` và sinh link thanh toán QR chứa chính xác số tiền cùng nội dung chuyển khoản.
- **Webhook / IPN Thời gian thực**: Endpoint `POST /api/orders/sepay/webhook` nhận thông báo từ ngân hàng qua SePay, tự động giải mã chữ ký, đối soát mã đơn `CDS` và chuyển trạng thái đơn sang `completed`/`delivered` tức thì.

### 📦 3. Quản Lý Kho & Nhật Ký Kiểm Toán (`Stock Ledger & Low Stock Alerts`)
- **Schema `StockLog` (Dual-Audit Trail)**: Ghi lại 100% các biến động kho theo 4 loại nghiệp vụ: `import` (nhập mới), `order_deduction` (trừ khi đặt hàng), `cancellation_return` (hoàn kho khi hủy), `manual_adjustment` (kiểm kê).
- **Lưu trữ Snapshot Tồn kho**: Mỗi bản ghi lưu chính xác số dư `previousStock` $\rightarrow$ `newStock` kèm ghi chú lý do và ID Quản trị viên thực hiện.
- **Cảnh báo Tồn kho thấp**: Endpoint `GET /api/admin/inventory/alerts` quét tự động các sản phẩm chạm ngưỡng báo động (`stock <= 10`), cung cấp dữ liệu tức thì cho Modal "Nhập Kho Nhanh".

### 📧 4. Hóa Đơn Điện Tử PDF & Email Marketing (`PDFKit & Nodemailer`)
- **PDFKit In-Memory Buffer**: Hàm `generateInvoicePdfBuffer(order)` vẽ hóa đơn chuyên nghiệp (Logo CD Store, mã đơn, bảng sản phẩm chi tiết, thuế suất) trực tiếp trên RAM Buffer, tốc độ sinh dưới 50ms và không tạo file rác trên ổ cứng.
- **Tự động gửi Email Hóa đơn**: Ngay khi đơn hàng hoàn tất thanh toán, hệ thống tự động đính kèm Buffer PDF vào email gửi đến hòm thư người dùng qua `nodemailer`.
- **Abandoned Cart Recovery**: Quét và phát hiện các giỏ hàng bỏ quên trên 24 giờ (`GET /api/admin/analytics/abandoned-carts`) và gửi email nhắc nhở tự động kèm ưu đãi hấp dẫn (`POST /send-reminder`).

### 📊 5. Aggregation Analytics & Xuất Kế Toán (`Analytics & Export Engine`)
- **MongoDB Aggregation Pipeline**: Các toán tử `$match`, `$group`, và `$sum` xử lý trực tiếp trên Database Engine để tổng hợp doanh thu theo ngày (`AreaChart`), Top 5 sản phẩm bán chạy (`BarChart`) và tỷ lệ trạng thái (`PieChart`) chỉ trong 1 truy vấn duy nhất.
- **Xuất dữ liệu một chạm**: Hỗ trợ xuất danh sách Đơn hàng, Sản phẩm và Khách hàng ra định dạng bảng tính Excel (`.xlsx`) và CSV phục vụ kế toán doanh nghiệp.

### 🔍 6. SEO Động (`Dynamic SEO & Robots.txt`)
- **Sitemap tự động**: Endpoint `GET /sitemap.xml` cào tự động danh sách các danh mục và sản phẩm đang active để sinh cấu trúc XML cho Googlebot.
- **Robots.txt**: Endpoint `GET /robots.txt` điều hướng trình thu thập dữ liệu tìm kiếm.

---

## 🛠️ Kiến Trúc & Công Nghệ (`Tech Stack`)

| Thành phần | Công nghệ / Thư viện | Vai trò nghiệp vụ |
| :--- | :--- | :--- |
| **Runtime Engine** | **Node.js (V8 Engine)** | Xử lý Non-blocking I/O và Event Loop tốc độ cao |
| **Web Framework** | **Express.js v4** | Định tuyến RESTful API, Middleware pipeline |
| **Database & ODM** | **MongoDB Atlas & Mongoose** | Cơ sở dữ liệu NoSQL linh hoạt, Aggregation, Indexing |
| **Payment Gateway** | **SePay Webhook IPN** | Xác nhận chuyển khoản VietQR tự động thời gian thực |
| **PDF Generator** | **PDFKit** | Sinh hóa đơn điện tử trực tiếp trên RAM Buffer |
| **Mail Engine** | **Nodemailer (SMTP Gmail)** | Gửi email thông báo, OTP, hóa đơn và nhắc nhở giỏ hàng |
| **Media Storage** | **Cloudinary & Multer** | Tải lên, tối ưu hóa và lưu trữ hình ảnh sản phẩm |
| **Security & Auth** | **JWT, Bcryptjs, CORS** | Bảo vệ API đa tầng, mã hóa mật khẩu, phân quyền |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (`Quickstart Guide`)

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `v18.x` hoặc `v20.x` LTS.
- **MongoDB**: Tài khoản MongoDB Atlas Cloud hoặc MongoDB Local.

### 2. Cài đặt các gói phụ thuộc
Di chuyển vào thư mục backend và cài đặt:
```bash
cd be
npm install
```

### 3. Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc của `be/` theo mẫu `env.example`:
```env
# Server
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cd-store?retryWrites=true&w=majority

# Security Keys
JWT_SECRET=super_secret_jwt_key_cd_store_2026
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_cd_store_2026

# Cloudinary Storage (Product Images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# SePay Automated VietQR Webhook
SEPAY_API_KEY=your_sepay_api_key
SEPAY_WEBHOOK_TOKEN=your_sepay_webhook_token
SEPAY_BANK_ACCOUNT=123456789
SEPAY_BANK_NAME=MBBank

# Client Origin
FRONTEND_URL=http://localhost:3000
```

### 4. Nạp dữ liệu mẫu tự động (`Demo Data Seeding`)
Hệ thống cung cấp sẵn script nạp dữ liệu sống động cho đồ án môn học mà **không làm xáo trộn 30 sản phẩm gốc**:
```bash
node scripts/seed_demo_data.js
```
*Script sẽ tự động tạo:*
- **8 Khách hàng mẫu** với thông tin địa chỉ Việt Nam chuẩn.
- **28 Đơn hàng trải dài trong 30 ngày qua** (đầy đủ các trạng thái `delivered`, `pending`, `cancelled`) phục vụ biểu đồ doanh thu.
- **24 Bản ghi Lịch sử kho `StockLog`** và tự động điều chỉnh 4 sản phẩm xuống mức `stock <= 10` để test tính năng Low Stock Alert.
- **6 Mã giảm giá (Coupons)**, **20 Đánh giá sản phẩm (Reviews)**, **5 Liên hệ hỗ trợ** và **2 Chiến dịch khuyến mãi**.

### 5. Khởi chạy máy chủ API
Chạy ở chế độ phát triển với `nodemon`:
```bash
npm run dev
```
*Máy chủ sẽ lắng nghe tại `http://localhost:5000` và kết nối thành công tới MongoDB Atlas.*

---

## 📂 Cấu Trúc Thư Mục (`Folder Structure`)

```text
be/
├── scripts/
│   └── seed_demo_data.js     # Script nạp dữ liệu mẫu tự động (Orders, StockLog, Users, Reviews)
├── src/
│   ├── config/               # Cấu hình kết nối MongoDB, Cloudinary, Multer
│   ├── middlewares/          # Custom Middlewares (authMiddleware, errorMiddleware)
│   ├── models/               # Mongoose Schemas (User, Product, Order, StockLog, Coupon, Review...)
│   ├── routes/               # Cụm định tuyến RESTful API (auth, products, orders, admin, seo...)
│   ├── services/
│   │   └── invoice.service.js# Engine vẽ hóa đơn điện tử PDFKit In-Memory Buffer
│   ├── utils/                # Helper utilities (emailTemplates, sendEmail, formatters)
│   └── server.js             # Entry point khởi tạo Express app & lắng nghe port
├── .env.example              # Mẫu cấu hình biến môi trường
├── package.json              # Danh sách thư viện Node.js và scripts
└── README.md                 # Tài liệu hướng dẫn Backend
```

---

## 🔒 Quy Chuẩn Bảo Mật & Kiểm Toán
- **Zero-Trust Input**: Mọi payload từ Client gửi lên đều được xác thực nghiêm ngặt qua Mongoose Schema Validators và Custom Error Interceptors.
- **Transation Safety**: Mọi thao tác trừ kho hoặc thêm kho đều đi kèm việc sinh log kiểm toán trong collection `stocklogs`, đảm bảo minh bạch tuyệt đối khi báo cáo đồ án.
- **Secure Cookies**: Refresh token được cô lập trong Cookie HTTP-Only, ngăn chặn các rủi ro đánh cắp token từ phía trình duyệt.

---
<div align="center">
  <i>Tài liệu Chuyên đề Backend • Đồ án Môn học CD Store E-Commerce</i>
</div>
