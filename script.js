<<<<<<< HEAD
let currentSubject = "";
let chatHistory = {}; // Lưu lịch sử từng môn
let isTyping = false; // Để kiểm soát typing animation

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
    // Optional: Bạn có thể tự động mở chatbox ở đây nếu muốn
    // const chatBox = document.getElementById("chatBox");
    // if (chatBox.style.display === "none") {
    //     chatBox.style.display = "flex";
    //     setTimeout(() => {
    //         chatBox.classList.add("active");
    //     }, 10);
    // }
}

function chooseSubject(subject) {
    const chatBox = document.getElementById("chatBox");
    const chat = document.getElementById("chatContent");
    const chatHeader = document.querySelector(".chat-header");

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
        appendBotMessageWithTyping(`📚 Bạn đã chọn môn: ${subject}. Mời bạn hỏi hoặc chọn gợi ý dưới đây:`);
        
        // Hiển thị suggestions sau khi typing xong
        setTimeout(() => {
            showSuggestions(subject);
        }, 1000);
    }, 1500);

    // Load lịch sử nếu có (sau khi hiển thị gợi ý)
    if (chatHistory[subject]) {
        setTimeout(() => {
            chatHistory[subject].forEach(({ role, text }) => {
                if (role === "user") appendUserMessage(text);
                else appendBotMessage(text);
            });
            chat.scrollTop = chat.scrollHeight;
        }, 2500);
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

function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || isTyping) return;

    appendUserMessage(text);
    saveChat("user", text);
    input.value = "";

    // Show typing indicator
    showTypingIndicator();
    
    // Simulate thinking time
    setTimeout(() => {
        hideTypingIndicator();
        const reply = generateBotReply(text);
        appendBotMessageWithTyping(reply);
        saveChat("bot", reply);
    }, Math.random() * 1000 + 1000); // Random delay 1-2 seconds
}

function appendUserMessage(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "user-message";
    msg.textContent = text;
    msg.style.opacity = "0";
    msg.style.transform = "translateX(50px)";
    chat.appendChild(msg);
    
    // Animate message
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessage(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "bot-message";
    msg.innerHTML = text;
    msg.style.opacity = "0";
    msg.style.transform = "translateX(-50px)";
    chat.appendChild(msg);
    
    // Animate message
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessageWithTyping(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "bot-message";
    msg.style.opacity = "0";
    msg.style.transform = "translateX(-50px)";
    chat.appendChild(msg);
    
    // Animate message appearance
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
        
        // Start typing effect after message appears
        setTimeout(() => {
            typeMessage(msg, text, 30);
        }, 300);
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function saveChat(role, text) {
    if (!currentSubject) return;
    if (!chatHistory[currentSubject]) chatHistory[currentSubject] = [];
    chatHistory[currentSubject].push({ role, text });
}

// Dữ liệu quiz cho từng môn học
const quizDatabase = {
    "Toán học": [
        {
            question: "Tổng các góc trong tam giác bằng?",
            options: ["90°", "180°", "270°", "360°"],
            correct: 1,
            explanation: "Tổng ba góc trong một tam giác luôn bằng 180°"
        },
        {
            question: "2 + 2 × 3 = ?",
            options: ["12", "8", "6", "10"],
            correct: 1,
            explanation: "Thứ tự thực hiện: nhân trước, cộng sau. 2 + (2 × 3) = 2 + 6 = 8"
        },
        {
            question: "Căn bậc hai của 64 là?",
            options: ["6", "7", "8", "9"],
            correct: 2,
            explanation: "√64 = 8 vì 8 × 8 = 64"
        }
    ],
    "Văn học": [
        {
            question: "Tác giả của Truyện Kiều là ai?",
            options: ["Nguyễn Trãi", "Nguyễn Du", "Hồ Xuân Hương", "Nguyễn Đình Chiểu"],
            correct: 1,
            explanation: "Nguyễn Du là tác giả của tác phẩm bất hủ Truyện Kiều"
        },
        {
            question: "Chí Phèo là tác phẩm của?",
            options: ["Nam Cao", "Ngô Tất Tố", "Vũ Trọng Phụng", "Thạch Lam"],
            correct: 0,
            explanation: "Chí Phèo là truyện ngắn nổi tiếng của nhà văn Nam Cao"
        }
    ],
    "Lịch sử": [
        {
            question: "Việt Nam tuyên bố độc lập vào ngày nào?",
            options: ["30/4/1975", "2/9/1945", "19/5/1890", "1/1/1945"],
            correct: 1,
            explanation: "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập"
        },
        {
            question: "Trận Bạch Đằng năm 938 do ai chỉ huy?",
            options: ["Lý Thái Tổ", "Trần Hưng Đạo", "Ngô Quyền", "Lê Lợi"],
            correct: 2,
            explanation: "Ngô Quyền đã chỉ huy trận Bạch Đằng năm 938, đánh bại quân Nam Hán"
        }
    ],
    "Khoa học": [
        {
            question: "Công thức hóa học của nước là gì?",
            options: ["H2O", "CO2", "O2", "NaCl"],
            correct: 0,
            explanation: "H2O là công thức hóa học của nước (2 nguyên tử Hydro + 1 nguyên tử Oxy)"
        },
        {
            question: "Quá trình quang hợp tạo ra khí gì?",
            options: ["CO2", "N2", "O2", "H2"],
            correct: 2,
            explanation: "Quang hợp tạo ra khí Oxy (O2) và giải phóng vào không khí"
        }
    ],
    "Ngoại ngữ": [
        {
            question: "Thì hiện tại đơn của 'I' + 'go' là gì?",
            options: ["I goes", "I go", "I going", "I went"],
            correct: 1,
            explanation: "Với chủ ngữ 'I', động từ 'go' không thêm 's'"
        },
        {
            question: "'Much' dùng với danh từ gì?",
            options: ["Đếm được", "Không đếm được", "Cả hai", "Không dùng được"],
            correct: 1,
            explanation: "'Much' dùng với danh từ không đếm được (much water, much time)"
        }
    ]
};

let currentQuiz = null;
let quizScore = 0;
let quizTotal = 0;

function startQuiz(subject) {
    if (!quizDatabase[subject]) {
        appendBotMessageWithTyping("❌ Xin lỗi, chưa có quiz cho môn này!");
        return;
    }
    
    const questions = quizDatabase[subject];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    currentQuiz = randomQuestion;
    
    appendBotMessageWithTyping(`🧩 <strong>Quiz ${subject}</strong><br><br>❓ ${randomQuestion.question}`);
    
    setTimeout(() => {
        showQuizOptions(randomQuestion.options);
    }, 1500);
}

function showQuizOptions(options) {
    const chat = document.getElementById("chatContent");
    const quizOptionsDiv = document.createElement("div");
    quizOptionsDiv.className = "quiz-options";
    quizOptionsDiv.style.opacity = "0";
    quizOptionsDiv.style.transform = "translateY(20px)";
    
    options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.className = "quiz-button";
        btn.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + index)}</span> ${option}`;
        btn.style.opacity = "0";
        btn.style.transform = "translateY(20px)";
        btn.onclick = () => checkQuizAnswer(index, btn);
        quizOptionsDiv.appendChild(btn);
        
        setTimeout(() => {
            btn.style.transition = "all 0.3s ease";
            btn.style.opacity = "1";
            btn.style.transform = "translateY(0)";
        }, index * 200);
    });
    
    chat.appendChild(quizOptionsDiv);
    
    setTimeout(() => {
        quizOptionsDiv.style.transition = "all 0.3s ease";
        quizOptionsDiv.style.opacity = "1";
        quizOptionsDiv.style.transform = "translateY(0)";
    }, 100);
    
    chat.scrollTop = chat.scrollHeight;
}

function checkQuizAnswer(selectedIndex, buttonElement) {
    if (!currentQuiz) return;
    
    const isCorrect = selectedIndex === currentQuiz.correct;
    const allButtons = document.querySelectorAll('.quiz-button');
    
    // Disable all buttons
    allButtons.forEach(btn => btn.onclick = null);
    
    // Show correct/incorrect
    if (isCorrect) {
        buttonElement.classList.add('quiz-correct');
        quizScore++;
        setTimeout(() => {
            appendBotMessageWithTyping(`✅ <strong>Chính xác!</strong><br><br>💡 ${currentQuiz.explanation}`);
        }, 500);
    } else {
        buttonElement.classList.add('quiz-incorrect');
        allButtons[currentQuiz.correct].classList.add('quiz-correct');
        setTimeout(() => {
            appendBotMessageWithTyping(`❌ <strong>Chưa đúng!</strong><br><br>💡 ${currentQuiz.explanation}<br><br>Đáp án đúng là: <strong>${String.fromCharCode(65 + currentQuiz.correct)}</strong>`);
        }, 500);
    }
    
    quizTotal++;
    currentQuiz = null;
    
    // Show next quiz option
    setTimeout(() => {
        showQuizContinueOptions();
    }, 3000);
}

function showQuizContinueOptions() {
    const chat = document.getElementById("chatContent");
    const continueDiv = document.createElement("div");
    continueDiv.className = "quiz-continue";
    continueDiv.innerHTML = `
        <p>📊 Điểm hiện tại: ${quizScore}/${quizTotal}</p>
        <button onclick="startQuiz(currentSubject)" class="quiz-continue-btn">
            🔄 Câu tiếp theo
        </button>
        <button onclick="showQuizScore()" class="quiz-continue-btn">
            📈 Xem điểm tổng kết
        </button>
    `;
    
    chat.appendChild(continueDiv);
    chat.scrollTop = chat.scrollHeight;
}

function showQuizScore() {
    const percentage = Math.round((quizScore / quizTotal) * 100);
    let message = `🎯 <strong>Kết quả Quiz</strong><br><br>`;
    message += `📊 Điểm số: ${quizScore}/${quizTotal} (${percentage}%)<br><br>`;
    
    if (percentage >= 80) {
        message += `🌟 Xuất sắc! Bạn đã nắm vững kiến thức!`;
    } else if (percentage >= 60) {
        message += `👍 Khá tốt! Hãy ôn luyện thêm để đạt kết quả cao hơn!`;
    } else {
        message += `💪 Hãy cố gắng học thêm! Bạn có thể làm tốt hơn!`;
    }
    
    appendBotMessageWithTyping(message);
}

// Update generateBotReply function to include quiz
function generateBotReply(text) {
    if (!currentSubject) return "🤖 Vui lòng chọn môn học trước nhé.";

    // Check for quiz keywords
    if (text.toLowerCase().includes("quiz") || text.toLowerCase().includes("kiểm tra") || text.toLowerCase().includes("thi")) {
        startQuiz(currentSubject);
        return ""; // Don't return anything as startQuiz handles the response
    }

    const repo = replyDatabase[currentSubject];
    for (let key in repo) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            return repo[key];
        }
    }

    return `🤖 Mình chưa rõ câu hỏi. Bạn đang hỏi về môn ${currentSubject}. Hãy thử một trong các gợi ý hoặc gõ "quiz" để làm bài kiểm tra nhé!`;
}

function closeChatBox() {
    const chatBox = document.getElementById("chatBox");
    chatBox.classList.remove("active");
    setTimeout(() => {
        chatBox.style.display = "none";
    }, 400);
    // currentSubject = ""; // Không reset currentSubject để giữ lịch sử khi mở lại
}

function resetChat() {
    const chat = document.getElementById("chatContent");
    chat.innerHTML = "";
    if (currentSubject) chatHistory[currentSubject] = [];
    appendBotMessage(`🧹 Bạn đã làm mới hội thoại môn ${currentSubject}.`);
    // Thêm lại gợi ý sau khi reset
    const allSuggestions = suggestionList[currentSubject] || [];
    const shuffledSuggestions = allSuggestions.sort(() => 0.5 - Math.random());
    const suggestionsToShow = shuffledSuggestions.slice(0, 3);

    const chatOptionsDiv = document.createElement("div");
    chatOptionsDiv.className = "chat-options";

    suggestionsToShow.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.onclick = () => {
            document.getElementById("chatInput").value = option;
            sendMessage();
        };
        chatOptionsDiv.appendChild(btn);
    });

    chat.appendChild(chatOptionsDiv);
}

// Đóng chat nếu click bên ngoài (trừ nút môn học và nút CTA)
document.addEventListener("click", function (e) {
    const chatBox = document.getElementById("chatBox");
    const isClickInsideChatBox = chatBox.contains(e.target);
    const isClickOnSubjectCard = e.target.closest(".subject-card");
    const isClickOnCTAButton = e.target.closest(".cta-button"); // Thêm kiểm tra nút CTA

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

// Thêm nút Reset
setTimeout(() => {
    const inputBox = document.querySelector(".chat-input");
    if (inputBox && !document.getElementById("resetBtn")) {
        const resetBtn = document.createElement("button");
        resetBtn.id = "resetBtn";
        resetBtn.textContent = "Reset";
        resetBtn.onclick = resetChat;
        inputBox.appendChild(resetBtn);
    }
}, 1000); // Đảm bảo phần tử đã load trước khi thêm nút

// Dữ liệu gợi ý và câu trả lời
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
        "Giải phương trình bậc 2",
        "Số học và đại số khác nhau thế nào?"
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
        "Vì sao cần học văn?",
        "Văn nghị luận và biểu cảm khác nhau thế nào?"
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
        "Cách mạng công nghiệp lần 1",
        "Thế giới sau WW2"
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
        "Công nghệ AI hoạt động thế nào?",
        "Tại sao ánh sáng trắng phân tách?"
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
        "Thì quá khứ tiếp diễn",
        "Giới từ chỉ thời gian",
        "Cách phát âm đuôi -s, -ed",
        "Từ vựng chủ đề gia đình",
        "Cách viết email bằng tiếng Anh",
        "Từ vựng tiếng Anh lớp 6",
        "Sự khác nhau giữa say và tell",
        "Cấu trúc prefer to V",
        "Idioms thông dụng"
    ]
};

const replyDatabase = {
    "Toán học": {
        "phương trình": "✏️ Ví dụ: x + 5 = 10 ⇒ x = 5.",
        "tổng": "🔢 Tổng các số từ 1 đến n: n(n+1)/2.",
        "diện tích": "📐 Diện tích hình tròn: S = π × r².",
        "chu vi": "📏 Chu vi hình chữ nhật = 2 × (dài + rộng).",
        "chia có dư": "➗ Là phép chia mà phần dư khác 0.",
        "nguyên tố": "🔢 Là số chỉ chia hết cho 1 và chính nó.",
        "ma trận": "📘 Ma trận là bảng số dùng trong đại số tuyến tính.",
        "xác suất": "🎲 Xác suất tung đồng xu ra mặt ngửa là 0.5.",
        "pi": "π ≈ 3.14159",
        "pitago": "🌟 a² + b² = c² trong tam giác vuông.",
        "đạo hàm": "📉 Biểu thị tốc độ thay đổi của hàm số.",
        "tích phân": "📊 Diện tích dưới đường cong.",
        "góc tam giác đều": "🔺 Mỗi góc = 60°.",
        "bất phương trình": "🚦 Là biểu thức có dấu <, >, ≤, ≥.",
        "hệ phương trình": "🔧 Tập hợp nhiều phương trình giải cùng lúc.",
        "đại số": "📐 Đại số nghiên cứu biểu thức và phương trình.",
        "số học": "➕ Liên quan đến tính toán cơ bản với số.",
        "hàm số": "f(x) là hàm số nếu mỗi x chỉ có một y.",
        "giải bậc 2": "ax² + bx + c = 0 ⇒ Δ = b² - 4ac.",
        "thống kê": "📈 Phân tích dữ liệu thu thập được."
    },
    "Văn học": {
        "truyện kiều": "📚 Kiệt tác của Nguyễn Du nói về bi kịch và tài năng.",
        "chí phèo": "📝 Bi kịch người nông dân dưới chế độ thực dân phong kiến.",
        "việt bắc": "🎤 Tình cảm gắn bó giữa đồng bào và cán bộ kháng chiến.",
        "phong cách": "💡 Phong cách là cách thể hiện riêng biệt của nhà văn.",
        "thơ": "🖋️ Dạng văn học có vần điệu, cảm xúc.",
        "nghị luận": "💬 Trình bày suy nghĩ về vấn đề xã hội.",
        "biểu cảm": "❤️ Trình bày cảm xúc, suy nghĩ chủ quan.",
        "ẩn dụ": "🌿 Dùng hình ảnh khác để nói đến điều muốn nói.",
        "xuân diệu": "💘 Nhà thơ của tình yêu và thời gian.",
        "tỏ lòng": "⚔️ Bài thơ yêu nước của Phạm Ngũ Lão.",
        "vợ nhặt": "🥣 Phản ánh nạn đói 1945 và nhân phẩm con người.",
        "lão hạc": "👴 Lão Hạc bán chó vì thương con, sống nhân hậu.",
        "so sánh": "🔍 Phép tu từ chỉ sự giống nhau giữa hai đối tượng.",
        "hồi ký": "📖 Ghi lại trải nghiệm thật của người viết.",
        "tình cảm": "💓 Chủ đề thường gặp trong văn thơ.",
        "ngôn ngữ": "🗣️ Công cụ chính của văn học.",
        "văn nghị luận": "⚖️ Trình bày lý lẽ, dẫn chứng, phản biện.",
        "ngữ pháp": "🔠 Cấu trúc câu trong tiếng Việt.",
        "cảm xúc": "🎭 Là yếu tố tạo nên hồn văn học.",
        "từ ngữ": "📝 Vốn từ phong phú giúp diễn đạt hay hơn."
    },
    "Lịch sử": {
        "2/9": "🇻🇳 Ngày Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.",
        "chiến tranh thế giới": "🌍 Xảy ra do tranh chấp quyền lực giữa các nước lớn.",
        "triều đại": "👑 Các triều đại Việt: Lý, Trần, Lê, Nguyễn...",
        "cần vương": "🎯 Phong trào chống Pháp kêu gọi trung thành với vua.",
        "30/4": "✊ Giải phóng miền Nam, thống nhất đất nước 1975.",
        "tháng tám": "📅 Cách mạng 1945 lật đổ chính phủ bù nhìn.",
        "pháp thuộc": "🗺️ Việt Nam bị đô hộ gần 100 năm.",
        "bắc thuộc": "🧭 Thời kỳ bị phương Bắc xâm lược và đô hộ.",
        "trận bạch đằng": "⚓ Chiến thắng lớn của Ngô Quyền, Lê Hoàn và Trần Hưng Đạo.",
        "hiệp định genève": "✍️ Chia Việt Nam thành 2 miền tạm thời năm 1954.",
        "chủ nghĩa tư bản": "💼 Hệ thống kinh tế dựa vào sở hữu tư nhân.",
        "liên xô": "🌏 Cường quốc XHCN lớn nhất thế kỷ 20.",
        "hồ chí minh": "👨‍🏫 Người sáng lập nước Việt Nam Dân chủ Cộng hòa.",
        "đảng cộng sản": "⚒️ Tổ chức lãnh đạo cách mạng VN.",
        "ASEAN": "🌐 Hiệp hội các quốc gia Đông Nam Á.",
        "xã hội nguyên thủy": "🪓 Giai đoạn đầu của lịch sử loài người.",
        "công nghiệp": "🏭 Cách mạng tạo bước nhảy vọt công nghệ.",
        "đổi mới": "🔄 Chính sách phát triển đất nước sau 1986.",
        "lịch sử thế giới": "🌎 Bao gồm các nền văn minh lớn: Ai Cập, La Mã, Trung Hoa.",
        "thế giới sau chiến tranh": "🌐 Hình thành 2 cực: Liên Xô và Mỹ."
    },
    "Khoa học": {
        "trời mưa": "🌧️ Do hơi nước ngưng tụ tạo thành mây rồi mưa.",
        "nước sôi": "💧 100°C ở áp suất thường.",
        "carbon": "🔬 Cacbon di chuyển qua sinh vật và khí quyển.",
        "quang hợp": "🌱 Quá trình tạo ra O2 và đường từ CO₂ và ánh sáng.",
        "tế bào": "🔬 Đơn vị cơ bản của sự sống.",
        "lực hấp dẫn": "🌍 Lực hút giữa mọi vật có khối lượng.",
        "động đất": "🌏 Do sự dịch chuyển của các mảng kiến tạo.",
        "khúc xạ": "🌈 Ánh sáng đổi hướng khi đi qua chất khác nhau.",
        "pin": "🔋 Thiết bị chuyển hóa năng lượng hóa học thành điện.",
        "phản ứng hoá học": "🧪 Sự biến đổi chất này thành chất khác.",
        "nguyên tử": "🧬 Cấu tạo bởi proton, neutron, electron.",
        "nhiệt độ âm": "❄️ Dưới 0°C, dùng trong nghiên cứu và bảo quản.",
        "hành tinh": "🪐 Sao quay quanh Mặt Trời (ví dụ: Trái Đất, Sao Hỏa).",
        "DNA": "🧬 Vật liệu di truyền trong sinh vật sống.",
        "áp suất": "🌪️ Lực tác động trên một đơn vị diện tích.",
        "ánh sáng trắng": "🌞 Tập hợp của nhiều màu (cầu vồng).",
        "AI": "🤖 Trí tuệ nhân tạo mô phỏng tư duy con người.",
        "gen biến đổi": "🌽 Sinh vật có ADN bị thay đổi.",
        "sensor nhiệt": "🌡️ Thiết bị đo nhiệt độ.",
        "vật lý": "⚛️ Ngành nghiên cứu các định luật tự nhiên."
    },
    "Ngoại ngữ": {
        "i love learning": "❤️ Dịch: Tôi yêu việc học.",
        "hiện tại đơn": "⌛ S + V(s/es). Ví dụ: She works, they play.",
        "từ vựng": "📘 School, teacher, student, book...",
        "much": "Much dùng cho danh từ không đếm được.",
        "many": "Many dùng cho danh từ đếm được.",
        "tính từ": "Happy, big, red... dùng để mô tả.",
        "bị động": "S + to be + V3/ed.",
        "mệnh đề": "Who, which, that... để nối thông tin.",
        "điều kiện": "If + S + V, S + will/can...",
        "so sánh": "Taller, more beautiful, the most.",
        "tính từ kép": "A beautiful big red car.",
        "liên từ": "However, therefore, because...",
        "quá khứ tiếp diễn": "S + was/were + V-ing.",
        "giới từ": "In, on, at chỉ thời gian và nơi chốn.",
        "đuôi ed": "Phát âm: /id/, /t/, /d/ tùy động từ.",
        "gia đình": "Father, mother, sister...",
        "email": "Dear..., I hope you are well...",
        "say tell": "Say + something, Tell + someone + something.",
        "prefer": "Prefer to V: I prefer to read.",
        "idiom": "Break a leg = Chúc may mắn!"
    }
};

// Load theme when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
=======
let currentSubject = "";
let chatHistory = {}; // Lưu lịch sử từng môn
let isTyping = false; // Để kiểm soát typing animation

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
    // Optional: Bạn có thể tự động mở chatbox ở đây nếu muốn
    // const chatBox = document.getElementById("chatBox");
    // if (chatBox.style.display === "none") {
    //     chatBox.style.display = "flex";
    //     setTimeout(() => {
    //         chatBox.classList.add("active");
    //     }, 10);
    // }
}

function chooseSubject(subject) {
    const chatBox = document.getElementById("chatBox");
    const chat = document.getElementById("chatContent");
    const chatHeader = document.querySelector(".chat-header");

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
        appendBotMessageWithTyping(`📚 Bạn đã chọn môn: ${subject}. Mời bạn hỏi hoặc chọn gợi ý dưới đây:`);
        
        // Hiển thị suggestions sau khi typing xong
        setTimeout(() => {
            showSuggestions(subject);
        }, 1000);
    }, 1500);

    // Load lịch sử nếu có (sau khi hiển thị gợi ý)
    if (chatHistory[subject]) {
        setTimeout(() => {
            chatHistory[subject].forEach(({ role, text }) => {
                if (role === "user") appendUserMessage(text);
                else appendBotMessage(text);
            });
            chat.scrollTop = chat.scrollHeight;
        }, 2500);
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

function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || isTyping) return;

    appendUserMessage(text);
    saveChat("user", text);
    input.value = "";

    // Show typing indicator
    showTypingIndicator();
    
    // Simulate thinking time
    setTimeout(() => {
        hideTypingIndicator();
        const reply = generateBotReply(text);
        appendBotMessageWithTyping(reply);
        saveChat("bot", reply);
    }, Math.random() * 1000 + 1000); // Random delay 1-2 seconds
}

function appendUserMessage(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "user-message";
    msg.textContent = text;
    msg.style.opacity = "0";
    msg.style.transform = "translateX(50px)";
    chat.appendChild(msg);
    
    // Animate message
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessage(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "bot-message";
    msg.innerHTML = text;
    msg.style.opacity = "0";
    msg.style.transform = "translateX(-50px)";
    chat.appendChild(msg);
    
    // Animate message
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function appendBotMessageWithTyping(text) {
    const chat = document.getElementById("chatContent");
    const msg = document.createElement("div");
    msg.className = "bot-message";
    msg.style.opacity = "0";
    msg.style.transform = "translateX(-50px)";
    chat.appendChild(msg);
    
    // Animate message appearance
    setTimeout(() => {
        msg.style.transition = "all 0.3s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateX(0)";
        
        // Start typing effect after message appears
        setTimeout(() => {
            typeMessage(msg, text, 30);
        }, 300);
    }, 10);
    
    chat.scrollTop = chat.scrollHeight;
}

function saveChat(role, text) {
    if (!currentSubject) return;
    if (!chatHistory[currentSubject]) chatHistory[currentSubject] = [];
    chatHistory[currentSubject].push({ role, text });
}

// Dữ liệu quiz cho từng môn học
const quizDatabase = {
    "Toán học": [
        {
            question: "Tổng các góc trong tam giác bằng?",
            options: ["90°", "180°", "270°", "360°"],
            correct: 1,
            explanation: "Tổng ba góc trong một tam giác luôn bằng 180°"
        },
        {
            question: "2 + 2 × 3 = ?",
            options: ["12", "8", "6", "10"],
            correct: 1,
            explanation: "Thứ tự thực hiện: nhân trước, cộng sau. 2 + (2 × 3) = 2 + 6 = 8"
        },
        {
            question: "Căn bậc hai của 64 là?",
            options: ["6", "7", "8", "9"],
            correct: 2,
            explanation: "√64 = 8 vì 8 × 8 = 64"
        }
    ],
    "Văn học": [
        {
            question: "Tác giả của Truyện Kiều là ai?",
            options: ["Nguyễn Trãi", "Nguyễn Du", "Hồ Xuân Hương", "Nguyễn Đình Chiểu"],
            correct: 1,
            explanation: "Nguyễn Du là tác giả của tác phẩm bất hủ Truyện Kiều"
        },
        {
            question: "Chí Phèo là tác phẩm của?",
            options: ["Nam Cao", "Ngô Tất Tố", "Vũ Trọng Phụng", "Thạch Lam"],
            correct: 0,
            explanation: "Chí Phèo là truyện ngắn nổi tiếng của nhà văn Nam Cao"
        }
    ],
    "Lịch sử": [
        {
            question: "Việt Nam tuyên bố độc lập vào ngày nào?",
            options: ["30/4/1975", "2/9/1945", "19/5/1890", "1/1/1945"],
            correct: 1,
            explanation: "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập"
        },
        {
            question: "Trận Bạch Đằng năm 938 do ai chỉ huy?",
            options: ["Lý Thái Tổ", "Trần Hưng Đạo", "Ngô Quyền", "Lê Lợi"],
            correct: 2,
            explanation: "Ngô Quyền đã chỉ huy trận Bạch Đằng năm 938, đánh bại quân Nam Hán"
        }
    ],
    "Khoa học": [
        {
            question: "Công thức hóa học của nước là gì?",
            options: ["H2O", "CO2", "O2", "NaCl"],
            correct: 0,
            explanation: "H2O là công thức hóa học của nước (2 nguyên tử Hydro + 1 nguyên tử Oxy)"
        },
        {
            question: "Quá trình quang hợp tạo ra khí gì?",
            options: ["CO2", "N2", "O2", "H2"],
            correct: 2,
            explanation: "Quang hợp tạo ra khí Oxy (O2) và giải phóng vào không khí"
        }
    ],
    "Ngoại ngữ": [
        {
            question: "Thì hiện tại đơn của 'I' + 'go' là gì?",
            options: ["I goes", "I go", "I going", "I went"],
            correct: 1,
            explanation: "Với chủ ngữ 'I', động từ 'go' không thêm 's'"
        },
        {
            question: "'Much' dùng với danh từ gì?",
            options: ["Đếm được", "Không đếm được", "Cả hai", "Không dùng được"],
            correct: 1,
            explanation: "'Much' dùng với danh từ không đếm được (much water, much time)"
        }
    ]
};

let currentQuiz = null;
let quizScore = 0;
let quizTotal = 0;

function startQuiz(subject) {
    if (!quizDatabase[subject]) {
        appendBotMessageWithTyping("❌ Xin lỗi, chưa có quiz cho môn này!");
        return;
    }
    
    const questions = quizDatabase[subject];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    currentQuiz = randomQuestion;
    
    appendBotMessageWithTyping(`🧩 <strong>Quiz ${subject}</strong><br><br>❓ ${randomQuestion.question}`);
    
    setTimeout(() => {
        showQuizOptions(randomQuestion.options);
    }, 1500);
}

function showQuizOptions(options) {
    const chat = document.getElementById("chatContent");
    const quizOptionsDiv = document.createElement("div");
    quizOptionsDiv.className = "quiz-options";
    quizOptionsDiv.style.opacity = "0";
    quizOptionsDiv.style.transform = "translateY(20px)";
    
    options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.className = "quiz-button";
        btn.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + index)}</span> ${option}`;
        btn.style.opacity = "0";
        btn.style.transform = "translateY(20px)";
        btn.onclick = () => checkQuizAnswer(index, btn);
        quizOptionsDiv.appendChild(btn);
        
        setTimeout(() => {
            btn.style.transition = "all 0.3s ease";
            btn.style.opacity = "1";
            btn.style.transform = "translateY(0)";
        }, index * 200);
    });
    
    chat.appendChild(quizOptionsDiv);
    
    setTimeout(() => {
        quizOptionsDiv.style.transition = "all 0.3s ease";
        quizOptionsDiv.style.opacity = "1";
        quizOptionsDiv.style.transform = "translateY(0)";
    }, 100);
    
    chat.scrollTop = chat.scrollHeight;
}

function checkQuizAnswer(selectedIndex, buttonElement) {
    if (!currentQuiz) return;
    
    const isCorrect = selectedIndex === currentQuiz.correct;
    const allButtons = document.querySelectorAll('.quiz-button');
    
    // Disable all buttons
    allButtons.forEach(btn => btn.onclick = null);
    
    // Show correct/incorrect
    if (isCorrect) {
        buttonElement.classList.add('quiz-correct');
        quizScore++;
        setTimeout(() => {
            appendBotMessageWithTyping(`✅ <strong>Chính xác!</strong><br><br>💡 ${currentQuiz.explanation}`);
        }, 500);
    } else {
        buttonElement.classList.add('quiz-incorrect');
        allButtons[currentQuiz.correct].classList.add('quiz-correct');
        setTimeout(() => {
            appendBotMessageWithTyping(`❌ <strong>Chưa đúng!</strong><br><br>💡 ${currentQuiz.explanation}<br><br>Đáp án đúng là: <strong>${String.fromCharCode(65 + currentQuiz.correct)}</strong>`);
        }, 500);
    }
    
    quizTotal++;
    currentQuiz = null;
    
    // Show next quiz option
    setTimeout(() => {
        showQuizContinueOptions();
    }, 3000);
}

function showQuizContinueOptions() {
    const chat = document.getElementById("chatContent");
    const continueDiv = document.createElement("div");
    continueDiv.className = "quiz-continue";
    continueDiv.innerHTML = `
        <p>📊 Điểm hiện tại: ${quizScore}/${quizTotal}</p>
        <button onclick="startQuiz(currentSubject)" class="quiz-continue-btn">
            🔄 Câu tiếp theo
        </button>
        <button onclick="showQuizScore()" class="quiz-continue-btn">
            📈 Xem điểm tổng kết
        </button>
    `;
    
    chat.appendChild(continueDiv);
    chat.scrollTop = chat.scrollHeight;
}

function showQuizScore() {
    const percentage = Math.round((quizScore / quizTotal) * 100);
    let message = `🎯 <strong>Kết quả Quiz</strong><br><br>`;
    message += `📊 Điểm số: ${quizScore}/${quizTotal} (${percentage}%)<br><br>`;
    
    if (percentage >= 80) {
        message += `🌟 Xuất sắc! Bạn đã nắm vững kiến thức!`;
    } else if (percentage >= 60) {
        message += `👍 Khá tốt! Hãy ôn luyện thêm để đạt kết quả cao hơn!`;
    } else {
        message += `💪 Hãy cố gắng học thêm! Bạn có thể làm tốt hơn!`;
    }
    
    appendBotMessageWithTyping(message);
}

// Update generateBotReply function to include quiz
function generateBotReply(text) {
    if (!currentSubject) return "🤖 Vui lòng chọn môn học trước nhé.";

    // Check for quiz keywords
    if (text.toLowerCase().includes("quiz") || text.toLowerCase().includes("kiểm tra") || text.toLowerCase().includes("thi")) {
        startQuiz(currentSubject);
        return ""; // Don't return anything as startQuiz handles the response
    }

    const repo = replyDatabase[currentSubject];
    for (let key in repo) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            return repo[key];
        }
    }

    return `🤖 Mình chưa rõ câu hỏi. Bạn đang hỏi về môn ${currentSubject}. Hãy thử một trong các gợi ý hoặc gõ "quiz" để làm bài kiểm tra nhé!`;
}

function closeChatBox() {
    const chatBox = document.getElementById("chatBox");
    chatBox.classList.remove("active");
    setTimeout(() => {
        chatBox.style.display = "none";
    }, 400);
    // currentSubject = ""; // Không reset currentSubject để giữ lịch sử khi mở lại
}

function resetChat() {
    const chat = document.getElementById("chatContent");
    chat.innerHTML = "";
    if (currentSubject) chatHistory[currentSubject] = [];
    appendBotMessage(`🧹 Bạn đã làm mới hội thoại môn ${currentSubject}.`);
    // Thêm lại gợi ý sau khi reset
    const allSuggestions = suggestionList[currentSubject] || [];
    const shuffledSuggestions = allSuggestions.sort(() => 0.5 - Math.random());
    const suggestionsToShow = shuffledSuggestions.slice(0, 3);

    const chatOptionsDiv = document.createElement("div");
    chatOptionsDiv.className = "chat-options";

    suggestionsToShow.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.onclick = () => {
            document.getElementById("chatInput").value = option;
            sendMessage();
        };
        chatOptionsDiv.appendChild(btn);
    });

    chat.appendChild(chatOptionsDiv);
}

// Đóng chat nếu click bên ngoài (trừ nút môn học và nút CTA)
document.addEventListener("click", function (e) {
    const chatBox = document.getElementById("chatBox");
    const isClickInsideChatBox = chatBox.contains(e.target);
    const isClickOnSubjectCard = e.target.closest(".subject-card");
    const isClickOnCTAButton = e.target.closest(".cta-button"); // Thêm kiểm tra nút CTA

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

// Thêm nút Reset
setTimeout(() => {
    const inputBox = document.querySelector(".chat-input");
    if (inputBox && !document.getElementById("resetBtn")) {
        const resetBtn = document.createElement("button");
        resetBtn.id = "resetBtn";
        resetBtn.textContent = "Reset";
        resetBtn.onclick = resetChat;
        inputBox.appendChild(resetBtn);
    }
}, 1000); // Đảm bảo phần tử đã load trước khi thêm nút

// Dữ liệu gợi ý và câu trả lời
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
        "Giải phương trình bậc 2",
        "Số học và đại số khác nhau thế nào?"
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
        "Vì sao cần học văn?",
        "Văn nghị luận và biểu cảm khác nhau thế nào?"
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
        "Cách mạng công nghiệp lần 1",
        "Thế giới sau WW2"
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
        "Công nghệ AI hoạt động thế nào?",
        "Tại sao ánh sáng trắng phân tách?"
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
        "Thì quá khứ tiếp diễn",
        "Giới từ chỉ thời gian",
        "Cách phát âm đuôi -s, -ed",
        "Từ vựng chủ đề gia đình",
        "Cách viết email bằng tiếng Anh",
        "Từ vựng tiếng Anh lớp 6",
        "Sự khác nhau giữa say và tell",
        "Cấu trúc prefer to V",
        "Idioms thông dụng"
    ]
};

const replyDatabase = {
    "Toán học": {
        "phương trình": "✏️ Ví dụ: x + 5 = 10 ⇒ x = 5.",
        "tổng": "🔢 Tổng các số từ 1 đến n: n(n+1)/2.",
        "diện tích": "📐 Diện tích hình tròn: S = π × r².",
        "chu vi": "📏 Chu vi hình chữ nhật = 2 × (dài + rộng).",
        "chia có dư": "➗ Là phép chia mà phần dư khác 0.",
        "nguyên tố": "🔢 Là số chỉ chia hết cho 1 và chính nó.",
        "ma trận": "📘 Ma trận là bảng số dùng trong đại số tuyến tính.",
        "xác suất": "🎲 Xác suất tung đồng xu ra mặt ngửa là 0.5.",
        "pi": "π ≈ 3.14159",
        "pitago": "🌟 a² + b² = c² trong tam giác vuông.",
        "đạo hàm": "📉 Biểu thị tốc độ thay đổi của hàm số.",
        "tích phân": "📊 Diện tích dưới đường cong.",
        "góc tam giác đều": "🔺 Mỗi góc = 60°.",
        "bất phương trình": "🚦 Là biểu thức có dấu <, >, ≤, ≥.",
        "hệ phương trình": "🔧 Tập hợp nhiều phương trình giải cùng lúc.",
        "đại số": "📐 Đại số nghiên cứu biểu thức và phương trình.",
        "số học": "➕ Liên quan đến tính toán cơ bản với số.",
        "hàm số": "f(x) là hàm số nếu mỗi x chỉ có một y.",
        "giải bậc 2": "ax² + bx + c = 0 ⇒ Δ = b² - 4ac.",
        "thống kê": "📈 Phân tích dữ liệu thu thập được."
    },
    "Văn học": {
        "truyện kiều": "📚 Kiệt tác của Nguyễn Du nói về bi kịch và tài năng.",
        "chí phèo": "📝 Bi kịch người nông dân dưới chế độ thực dân phong kiến.",
        "việt bắc": "🎤 Tình cảm gắn bó giữa đồng bào và cán bộ kháng chiến.",
        "phong cách": "💡 Phong cách là cách thể hiện riêng biệt của nhà văn.",
        "thơ": "🖋️ Dạng văn học có vần điệu, cảm xúc.",
        "nghị luận": "💬 Trình bày suy nghĩ về vấn đề xã hội.",
        "biểu cảm": "❤️ Trình bày cảm xúc, suy nghĩ chủ quan.",
        "ẩn dụ": "🌿 Dùng hình ảnh khác để nói đến điều muốn nói.",
        "xuân diệu": "💘 Nhà thơ của tình yêu và thời gian.",
        "tỏ lòng": "⚔️ Bài thơ yêu nước của Phạm Ngũ Lão.",
        "vợ nhặt": "🥣 Phản ánh nạn đói 1945 và nhân phẩm con người.",
        "lão hạc": "👴 Lão Hạc bán chó vì thương con, sống nhân hậu.",
        "so sánh": "🔍 Phép tu từ chỉ sự giống nhau giữa hai đối tượng.",
        "hồi ký": "📖 Ghi lại trải nghiệm thật của người viết.",
        "tình cảm": "💓 Chủ đề thường gặp trong văn thơ.",
        "ngôn ngữ": "🗣️ Công cụ chính của văn học.",
        "văn nghị luận": "⚖️ Trình bày lý lẽ, dẫn chứng, phản biện.",
        "ngữ pháp": "🔠 Cấu trúc câu trong tiếng Việt.",
        "cảm xúc": "🎭 Là yếu tố tạo nên hồn văn học.",
        "từ ngữ": "📝 Vốn từ phong phú giúp diễn đạt hay hơn."
    },
    "Lịch sử": {
        "2/9": "🇻🇳 Ngày Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.",
        "chiến tranh thế giới": "🌍 Xảy ra do tranh chấp quyền lực giữa các nước lớn.",
        "triều đại": "👑 Các triều đại Việt: Lý, Trần, Lê, Nguyễn...",
        "cần vương": "🎯 Phong trào chống Pháp kêu gọi trung thành với vua.",
        "30/4": "✊ Giải phóng miền Nam, thống nhất đất nước 1975.",
        "tháng tám": "📅 Cách mạng 1945 lật đổ chính phủ bù nhìn.",
        "pháp thuộc": "🗺️ Việt Nam bị đô hộ gần 100 năm.",
        "bắc thuộc": "🧭 Thời kỳ bị phương Bắc xâm lược và đô hộ.",
        "trận bạch đằng": "⚓ Chiến thắng lớn của Ngô Quyền, Lê Hoàn và Trần Hưng Đạo.",
        "hiệp định genève": "✍️ Chia Việt Nam thành 2 miền tạm thời năm 1954.",
        "chủ nghĩa tư bản": "💼 Hệ thống kinh tế dựa vào sở hữu tư nhân.",
        "liên xô": "🌏 Cường quốc XHCN lớn nhất thế kỷ 20.",
        "hồ chí minh": "👨‍🏫 Người sáng lập nước Việt Nam Dân chủ Cộng hòa.",
        "đảng cộng sản": "⚒️ Tổ chức lãnh đạo cách mạng VN.",
        "ASEAN": "🌐 Hiệp hội các quốc gia Đông Nam Á.",
        "xã hội nguyên thủy": "🪓 Giai đoạn đầu của lịch sử loài người.",
        "công nghiệp": "🏭 Cách mạng tạo bước nhảy vọt công nghệ.",
        "đổi mới": "🔄 Chính sách phát triển đất nước sau 1986.",
        "lịch sử thế giới": "🌎 Bao gồm các nền văn minh lớn: Ai Cập, La Mã, Trung Hoa.",
        "thế giới sau chiến tranh": "🌐 Hình thành 2 cực: Liên Xô và Mỹ."
    },
    "Khoa học": {
        "trời mưa": "🌧️ Do hơi nước ngưng tụ tạo thành mây rồi mưa.",
        "nước sôi": "💧 100°C ở áp suất thường.",
        "carbon": "🔬 Cacbon di chuyển qua sinh vật và khí quyển.",
        "quang hợp": "🌱 Quá trình tạo ra O2 và đường từ CO₂ và ánh sáng.",
        "tế bào": "🔬 Đơn vị cơ bản của sự sống.",
        "lực hấp dẫn": "🌍 Lực hút giữa mọi vật có khối lượng.",
        "động đất": "🌏 Do sự dịch chuyển của các mảng kiến tạo.",
        "khúc xạ": "🌈 Ánh sáng đổi hướng khi đi qua chất khác nhau.",
        "pin": "🔋 Thiết bị chuyển hóa năng lượng hóa học thành điện.",
        "phản ứng hoá học": "🧪 Sự biến đổi chất này thành chất khác.",
        "nguyên tử": "🧬 Cấu tạo bởi proton, neutron, electron.",
        "nhiệt độ âm": "❄️ Dưới 0°C, dùng trong nghiên cứu và bảo quản.",
        "hành tinh": "🪐 Sao quay quanh Mặt Trời (ví dụ: Trái Đất, Sao Hỏa).",
        "DNA": "🧬 Vật liệu di truyền trong sinh vật sống.",
        "áp suất": "🌪️ Lực tác động trên một đơn vị diện tích.",
        "ánh sáng trắng": "🌞 Tập hợp của nhiều màu (cầu vồng).",
        "AI": "🤖 Trí tuệ nhân tạo mô phỏng tư duy con người.",
        "gen biến đổi": "🌽 Sinh vật có ADN bị thay đổi.",
        "sensor nhiệt": "🌡️ Thiết bị đo nhiệt độ.",
        "vật lý": "⚛️ Ngành nghiên cứu các định luật tự nhiên."
    },
    "Ngoại ngữ": {
        "i love learning": "❤️ Dịch: Tôi yêu việc học.",
        "hiện tại đơn": "⌛ S + V(s/es). Ví dụ: She works, they play.",
        "từ vựng": "📘 School, teacher, student, book...",
        "much": "Much dùng cho danh từ không đếm được.",
        "many": "Many dùng cho danh từ đếm được.",
        "tính từ": "Happy, big, red... dùng để mô tả.",
        "bị động": "S + to be + V3/ed.",
        "mệnh đề": "Who, which, that... để nối thông tin.",
        "điều kiện": "If + S + V, S + will/can...",
        "so sánh": "Taller, more beautiful, the most.",
        "tính từ kép": "A beautiful big red car.",
        "liên từ": "However, therefore, because...",
        "quá khứ tiếp diễn": "S + was/were + V-ing.",
        "giới từ": "In, on, at chỉ thời gian và nơi chốn.",
        "đuôi ed": "Phát âm: /id/, /t/, /d/ tùy động từ.",
        "gia đình": "Father, mother, sister...",
        "email": "Dear..., I hope you are well...",
        "say tell": "Say + something, Tell + someone + something.",
        "prefer": "Prefer to V: I prefer to read.",
        "idiom": "Break a leg = Chúc may mắn!"
    }
};

// Load theme when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
>>>>>>> 07a62967af4b234b9504ead2a8a09ba3662d274e
});