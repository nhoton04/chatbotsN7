let currentSubject = "";
let chatHistory = {}; // Lưu lịch sử từng môn
let isTyping = false; // Để kiểm soát typing animation

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    
    // Load chat history for authenticated users when choosing a subject
    if (isAuthenticated() && currentSubject) {
        loadAndDisplayChatHistory(currentSubject);
    }
});

// Dark Mode Toggle Function
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    body.classList.toggle('dark');
    
    // Đổi icon
    if (body.classList.contains('dark')) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// Typing Animation Function
function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'flex';
    isTyping = true;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
    isTyping = false;
}

function typeMessage(element, text, speed = 50) {
    element.innerHTML = '';
    let i = 0;
    
    function typeChar() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeChar, speed);
        }
    }
    
    typeChar();
}

// Hàm mới để cuộn lên đầu trang và có thể mở chatbox (nếu cần)
function scrollToTopAndShowSubjects() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Cuộn mượt mà
    });
}

async function chooseSubject(subject) {
    const chatBox = document.getElementById("chatBox");
    const chat = document.getElementById("chatContent");
    const chatHeader = document.querySelector(".chat-header");

    // Check if user needs to login for AI features
    if (!isAuthenticated()) {
        showToast('Vui lòng đăng nhập để trải nghiệm đầy đủ tính năng AI', 'info');
    }

    // Nếu cùng một môn học và chatbox đang ẩn → hiện lại mà không reset
    if (currentSubject === subject) {
        if (chatBox.style.display === "none") {
            chatBox.style.display = "flex";
            setTimeout(() => {
                chatBox.classList.add("active");
            }, 10);
        }
        return;
    }

    currentSubject = subject;
    chatHeader.innerHTML = `💬 Trợ lý môn ${subject}<span class="close-btn" onclick="closeChatBox()">✖</span>`;

    if (chatBox.style.display !== "flex") {
        chatBox.style.display = "flex";
        setTimeout(() => {
            chatBox.classList.add("active");
        }, 10);
    } else {
        // Đảm bảo animation chạy lại khi chuyển môn mà chatbox đang mở
        chatBox.classList.remove("active");
        setTimeout(() => {
            chatBox.classList.add("active");
        }, 10);
    }

    chat.innerHTML = ""; // Xóa nội dung chat cũ
    
    // Show typing indicator và sau đó hiển thị message với typing effect
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        const welcomeMsg = isAuthenticated() ? 
            `📚 Bạn đã chọn môn: ${subject}. AI trợ lý đã sẵn sàng hỗ trợ bạn!` :
            `📚 Bạn đã chọn môn: ${subject}. Đăng nhập để sử dụng AI trợ lý thông minh!`;
        appendBotMessageWithTyping(welcomeMsg);
        
        // Hiển thị suggestions sau khi typing xong
        setTimeout(() => {
            showSuggestions(subject);
        }, 1000);
    }, 1500);

    // Load lịch sử cho authenticated users
    if (isAuthenticated()) {
        loadAndDisplayChatHistory(subject);
    }
}

// Load and display chat history for authenticated users
async function loadAndDisplayChatHistory(subject) {
    try {
        const history = await loadChatHistory(subject);
        if (history && history.length > 0) {
            const chat = document.getElementById("chatContent");
            
            // Wait a bit for the welcome message to display first
            setTimeout(() => {
                history.forEach(({ message, response }) => {
                    appendUserMessage(message);
                    appendBotMessage(response);
                });
                chat.scrollTop = chat.scrollHeight;
            }, 2500);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

function showSuggestions(subject) {
    const chat = document.getElementById("chatContent");
    
    // Lấy 2-3 gợi ý ngẫu nhiên
    const allSuggestions = suggestionList[subject] || [];
    const shuffledSuggestions = allSuggestions.sort(() => 0.5 - Math.random());
    const suggestionsToShow = shuffledSuggestions.slice(0, 3);

    const chatOptionsDiv = document.createElement("div");
    chatOptionsDiv.className = "chat-options";
    chatOptionsDiv.style.opacity = "0";
    chatOptionsDiv.style.transform = "translateY(20px)";

    suggestionsToShow.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.style.opacity = "0";
        btn.style.transform = "translateY(20px)";
        btn.onclick = () => {
            document.getElementById("chatInput").value = option;
            sendMessage();
        };
        chatOptionsDiv.appendChild(btn);
        
        // Animate each button
        setTimeout(() => {
            btn.style.transition = "all 0.3s ease";
            btn.style.opacity = "1";
            btn.style.transform = "translateY(0)";
        }, index * 200);
    });

    chat.appendChild(chatOptionsDiv);
    
    // Animate container
    setTimeout(() => {
        chatOptionsDiv.style.transition = "all 0.3s ease";
        chatOptionsDiv.style.opacity = "1";
        chatOptionsDiv.style.transform = "translateY(0)";
    }, 100);
    
    chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || isTyping) return;

    appendUserMessage(text);
    saveChat("user", text);
    input.value = "";

    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get AI response
        const reply = await generateBotReply(text);
        hideTypingIndicator();
        
        if (reply) { // Only append if there's a reply (quiz doesn't return one)
            appendBotMessageWithTyping(reply);
            saveChat("bot", reply);
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Send message error:', error);
        appendBotMessageWithTyping("🤖 Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.");
    }
}

function appendUserMessage(text) {
    const chat = document.getElementById("chatContent");
    const messageDiv = document.createElement("div");
    messageDiv.className = "user-message";
    messageDiv.textContent = text;
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateX(50px)";
    
    chat.appendChild(messageDiv);
    
    // Animate message
    setTimeout(() => {
        messageDiv.style.transition = "all 0.3s ease";
        messageDiv.style.opacity = "1";
        messageDiv.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessage(text) {
    const chat = document.getElementById("chatContent");
    const messageDiv = document.createElement("div");
    messageDiv.className = "bot-message";
    messageDiv.textContent = text;
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateX(-50px)";
    
    chat.appendChild(messageDiv);
    
    // Animate message
    setTimeout(() => {
        messageDiv.style.transition = "all 0.3s ease";
        messageDiv.style.opacity = "1";
        messageDiv.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessageWithTyping(text) {
    const chat = document.getElementById("chatContent");
    const messageDiv = document.createElement("div");
    messageDiv.className = "bot-message";
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateX(-50px)";
    
    chat.appendChild(messageDiv);
    
    // Animate message appearance
    setTimeout(() => {
        messageDiv.style.transition = "all 0.3s ease";
        messageDiv.style.opacity = "1";
        messageDiv.style.transform = "translateX(0)";
        
        // Start typing animation after message appears
        setTimeout(() => {
            typeMessage(messageDiv, text);
        }, 300);
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function saveChat(role, text) {
    if (!chatHistory[currentSubject]) {
        chatHistory[currentSubject] = [];
    }
    chatHistory[currentSubject].push({ role, text });
}

// Update generateBotReply function to use AI
async function generateBotReply(text) {
    if (!currentSubject) return "🤖 Vui lòng chọn môn học trước nhé.";

    // Check for quiz keywords
    if (text.toLowerCase().includes("quiz") || text.toLowerCase().includes("kiểm tra") || text.toLowerCase().includes("thi")) {
        startQuiz(currentSubject);
        return ""; // Don't return anything as startQuiz handles the response
    }

    // If user is not authenticated, use basic responses
    if (!isAuthenticated()) {
        showToast('Vui lòng đăng nhập để sử dụng AI trợ lý', 'info');
        const repo = replyDatabase[currentSubject];
        for (let key in repo) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return repo[key];
            }
        }
        return `🤖 Mình chưa rõ câu hỏi. Vui lòng đăng nhập để sử dụng AI trợ lý thông minh hơn!`;
    }

    // Use AI for authenticated users
    try {
        const aiResponse = await sendAIMessage(text, currentSubject);
        return aiResponse;
    } catch (error) {
        console.error('AI response error:', error);
        // Fallback to basic responses
        const repo = replyDatabase[currentSubject];
        for (let key in repo) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return repo[key];
            }
        }
        return `🤖 Xin lỗi, AI đang gặp sự cố. Bạn có thể thử lại sau hoặc hỏi một câu khác.`;
    }
}

function closeChatBox() {
    const chatBox = document.getElementById("chatBox");
    chatBox.classList.remove("active");
    setTimeout(() => {
        chatBox.style.display = "none";
    }, 400);
}

function resetChat() {
    const chat = document.getElementById("chatContent");
    chat.innerHTML = "";
    if (currentSubject) chatHistory[currentSubject] = [];
    appendBotMessage(`🧹 Bạn đã làm mới hội thoại môn ${currentSubject}.`);
    
    // Thêm lại gợi ý sau khi reset
    setTimeout(() => {
        showSuggestions(currentSubject);
    }, 500);
}

// Quiz functionality
let currentQuiz = null;
let currentQuestionIndex = 0;
let quizScore = 0;

function startQuiz(subject) {
    const quizData = quizDatabase[subject];
    if (!quizData) {
        appendBotMessage("🤖 Xin lỗi, chưa có quiz cho môn này.");
        return;
    }

    currentQuiz = quizData;
    currentQuestionIndex = 0;
    quizScore = 0;

    appendBotMessage(`🎯 Bắt đầu Quiz ${subject}! Bạn sẽ có ${currentQuiz.length} câu hỏi.`);
    
    setTimeout(() => {
        showQuizQuestion();
    }, 1000);
}

function showQuizQuestion() {
    if (currentQuestionIndex >= currentQuiz.length) {
        showQuizScore();
        return;
    }

    const question = currentQuiz[currentQuestionIndex];
    const chat = document.getElementById("chatContent");

    // Add question
    appendBotMessage(`❓ Câu ${currentQuestionIndex + 1}: ${question.question}`);

    // Add options
    setTimeout(() => {
        const optionsDiv = document.createElement("div");
        optionsDiv.className = "quiz-options";

        question.options.forEach((option, index) => {
            const btn = document.createElement("button");
            btn.className = "quiz-button";
            btn.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + index)}</span>${option}`;
            btn.onclick = () => checkQuizAnswer(index, btn);
            optionsDiv.appendChild(btn);
        });

        chat.appendChild(optionsDiv);
        chat.scrollTop = chat.scrollHeight;
    }, 500);
}

function checkQuizAnswer(selectedIndex, buttonElement) {
    const question = currentQuiz[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    if (isCorrect) {
        quizScore++;
        buttonElement.classList.add("quiz-correct");
        appendBotMessage("✅ Chính xác! Tuyệt vời!");
    } else {
        buttonElement.classList.add("quiz-incorrect");
        const correctAnswer = String.fromCharCode(65 + question.correct);
        appendBotMessage(`❌ Sai rồi! Đáp án đúng là ${correctAnswer}. ${question.explanation || ''}`);
    }

    // Disable all buttons
    const allButtons = document.querySelectorAll('.quiz-button');
    allButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });

    currentQuestionIndex++;
    
    setTimeout(() => {
        if (currentQuestionIndex < currentQuiz.length) {
            showQuizQuestion();
        } else {
            showQuizScore();
        }
    }, 2000);
}

async function showQuizScore() {
    const percentage = Math.round((quizScore / currentQuiz.length) * 100);
    let message = `🎉 Quiz hoàn thành!\n`;
    message += `📊 Kết quả: ${quizScore}/${currentQuiz.length} (${percentage}%)\n`;
    
    if (percentage >= 80) {
        message += `🌟 Xuất sắc! Bạn đã nắm vững kiến thức rồi!`;
    } else if (percentage >= 60) {
        message += `👍 Khá tốt! Hãy ôn tập thêm một chút nữa nhé.`;
    } else {
        message += `📚 Cần cố gắng hơn! Hãy học kỹ lại và thử lại nhé.`;
    }

    appendBotMessage(message);
    
    // Save quiz progress if authenticated
    if (isAuthenticated()) {
        try {
            await saveQuizProgress(currentSubject, quizScore, currentQuiz.length);
        } catch (error) {
            console.error('Error saving quiz progress:', error);
        }
    }

    // Reset quiz
    currentQuiz = null;
    currentQuestionIndex = 0;
    quizScore = 0;
}

// Đóng chat nếu click bên ngoài (trừ nút môn học và nút CTA)
document.addEventListener("click", function (e) {
    const chatBox = document.getElementById("chatBox");
    const isClickInsideChatBox = chatBox.contains(e.target);
    const isClickOnSubjectCard = e.target.closest(".subject-card");
    const isClickOnCTAButton = e.target.closest(".cta-button");

    if (
        chatBox.style.display === "flex" &&
        !isClickInsideChatBox &&
        !isClickOnSubjectCard &&
        !isClickOnCTAButton
    ) {
        closeChatBox();
    }
});

// Gửi tin nhắn khi nhấn Enter
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.activeElement.id === "chatInput") {
        sendMessage();
    }
});

// Dữ liệu gợi ý
const suggestionList = {
    "Toán học": [
        "🧩 Quiz Toán học",
        "Giải phương trình x + 5 = 10",
        "Tổng các số từ 1 đến 100",
        "Diện tích hình tròn",
        "Công thức chu vi hình chữ nhật",
        "Phép chia có dư là gì?",
        "Số nguyên tố là gì?",
        "Tính 7 x 8",
        "Giải hệ phương trình",
        "Hàm số là gì?",
        "Đạo hàm là gì?",
        "Tích phân cơ bản",
        "Giải bất phương trình",
        "Tính góc tam giác đều",
        "Số pi là bao nhiêu?",
        "Định lý Pitago",
        "Xác suất trong tung đồng xu",
        "Thống kê mô tả",
        "Ma trận là gì?",
        "Giải phương trình bậc 2"
    ],
    "Văn học": [
        "🧩 Quiz Văn học",
        "Phân tích Truyện Kiều",
        "Tóm tắt Chí Phèo",
        "Cảm nhận bài Việt Bắc",
        "Phong cách nghệ thuật Nguyễn Du",
        "So sánh thơ xưa và nay",
        "Nghị luận xã hội là gì?",
        "Văn biểu cảm là gì?",
        "Ngữ pháp tiếng Việt có gì đặc biệt?",
        "Cảm xúc trong thơ Hàn Mặc Tử",
        "Ý nghĩa bài thơ Tỏ lòng",
        "Tóm tắt truyện Lão Hạc",
        "Giá trị nhân đạo của Vợ Nhặt",
        "Phong cách thơ Xuân Diệu",
        "Ngôn ngữ trong kịch nói",
        "So sánh Truyện Kiều và Lục Vân Tiên",
        "Hồi ký văn học là gì?",
        "Chức năng của ẩn dụ",
        "Nêu cảm nhận về đoạn thơ em thích",
        "Vì sao cần học văn?"
    ],
    "Lịch sử": [
        "🧩 Quiz Lịch sử",
        "Tóm tắt sự kiện 2/9/1945",
        "Nguyên nhân chiến tranh thế giới 1",
        "Các triều đại phong kiến VN",
        "Phong trào Cần Vương",
        "Ý nghĩa Cách mạng tháng Tám",
        "Kháng chiến chống Pháp",
        "Thời kỳ Bắc thuộc",
        "Những thành tựu thời Lý",
        "Trận Bạch Đằng",
        "Lịch sử Đảng Cộng sản Việt Nam",
        "Vai trò Hồ Chí Minh",
        "Sự kiện 30/4/1975",
        "Chiến tranh lạnh là gì?",
        "Sự hình thành ASEAN",
        "Cải cách ruộng đất",
        "Hiệp định Genève 1954",
        "Chủ nghĩa tư bản là gì?",
        "Xã hội nguyên thủy",
        "Cách mạng công nghiệp lần 1"
    ],
    "Khoa học": [
        "🧩 Quiz Khoa học",
        "Tại sao trời mưa?",
        "Nước sôi ở bao nhiêu độ?",
        "Chu trình carbon",
        "Lực hấp dẫn là gì?",
        "Tế bào động vật và thực vật khác nhau?",
        "Quang hợp là gì?",
        "Động đất xảy ra do đâu?",
        "Cấu trúc nguyên tử",
        "Hiện tượng khúc xạ ánh sáng",
        "Cảm biến nhiệt độ",
        "Pin hoạt động như thế nào?",
        "Phản ứng hoá học là gì?",
        "Hệ Mặt Trời có bao nhiêu hành tinh?",
        "Trái Đất quay quanh Mặt Trời bao lâu?",
        "DNA là gì?",
        "Nhiệt độ âm là gì?",
        "Áp suất khí quyển",
        "Thực phẩm biến đổi gen",
        "Công nghệ AI hoạt động thế nào?"
    ],
    "Ngoại ngữ": [
        "🧩 Quiz Ngoại ngữ",
        "Dịch câu: I love learning",
        "Cách dùng thì hiện tại đơn",
        "Từ vựng chủ đề trường học",
        "Phân biệt much và many",
        "Tính từ trong tiếng Anh",
        "Câu bị động",
        "Mệnh đề quan hệ",
        "Câu điều kiện loại 1",
        "So sánh hơn và nhất",
        "Trật tự tính từ",
        "Từ nối (linking words)",
        "Phát âm âm /th/",
        "Giới từ in, on, at",
        "Cách dùng be going to",
        "Từ vựng về thời tiết",
        "Hỏi đường bằng tiếng Anh",
        "Viết email tiếng Anh",
        "Các thì cơ bản",
        "Từ vựng về gia đình"
    ]
};

// Basic reply database for fallback
const replyDatabase = {
    "Toán học": {
        "phương trình": "🧮 Để giải phương trình, bạn cần cô lập biến số. Ví dụ: x + 5 = 10 → x = 10 - 5 = 5",
        "diện tích": "📐 Diện tích hình tròn = π × r². Diện tích hình chữ nhật = dài × rộng",
        "chu vi": "📏 Chu vi hình tròn = 2 × π × r. Chu vi hình chữ nhật = 2 × (dài + rộng)",
        "số nguyên tố": "🔢 Số nguyên tố là số tự nhiên lớn hơn 1, chỉ chia hết cho 1 và chính nó",
        "pi": "🥧 Số π ≈ 3.14159... là tỉ số giữa chu vi và đường kính của hình tròn"
    },
    "Văn học": {
        "truyện kiều": "📚 Truyện Kiều của Nguyễn Du là tác phẩm văn học kinh điển, kể về số phận đau thương của Thúy Kiều",
        "chí phèo": "📖 Chí Phèo của Nam Cao miêu tả nhân vật nông dân nghèo bị xã hội đày đọa",
        "việt bắc": "🎋 Việt Bắc của Tố Hữu ca ngợi vùng đất kháng chiến thiêng liêng",
        "nguyễn du": "✍️ Nguyễn Du (1765-1820) là đại thi hào, tác giả Truyện Kiều bất hủ"
    },
    "Lịch sử": {
        "2/9/1945": "🇻🇳 Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa",
        "cách mạng tháng tám": "⚡ Cách mạng tháng Tám 1945 giành chính quyền từ tay thực dân Pháp và phát xít Nhật",
        "hồ chí minh": "👨‍💼 Hồ Chí Minh (1890-1969) là lãnh tụ vĩ đại của dân tộc Việt Nam",
        "30/4/1975": "🏆 Ngày 30/4/1975, Sài Gòn giải phóng hoàn toàn, thống nhất đất nước"
    },
    "Khoa học": {
        "mưa": "🌧️ Mưa hình thành khi hơi nước trong không khí ngưng tụ thành giọt nước và rơi xuống",
        "sôi": "🔥 Nước sôi ở 100°C (ở mực nước biển), khi đó áp suất hơi bằng áp suất khí quyển",
        "hấp dẫn": "🌍 Lực hấp dẫn là lực hút giữa các vật có khối lượng, được Newton phát hiện",
        "quang hợp": "🌱 Quang hợp là quá trình thực vật dùng ánh sáng để chuyển CO2 và H2O thành glucose"
    },
    "Ngoại ngữ": {
        "i love learning": "❤️ Tôi yêu việc học tập",
        "hiện tại đơn": "⏰ Thì hiện tại đơn diễn tả thói quen, sự thật hiển nhiên. Công thức: S + V(s/es)",
        "much many": "🔢 Much + danh từ không đếm được, Many + danh từ đếm được số nhiều",
        "bị động": "🔄 Câu bị động: S + be + V3/Ved + (by O). Ví dụ: The book is read by me"
    }
};

// Quiz database
const quizDatabase = {
    "Toán học": [
        {
            question: "Kết quả của 15 + 25 = ?",
            options: ["35", "40", "45", "50"],
            correct: 1,
            explanation: "15 + 25 = 40"
        },
        {
            question: "Diện tích hình vuông có cạnh 5cm là:",
            options: ["20 cm²", "25 cm²", "30 cm²", "10 cm²"],
            correct: 1,
            explanation: "Diện tích = cạnh × cạnh = 5 × 5 = 25 cm²"
        },
        {
            question: "Số nào là số nguyên tố?",
            options: ["4", "6", "7", "8"],
            correct: 2,
            explanation: "7 chỉ chia hết cho 1 và 7"
        }
    ],
    "Văn học": [
        {
            question: "Tác giả của 'Truyện Kiều' là ai?",
            options: ["Nam Cao", "Nguyễn Du", "Tố Hữu", "Xuân Diệu"],
            correct: 1,
            explanation: "Nguyễn Du là tác giả của Truyện Kiều"
        },
        {
            question: "Nhân vật chính trong 'Chí Phèo' là:",
            options: ["Chí Phèo", "Thị Nở", "Chí Dũng", "Cả A và B"],
            correct: 3,
            explanation: "Chí Phèo và Thị Nở đều là nhân vật chính"
        }
    ],
    "Lịch sử": [
        {
            question: "Việt Nam tuyên bố độc lập vào ngày nào?",
            options: ["2/9/1945", "30/4/1975", "19/8/1945", "1/5/1975"],
            correct: 0,
            explanation: "Ngày 2/9/1945 Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập"
        }
    ],
    "Khoa học": [
        {
            question: "Nước sôi ở nhiệt độ bao nhiêu độ C?",
            options: ["90°C", "95°C", "100°C", "105°C"],
            correct: 2,
            explanation: "Nước sôi ở 100°C ở điều kiện bình thường"
        }
    ],
    "Ngoại ngữ": [
        {
            question: "'I love you' có nghĩa là gì?",
            options: ["Tôi thích bạn", "Tôi yêu bạn", "Tôi nhớ bạn", "Tôi cần bạn"],
            correct: 1,
            explanation: "'I love you' có nghĩa là 'Tôi yêu bạn'"
        }
    ]
};

// Thêm hỗ trợ đa thiết bị và file upload
class DeviceOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
        this.init();
    }

    init() {
        this.detectDevice();
        this.addTouchSupport();
        this.restoreConversationState();
        this.addFileUploadSupport();
        this.addKeyboardShortcuts();
        
        // Auto-save conversation state
        setInterval(() => this.saveConversationState(), 30000); // Save every 30s
    }

    detectDevice() {
        // Phát hiện thiết bị và điều chỉnh UI
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            // Tối ưu cho mobile
            this.optimizeForMobile();
        }
        
        if (this.isTouch) {
            document.body.classList.add('touch-device');
        }

        // Phát hiện orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
    }

    optimizeForMobile() {
        // Giảm animation cho mobile để tiết kiệm pin
        if (this.isMobile) {
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
        }

        // Tối ưu chatbox cho mobile
        const chatBox = document.getElementById('chatBox');
        if (chatBox && this.isMobile) {
            chatBox.style.width = '95vw';
            chatBox.style.maxHeight = '80vh';
        }
    }

    addTouchSupport() {
        // Thêm haptic feedback cho mobile (nếu hỗ trợ)
        if ('vibrate' in navigator) {
            document.addEventListener('click', (e) => {
                if (e.target.matches('.subject-card, .chat-input button, .cta-button')) {
                    navigator.vibrate(50); // Rung nhẹ 50ms
                }
            });
        }

        // Swipe gesture cho chat history
        if (this.isTouch) {
            this.addSwipeGestures();
        }
    }

    addSwipeGestures() {
        const chatContent = document.getElementById('chatContent');
        if (!chatContent) return;

        let startX, startY, distX, distY;
        const threshold = 100; // Minimum distance for swipe

        chatContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        chatContent.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            distX = e.changedTouches[0].clientX - startX;
            distY = e.changedTouches[0].clientY - startY;

            // Swipe right to show chat options
            if (Math.abs(distX) > Math.abs(distY) && distX > threshold) {
                this.showChatOptions();
            }
        });
    }

    saveConversationState() {
        try {
            const chatHistory = document.getElementById('chatContent')?.innerHTML || '';
            const currentSubjectElement = document.querySelector('.subject-card.active');
            const currentSubject = currentSubjectElement ? 
                currentSubjectElement.querySelector('span').textContent : '';

            const state = {
                chatHistory,
                currentSubject,
                timestamp: Date.now(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height
                }
            };

            localStorage.setItem('chatbotState', JSON.stringify(state));
            
            // Sync to cloud nếu user đã đăng nhập
            if (this.isUserLoggedIn()) {
                this.syncToCloud(state);
            }
        } catch (error) {
            console.warn('Failed to save conversation state:', error);
        }
    }

    restoreConversationState() {
        try {
            const savedState = localStorage.getItem('chatbotState');
            if (!savedState) return;

            const state = JSON.parse(savedState);
            
            // Kiểm tra xem state có quá cũ không (> 7 ngày)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (Date.now() - state.timestamp > maxAge) {
                localStorage.removeItem('chatbotState');
                return;
            }

            // Restore chat history
            if (state.chatHistory && state.chatHistory.trim()) {
                const chatContent = document.getElementById('chatContent');
                if (chatContent) {
                    chatContent.innerHTML = state.chatHistory;
                    
                    // Show notification about restored session
                    this.showNotification('💾 Phiên chat trước đã được khôi phục', 'info');
                }
            }

            // Restore subject selection
            if (state.currentSubject) {
                window.currentSubject = state.currentSubject;
            }
        } catch (error) {
            console.warn('Failed to restore conversation state:', error);
            localStorage.removeItem('chatbotState');
        }
    }

    addFileUploadSupport() {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput) return;

        // Tạo file input ẩn
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,audio/*,.pdf,.doc,.docx,.txt';
        fileInput.style.display = 'none';
        fileInput.multiple = false;

        // Tạo nút upload
        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.innerHTML = '<i class="fas fa-paperclip"></i>';
        uploadBtn.title = 'Đính kèm file';
        uploadBtn.className = 'upload-btn';
        uploadBtn.style.cssText = `
            background: #f0f4fa;
            border: 1px solid var(--border-light);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            margin-right: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;

        uploadBtn.addEventListener('click', () => fileInput.click());
        uploadBtn.addEventListener('mouseenter', () => {
            uploadBtn.style.background = 'var(--primary-color)';
            uploadBtn.style.color = 'white';
        });
        uploadBtn.addEventListener('mouseleave', () => {
            uploadBtn.style.background = '#f0f4fa';
            uploadBtn.style.color = 'inherit';
        });

        // Xử lý file upload
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Thêm vào chat input
        const inputElement = chatInput.querySelector('input');
        chatInput.insertBefore(uploadBtn, inputElement);
        chatInput.appendChild(fileInput);

        // Drag and drop support
        this.addDragDropSupport();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Kiểm tra kích thước file (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showNotification('❌ File quá lớn. Vui lòng chọn file nhỏ hơn 10MB', 'error');
            return;
        }

        // Hiển thị file trong chat
        this.displayFileInChat(file);
        
        // Xử lý file dựa trên loại
        this.processFile(file);
        
        // Reset input
        event.target.value = '';
    }

    displayFileInChat(file) {
        const chatContent = document.getElementById('chatContent');
        if (!chatContent) return;

        const fileMessage = document.createElement('div');
        fileMessage.className = 'user-message file-message';
        
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        
        fileMessage.innerHTML = `
            <div class="file-preview">
                <i class="${fileIcon}" style="font-size: 24px; margin-right: 10px;"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size" style="font-size: 0.8em; opacity: 0.7;">${fileSize}</div>
                </div>
            </div>
        `;

        chatContent.appendChild(fileMessage);
        chatContent.scrollTop = chatContent.scrollHeight;

        // Nếu là ảnh, hiển thị preview
        if (file.type.startsWith('image/')) {
            this.addImagePreview(fileMessage, file);
        }
    }

    addImagePreview(messageElement, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = `
                max-width: 200px;
                max-height: 200px;
                border-radius: 8px;
                margin-top: 8px;
                cursor: pointer;
            `;
            img.onclick = () => this.openImageModal(e.target.result);
            messageElement.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    openImageModal(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
        `;

        modal.appendChild(img);
        modal.onclick = () => document.body.removeChild(modal);
        document.body.appendChild(modal);
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fas fa-image';
        if (fileType.startsWith('audio/')) return 'fas fa-music';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word')) return 'fas fa-file-word';
        if (fileType.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addDragDropSupport() {
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        chatBox.addEventListener('dragover', () => {
            chatBox.classList.add('drag-over');
        });

        chatBox.addEventListener('dragleave', () => {
            chatBox.classList.remove('drag-over');
        });

        chatBox.addEventListener('drop', (e) => {
            chatBox.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload({target: {files}});
            }
        });
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter để gửi message
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const sendBtn = document.querySelector('.chat-input button[onclick="sendMessage()"]');
                if (sendBtn) sendBtn.click();
            }

            // Escape để đóng chat
            if (e.key === 'Escape') {
                const chatBox = document.getElementById('chatBox');
                if (chatBox && chatBox.style.display !== 'none') {
                    closeChatBox();
                }
            }

            // Ctrl/Cmd + U để upload file
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                const uploadBtn = document.querySelector('.upload-btn');
                if (uploadBtn) uploadBtn.click();
            }
        });
    }

    handleOrientationChange() {
        // Điều chỉnh UI khi xoay màn hình
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;

        if (window.orientation === 90 || window.orientation === -90) {
            // Landscape mode
            chatBox.style.maxHeight = '60vh';
        } else {
            // Portrait mode
            chatBox.style.maxHeight = '80vh';
        }
    }

    processFile(file) {
        // Xử lý file và tạo response từ bot
        setTimeout(() => {
            let botResponse = '';
            
            if (file.type.startsWith('image/')) {
                botResponse = '🖼️ Tôi đã nhận được hình ảnh của bạn. Bạn có muốn tôi phân tích nội dung hoặc giải thích gì về hình này không?';
            } else if (file.type.includes('pdf')) {
                botResponse = '📄 Tôi đã nhận được file PDF. Bạn có muốn tôi tóm tắt nội dung hoặc trả lời câu hỏi về tài liệu này không?';
            } else if (file.type.startsWith('audio/')) {
                botResponse = '🎵 Tôi đã nhận được file audio. Hiện tại tôi chưa thể phân tích âm thanh, nhưng bạn có thể mô tả nội dung để tôi hỗ trợ bạn tốt hơn.';
            } else {
                botResponse = '📎 Tôi đã nhận được file của bạn. Bạn có thể mô tả nội dung để tôi có thể hỗ trợ bạn tốt hơn không?';
            }

            addBotMessage(botResponse);
        }, 1000);
    }

    isUserLoggedIn() {
        // Kiểm tra trạng thái đăng nhập
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    syncToCloud(state) {
        // Placeholder cho sync lên cloud
        // Có thể implement với Firebase, Supabase, hoặc API backend
        console.log('Syncing to cloud...', state);
    }

    showChatOptions() {
        // Hiển thị các tùy chọn chat khi swipe
        const existingOptions = document.querySelector('.swipe-options');
        if (existingOptions) return;

        const options = document.createElement('div');
        options.className = 'swipe-options';
        options.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: var(--bg-card-light);
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1500;
            animation: slideInLeft 0.3s ease;
        `;

        options.innerHTML = `
            <button onclick="this.parentElement.remove(); window.deviceOptimizer.clearChat()">
                <i class="fas fa-trash"></i> Xóa chat
            </button>
            <button onclick="this.parentElement.remove(); window.deviceOptimizer.exportChat()">
                <i class="fas fa-download"></i> Xuất chat
            </button>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i> Đóng
            </button>
        `;

        document.body.appendChild(options);

        // Auto-hide after 5s
        setTimeout(() => {
            if (options.parentElement) {
                options.remove();
            }
        }, 5000);
    }

    clearChat() {
        const chatContent = document.getElementById('chatContent');
        if (chatContent) {
            chatContent.innerHTML = '<div class="bot-message">📌 Hãy chọn một môn học để bắt đầu.</div>';
            localStorage.removeItem('chatbotState');
            this.showNotification('🗑️ Chat đã được xóa', 'info');
        }
    }

    exportChat() {
        const chatContent = document.getElementById('chatContent');
        if (!chatContent) return;

        const chatText = chatContent.innerText;
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('💾 Chat đã được xuất', 'success');
    }

    showNotification(message, type = 'info') {
        // Sử dụng hệ thống toast có sẵn
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Khởi tạo DeviceOptimizer khi trang load
document.addEventListener('DOMContentLoaded', () => {
    window.deviceOptimizer = new DeviceOptimizer();
});

// Thêm CSS cho drag and drop
const style = document.createElement('style');
style.textContent = `
    .drag-over {
        border: 2px dashed var(--primary-color) !important;
        background: rgba(91, 123, 255, 0.05) !important;
    }

    .swipe-options button {
        display: block;
        width: 100%;
        padding: 10px 15px;
        margin: 5px 0;
        border: none;
        background: var(--bg-light);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .swipe-options button:hover {
        background: var(--primary-color);
        color: white;
    }

    @keyframes slideInLeft {
        from { transform: translateY(-50%) translateX(100%); opacity: 0; }
        to { transform: translateY(-50%) translateX(0); opacity: 1; }
    }

    .file-message {
        max-width: 300px;
    }

    .file-preview {
        display: flex;
        align-items: center;
        padding: 10px;
        background: rgba(255,255,255,0.5);
        border-radius: 8px;
        margin: 5px 0;
    }

    @media (max-width: 480px) {
        .upload-btn {
            width: 35px !important;
            height: 35px !important;
            margin-right: 6px !important;
        }
    }
`;
document.head.appendChild(style); 