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