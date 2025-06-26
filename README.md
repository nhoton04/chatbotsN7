# 🤖 Trợ lý học tập thông minh với AI

Một ứng dụng chatbot học tập thông minh được tích hợp AI, hệ thống đăng nhập và cơ sở dữ liệu để quản lý người dùng và lưu trữ lịch sử cuộc trò chuyện.

## ✨ Tính năng chính

### 🔐 Hệ thống xác thực
- **Đăng ký tài khoản** với username, email và mật khẩu
- **Đăng nhập** với JWT token authentication
- **Quản lý phiên** với localStorage
- **Bảo mật** với bcrypt hash password

### 🤖 AI trợ lý thông minh
- **Tích hợp AI** cho câu trả lời thông minh
- **Phân loại theo môn học**: Toán, Văn, Lịch sử, Khoa học, Ngoại ngữ
- **Fallback system** với câu trả lời cơ bản khi AI không khả dụng
- **Context-aware** responses dựa trên môn học được chọn

### 📊 Quản lý dữ liệu
- **SQLite database** để lưu trữ người dùng
- **Lịch sử chat** được lưu theo từng môn học
- **Tiến độ quiz** được theo dõi cho mỗi người dùng
- **API endpoints** RESTful cho frontend/backend communication

### 🎮 Tính năng học tập
- **Quiz interactive** cho từng môn học
- **Typing animation** cho trải nghiệm tự nhiên
- **Suggestions** thông minh cho từng môn
- **Dark/Light mode** cho UI tùy chỉnh

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Khởi động server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

### 3. Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:3000`

## 📋 Yêu cầu hệ thống

- **Node.js** >= 14.0.0
- **NPM** >= 6.0.0
- **SQLite3** (được cài tự động)

## 🛠️ Cấu trúc project

```
chatbox_htmlcss1/
├── server.js          # Backend server với Express
├── auth.js            # Frontend authentication logic
├── script.js          # Frontend chatbot logic
├── index.html         # Main HTML file
├── style.css          # CSS styles
├── package.json       # Dependencies và scripts
├── images/            # Hình ảnh môn học
├── chatbot.db         # SQLite database (tự động tạo)
└── README.md          # Documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - Đăng ký tài khoản mới
- `POST /api/login` - Đăng nhập
- `GET /api/verify` - Xác thực token

### Chat & AI
- `POST /api/chat` - Gửi tin nhắn tới AI (requires auth)
- `GET /api/chat-history/:subject` - Lấy lịch sử chat (requires auth)

### User Progress
- `GET /api/progress` - Lấy tiến độ học tập (requires auth)
- `POST /api/quiz-progress` - Cập nhật kết quả quiz (requires auth)

## 🎯 Hướng dẫn sử dụng

### 1. Đăng ký/Đăng nhập
- Click nút **"Đăng ký"** ở góc phải trên
- Điền thông tin: username, email, password (ít nhất 6 ký tự)
- Hoặc đăng nhập nếu đã có tài khoản

### 2. Chọn môn học
- Click vào card môn học bạn muốn học
- Chatbox sẽ mở với AI trợ lý cho môn đó

### 3. Trò chuyện với AI
- **Người dùng đã đăng nhập**: Sử dụng AI thông minh
- **Khách**: Sử dụng câu trả lời cơ bản

### 4. Làm Quiz
- Gõ "quiz" hoặc "kiểm tra" để bắt đầu
- Chọn đáp án A/B/C/D
- Xem kết quả và giải thích

### 5. Lưu tiến độ
- Lịch sử chat được lưu tự động
- Kết quả quiz được theo dõi
- Có thể xem lại khi đăng nhập lần sau

## 🎨 Tùy chỉnh giao diện

### Dark/Light Mode
- Click icon 🌙/☀️ ở góc phải trên
- Chế độ được lưu trong localStorage

### Responsive Design
- Hỗ trợ desktop, tablet và mobile
- UI tự động điều chỉnh theo kích thước màn hình

## 🔒 Bảo mật

### Xác thực
- JWT tokens với expiration time
- Password hashing với bcrypt
- Rate limiting cho API calls

### Dữ liệu
- SQLite với prepared statements (chống SQL injection)
- CORS được cấu hình an toàn
- Input validation và sanitization

## 🚀 Tích hợp AI nâng cao

### Cấu hình AI API
Để sử dụng AI thật (như OpenAI GPT hoặc Groq), cập nhật function `getAIResponse` trong `server.js`:

```javascript
// Ví dụ với OpenAI
async function getAIResponse(message, subject) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là trợ lý học tập cho môn ${subject}...`
                },
                {
                    role: 'user',
                    content: message
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('AI API Error:', error);
        return 'Xin lỗi, AI đang bận. Thử lại sau nhé!';
    }
}
```

### Environment Variables
Tạo file `.env` để lưu API keys:

```env
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
PORT=3000
```

## 🐛 Debug và troubleshooting

### Server không khởi động
```bash
# Kiểm tra port có bị chiếm không
netstat -ano | findstr :3000

# Thay đổi port
set PORT=3001 && npm start
```

### Database issues
```bash
# Xóa database để reset
rm chatbot.db

# Server sẽ tự tạo lại database mới
```

### CORS errors
- Đảm bảo frontend và backend cùng origin
- Hoặc cấu hình CORS trong server.js

## 📈 Roadmap tương lai

- [ ] Tích hợp AI models khác (Gemini, Claude)
- [ ] Thêm voice chat
- [ ] Gamification với điểm số và badges
- [ ] Admin dashboard
- [ ] Mobile app
- [ ] Collaborative learning features

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Liên hệ

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/smart-learning-assistant](https://github.com/yourusername/smart-learning-assistant)

---

Made with ❤️ for Vietnamese students 