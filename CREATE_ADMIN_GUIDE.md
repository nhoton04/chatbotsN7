# 🔐 Hướng dẫn tạo tài khoản Admin

## 🚀 Phương pháp 1: Sử dụng Script (Khuyên dùng)

### Bước 1: Chạy script tạo Admin
```bash
node create-admin.js
```

### Bước 2: Kiểm tra kết quả
Nếu thành công, bạn sẽ thấy:
```
🚀 Script tạo Admin đang khởi động...
📂 Database: chatbot.db

🔧 Đang tạo tài khoản Admin...
✅ Đã thêm cột role vào database
✅ Tài khoản Admin đã được tạo thành công!

==================================================
🔑 THÔNG TIN ĐĂNG NHẬP ADMIN
==================================================
👤 Username: admin
📧 Email: admin@studybot.com
🔑 Password: Admin123!
👑 Role: admin
==================================================

📝 Hướng dẫn sử dụng:
1. Khởi động server: npm start
2. Truy cập: http://localhost:3000
3. Nhấn "Đăng nhập" và sử dụng thông tin trên

⚠️  LƯU Ý QUAN TRỌNG:
- Hãy đổi mật khẩu sau khi đăng nhập lần đầu!
- Không chia sẻ thông tin này với người khác
- Xóa file này sau khi sử dụng để bảo mật
```

### Bước 3: Khởi động server
```bash
npm start
```

### Bước 4: Đăng nhập Admin
1. Truy cập: `http://localhost:3000`
2. Nhấn nút **"Đăng nhập"**
3. Sử dụng thông tin:
   - **Username**: `admin`
   - **Password**: `Admin123!`

### Bước 5: Truy cập Admin Panel
Sau khi đăng nhập thành công, bạn sẽ thấy:
- Tên hiển thị: `👑 admin` (có icon vương miện)
- Nút **"Admin Panel"** màu đỏ bên cạnh nút logout

Nhấn **"Admin Panel"** để vào trang quản trị.

---

## 🛠️ Xử lý sự cố

### Lỗi: "Module not found"
```bash
npm install sqlite3 bcryptjs
```

### Lỗi: "Database locked"
```bash
# Dừng server trước khi chạy script
pkill -f "node server.js"
node create-admin.js
npm start
```

### Lỗi: "Admin already exists"
Script sẽ tự động cập nhật thông tin admin hiện có.

### Không thấy nút Admin Panel
1. Đăng xuất: Nhấn nút logout
2. Đăng nhập lại với tài khoản admin
3. Kiểm tra console browser có lỗi không

---

## 🔧 Tùy chỉnh thông tin Admin

Để thay đổi thông tin admin mặc định, sửa trong file `create-admin.js`:

```javascript
const adminData = {
    username: 'admin',           // Đổi username
    email: 'admin@studybot.com', // Đổi email
    password: 'Admin123!',       // Đổi password
    role: 'admin'                // Giữ nguyên role
};
```

Sau đó chạy lại:
```bash
node create-admin.js
```

---

## 🎯 Tính năng Admin Panel

### Thống kê hệ thống:
- 👥 Tổng số người dùng
- 💬 Tin nhắn hôm nay  
- 📈 Người dùng hoạt động

### Quản lý người dùng:
- 📋 Xem danh sách tất cả users
- 👑 Cấp quyền admin cho user khác
- 🗑️ Xóa user (và toàn bộ dữ liệu)
- 📊 Xuất dữ liệu user

### Công cụ quản trị:
- ℹ️ Xem thông tin hệ thống
- 🧹 Dọn dẹp dữ liệu cũ
- 💾 Backup database
- ⚠️ Reset toàn bộ hệ thống

---

## 🔒 Bảo mật

### Sau khi tạo admin:
1. **Đổi mật khẩu ngay lập tức**
2. **Xóa file `create-admin.js`** để tránh rủi ro
3. **Không chia sẻ** thông tin đăng nhập
4. **Backup database** thường xuyên

### Tạo admin khác:
Sử dụng tính năng "Cấp quyền admin" trong Admin Panel thay vì tạo script mới.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console/terminal có lỗi
2. Đảm bảo server đang chạy
3. Kiểm tra database `chatbot.db` có tồn tại
4. Thử xóa localStorage và đăng nhập lại

---

## ✅ Checklist hoàn thành

- [ ] Chạy `node create-admin.js` thành công
- [ ] Thấy thông tin admin được in ra
- [ ] Server khởi động bình thường  
- [ ] Đăng nhập admin thành công
- [ ] Thấy icon 👑 và nút Admin Panel
- [ ] Truy cập Admin Panel được
- [ ] Thấy thống kê và danh sách users
- [ ] Đổi mật khẩu admin
- [ ] Xóa file create-admin.js

🎉 **Chúc mừng! Bạn đã setup Admin Panel thành công!** 