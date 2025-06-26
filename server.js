const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize SQLite Database
const db = new sqlite3.Database('chatbot.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Chat history table
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // User progress table
  db.run(`CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    quiz_score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// AI Integration with Groq (free alternative to OpenAI)
async function getAIResponse(message, subject) {
  try {
    // Using Groq API (you need to get a free API key from https://console.groq.com/)
    // For now, we'll use a simple rule-based system as fallback
    
    const context = `Bạn là một trợ lý học tập thông minh chuyên về môn ${subject}. 
    Hãy trả lời câu hỏi sau một cách chi tiết, dễ hiểu và phù hợp với học sinh Việt Nam:`;
    
    // Simple rule-based responses for demonstration
    const responses = {
      'Toán học': [
        'Toán học là môn học rất thú vị! Hãy cùng tôi khám phá thế giới số học.',
        'Bạn có thể hỏi tôi về phép tính, hình học, đại số hoặc bất kỳ chủ đề toán nào.',
        'Tôi sẽ giúp bạn giải bài tập toán một cách chi tiết và dễ hiểu.'
      ],
      'Văn học': [
        'Văn học Việt Nam rất phong phú! Tôi có thể giúp bạn phân tích tác phẩm, thơ ca.',
        'Hãy hỏi tôi về các tác giả nổi tiếng, tác phẩm văn học hoặc kỹ thuật viết.',
        'Tôi sẽ hướng dẫn bạn cách viết văn hay và hiểu sâu các tác phẩm.'
      ],
      'Lịch sử': [
        'Lịch sử Việt Nam có nhiều giai đoạn hào hùng! Tôi sẽ kể cho bạn nghe.',
        'Bạn muốn tìm hiểu về thời kỳ nào? Cổ đại, trung đại hay hiện đại?',
        'Tôi có thể giúp bạn hiểu rõ các sự kiện lịch sử và ý nghĩa của chúng.'
      ],
      'Khoa học': [
        'Khoa học tự nhiên rất hấp dẫn! Hãy cùng khám phá thế giới xung quanh.',
        'Tôi có thể giải thích về vật lý, hóa học, sinh học một cách dễ hiểu.',
        'Bạn có thắc mắc gì về các hiện tượng tự nhiên không?'
      ],
      'Ngoại ngữ': [
        'Học ngoại ngữ sẽ mở ra nhiều cơ hội! Tôi sẽ hỗ trợ bạn.',
        'Tôi có thể giúp bạn luyện từ vựng, ngữ pháp và giao tiếp.',
        'Hãy practice speaking với tôi bằng tiếng Anh nhé!'
      ]
    };

    // Simple keyword matching for demonstration
    let response = responses[subject] ? 
      responses[subject][Math.floor(Math.random() * responses[subject].length)] :
      'Tôi sẽ cố gắng giúp bạn trả lời câu hỏi này!';

    // Add some intelligence based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bài tập') || lowerMessage.includes('giải')) {
      response = `Tôi sẽ hướng dẫn bạn giải bài tập ${subject} này từng bước một. ` + response;
    } else if (lowerMessage.includes('là gì') || lowerMessage.includes('định nghĩa')) {
      response = `Để giải thích khái niệm này trong ${subject}, ` + response;
    } else if (lowerMessage.includes('ví dụ')) {
      response = `Đây là một số ví dụ về ${subject}: ` + response;
    }

    return response;
    
  } catch (error) {
    console.error('AI API Error:', error);
    return 'Xin lỗi, tôi đang gặp một chút trục trặc. Bạn có thể thử lại sau được không?';
  }
}

// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
          }
          return res.status(500).json({ error: 'Lỗi server' });
        }

        const token = jwt.sign(
          { userId: this.lastID, username: username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Đăng ký thành công',
          token: token,
          user: { id: this.lastID, username: username, email: email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng điền tên đăng nhập và mật khẩu' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Tên đăng nhập không tồn tại' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Mật khẩu không đúng' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Đăng nhập thành công',
        token: token,
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role || 'user'
        }
      });
    }
  );
});

// AI Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { message, subject } = req.body;
  const userId = req.user.userId;

  if (!message || !subject) {
    return res.status(400).json({ error: 'Thiếu thông tin tin nhắn hoặc môn học' });
  }

  try {
    // Get AI response
    const aiResponse = await getAIResponse(message, subject);

    // Save to database
    db.run(
      'INSERT INTO chat_history (user_id, subject, message, response) VALUES (?, ?, ?, ?)',
      [userId, subject, message, aiResponse],
      function(err) {
        if (err) {
          console.error('Database error:', err);
        }
      }
    );

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Lỗi xử lý tin nhắn' });
  }
});

// Get chat history
app.get('/api/chat-history/:subject', authenticateToken, (req, res) => {
  const { subject } = req.params;
  const userId = req.user.userId;

  db.all(
    'SELECT message, response, created_at FROM chat_history WHERE user_id = ? AND subject = ? ORDER BY created_at ASC LIMIT 50',
    [userId, subject],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }
      res.json(rows);
    }
  );
});

// Get user progress
app.get('/api/progress', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT subject, quiz_score, total_questions, last_activity FROM user_progress WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }
      res.json(rows);
    }
  );
});

// Update quiz progress
app.post('/api/quiz-progress', authenticateToken, (req, res) => {
  const { subject, score, totalQuestions } = req.body;
  const userId = req.user.userId;

  db.run(
    `INSERT OR REPLACE INTO user_progress (user_id, subject, quiz_score, total_questions, last_activity) 
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, subject, score, totalQuestions],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }
      res.json({ message: 'Cập nhật tiến độ thành công' });
    }
  );
});

// Middleware kiểm tra Admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Kiểm tra role trong JWT token
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Admin Routes
app.get('/api/admin/check', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access confirmed', user: req.user });
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Sử dụng Promise để xử lý multiple queries
  Promise.all([
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as totalUsers FROM users', (err, result) => {
        if (err) reject(err);
        else resolve(result.totalUsers);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as todayMessages FROM chat_history WHERE DATE(created_at) = ?', [today], (err, result) => {
        if (err) reject(err);
        else resolve(result.todayMessages);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(DISTINCT user_id) as activeUsers FROM chat_history WHERE DATE(created_at) = ?', [today], (err, result) => {
        if (err) reject(err);
        else resolve(result.activeUsers);
      });
    })
  ])
  .then(([totalUsers, todayMessages, activeUsers]) => {
    res.json({
      totalUsers,
      todayMessages,
      activeUsers
    });
  })
  .catch(err => {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.post('/api/admin/users/:id/promote', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  
  db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User promoted to admin successfully' });
  });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Không cho phép xóa chính mình
  if (userId == req.user.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  // Xóa tất cả dữ liệu liên quan
  db.serialize(() => {
    db.run('DELETE FROM chat_history WHERE user_id = ?', [userId]);
    db.run('DELETE FROM user_progress WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Token valid', 
    user: {
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role || 'user'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Trợ lý học tập thông minh đã sẵn sàng!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt server...');
  db.close((err) => {
    if (err) {
      console.error('Lỗi khi đóng database:', err.message);
    } else {
      console.log('📦 Database đã được đóng.');
    }
    process.exit(0);
  });
}); 