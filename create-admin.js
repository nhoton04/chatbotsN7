const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Kết nối database
const db = new sqlite3.Database('chatbot.db');

async function createAdmin() {
    console.log('🔧 Đang tạo tài khoản Admin...');
    
    // Thêm cột role vào users table nếu chưa có
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Lỗi thêm cột role:', err.message);
        } else {
            console.log('✅ Đã thêm cột role vào database');
        }
    });

    // Thông tin Admin mặc định
    const adminData = {
        username: 'admin',
        email: 'admin@studybot.com',
        password: 'Admin123!', // Mật khẩu mạnh
        role: 'admin'
    };

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        
        // Kiểm tra xem admin đã tồn tại chưa
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
            [adminData.username, adminData.email], 
            (err, existingUser) => {
                if (err) {
                    console.error('❌ Lỗi kiểm tra user:', err.message);
                    db.close();
                    return;
                }

                if (existingUser) {
                    console.log('⚠️  Tài khoản admin đã tồn tại, đang cập nhật...');
                    
                    // Cập nhật thông tin admin hiện có
                    db.run(
                        `UPDATE users SET password = ?, role = ? WHERE username = ? OR email = ?`,
                        [hashedPassword, adminData.role, adminData.username, adminData.email],
                        function(err) {
                            if (err) {
                                console.error('❌ Lỗi cập nhật Admin:', err.message);
                            } else {
                                console.log('✅ Tài khoản Admin đã được cập nhật!');
                                printAdminInfo(adminData);
                            }
                            db.close();
                        }
                    );
                } else {
                    // Tạo tài khoản Admin mới
                    db.run(
                        `INSERT INTO users (username, email, password, role) 
                         VALUES (?, ?, ?, ?)`,
                        [adminData.username, adminData.email, hashedPassword, adminData.role],
                        function(err) {
                            if (err) {
                                console.error('❌ Lỗi tạo Admin:', err.message);
                            } else {
                                console.log('✅ Tài khoản Admin đã được tạo thành công!');
                                printAdminInfo(adminData);
                            }
                            db.close();
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('❌ Lỗi hash password:', error);
        db.close();
    }
}

function printAdminInfo(adminData) {
    console.log('\n' + '='.repeat(50));
    console.log('🔑 THÔNG TIN ĐĂNG NHẬP ADMIN');
    console.log('='.repeat(50));
    console.log(`👤 Username: ${adminData.username}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log(`👑 Role: ${adminData.role}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('📝 Hướng dẫn sử dụng:');
    console.log('1. Khởi động server: npm start');
    console.log('2. Truy cập: http://localhost:3000');
    console.log('3. Nhấn "Đăng nhập" và sử dụng thông tin trên');
    console.log('');
    console.log('⚠️  LƯU Ý QUAN TRỌNG:');
    console.log('- Hãy đổi mật khẩu sau khi đăng nhập lần đầu!');
    console.log('- Không chia sẻ thông tin này với người khác');
    console.log('- Xóa file này sau khi sử dụng để bảo mật');
    console.log('');
}

// Xử lý lỗi
process.on('unhandledRejection', (err) => {
    console.error('❌ Lỗi không xử lý:', err);
    db.close();
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Đang dừng script...');
    db.close();
    process.exit(0);
});

// Chạy script
console.log('🚀 Script tạo Admin đang khởi động...');
console.log('📂 Database: chatbot.db');
console.log('');

createAdmin(); 