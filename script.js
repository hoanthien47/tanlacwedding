document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Guest Loader (Đọc danh sách khách mời từ file guests.txt)
    let currentGuest = null;

    async function loadGuestInfo() {
        try {
            // Lấy guest ID từ URL Query (?g=1 hoặc ?guest=1) hoặc từ URL Hash (#1)
            let guestId = '';
            const urlParams = new URLSearchParams(window.location.search);
            
            if (urlParams.has('g')) {
                guestId = urlParams.get('g').trim();
            } else if (urlParams.has('guest')) {
                guestId = urlParams.get('guest').trim();
            } else if (window.location.hash) {
                guestId = window.location.hash.substring(1).trim();
            }

            if (!guestId) {
                console.log('Không tìm thấy ID khách mời, hiển thị thư mời mặc định.');
                return;
            }

            // Đọc tệp guests.txt
            const response = await fetch('guests.txt');
            if (!response.ok) {
                throw new Error('Không thể tải tệp guests.txt');
            }
            const textData = await response.text();
            
            // Phân tích dữ liệu dòng văn bản
            const lines = textData.split('\n');
            const guestsMap = {};
            
            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = line.split('|');
                if (parts.length >= 3) {
                    const id = parts[0].trim();
                    const title = parts[1].trim(); // xưng hô (Anh/Chị/Bạn...)
                    const name = parts[2].trim();  // tên khách
                    const role = parts[3] ? parts[3].trim() : ''; // quan hệ (bạn thân, đồng nghiệp...)
                    
                    guestsMap[id] = { id, title, name, role };
                }
            });

            if (guestsMap[guestId]) {
                currentGuest = guestsMap[guestId];
                updateGuestUI(currentGuest);
            } else {
                console.log(`Không tìm thấy khách mời có ID: ${guestId}`);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin khách mời:', error);
        }
    }

    function updateGuestUI(guest) {
        const guestNameCover = document.getElementById('guest-name-cover');
        const guestRoleCover = document.getElementById('guest-role-cover');
        const rsvpNameInput = document.getElementById('rsvp-name');
        
        // Cập nhật tên trên màn hình Cover
        const fullGreeting = `${guest.title} ${guest.name}`;
        guestNameCover.textContent = fullGreeting;
        
        if (guest.role) {
            guestRoleCover.textContent = guest.role;
        } else {
            guestRoleCover.textContent = "Đến dự buổi tiệc chung vui cùng gia đình chúng tôi";
        }
        
        // Tự động điền tên vào Form RSVP
        if (rsvpNameInput) {
            rsvpNameInput.value = fullGreeting;
        }
    }

    loadGuestInfo();

    // 2. Cover Screen Transition & Music Autoplay Handler
    const btnOpenInvitation = document.getElementById('btn-open-invitation');
    const coverScreen = document.getElementById('cover-screen');
    const mainContent = document.getElementById('main-content');
    const musicPlayerCtrl = document.getElementById('music-player-ctrl');
    const audio = document.getElementById('wedding-music');
    const btnMusicToggle = document.getElementById('btn-music-toggle');

    btnOpenInvitation.addEventListener('click', () => {
        // 1. Phát nhạc nền
        playAudio();

        // 2. Chuyển đổi màn hình (ẩn Cover, hiện Main)
        coverScreen.classList.add('dismissed');
        mainContent.classList.remove('hidden');
        
        // Thêm delay nhẹ để transition CSS hoạt động mượt mà
        setTimeout(() => {
            mainContent.classList.add('visible');
            musicPlayerCtrl.classList.remove('hidden');
            // Kích hoạt tính năng cuộn trang và hiển thị nội dung
            initScrollReveal();
        }, 100);
    });

    // Trình phát nhạc
    let isPlaying = false;

    function playAudio() {
        audio.play().then(() => {
            isPlaying = true;
            musicPlayerCtrl.classList.add('playing');
        }).catch(err => {
            console.log('Chính sách trình duyệt ngăn tự động phát nhạc:', err);
            isPlaying = false;
            musicPlayerCtrl.classList.remove('playing');
        });
    }

    function pauseAudio() {
        audio.pause();
        isPlaying = false;
        musicPlayerCtrl.classList.remove('playing');
    }

    btnMusicToggle.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // 3. Countdown Timer (Đếm ngược)
    // Ngày cưới mục tiêu: 3 Tháng 7 năm 2026 lúc 16:00
    const targetDate = new Date('2026-07-03T16:00:00+07:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            document.getElementById('days').innerText = "00";
            document.getElementById('hours').innerText = "00";
            document.getElementById('minutes').innerText = "00";
            document.getElementById('seconds').innerText = "00";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = String(days).padStart(2, '0');
        document.getElementById('hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown(); // Chạy ngay lập tức lần đầu

    // 4. Scroll Reveal Animations (Hiệu ứng xuất hiện khi cuộn tới)
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Không cần observe nữa sau khi đã hiển thị
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    // 5. Image Lightbox Modal (Xem ảnh phóng to)
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('.gallery-img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('active');
        });
    });

    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });

    // 6. Registry Gift Modals (Mở hộp mừng cưới)
    const giftButtons = document.querySelectorAll('.btn-gift-modal');
    const modalCloses = document.querySelectorAll('.modal-close');

    giftButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetModal = document.getElementById(targetId);
            if (targetModal) {
                targetModal.classList.add('active');
            }
        });
    });

    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            const targetId = close.getAttribute('data-target');
            const targetModal = document.getElementById(targetId);
            if (targetModal) {
                targetModal.classList.remove('active');
            }
        });
    });

    // Đóng modal khi bấm ra ngoài vùng nội dung
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // 7. Wishes Wall & RSVP Submission Logic (Lưu bút & Xác nhận tham dự)
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpSuccess = document.getElementById('rsvp-success');
    const wishesWall = document.getElementById('wishes-wall');
    const attendanceRadio = document.getElementsByName('attendance');
    const guestsGroup = document.getElementById('guests-number-group');

    // Mặc định ẩn/hiện số người tham dự tùy chọn RSVP
    attendanceRadio.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'no') {
                guestsGroup.style.display = 'none';
            } else {
                guestsGroup.style.display = 'block';
            }
        });
    });

    // Một vài lời chúc mẫu để trang web trông sinh động ngay khi mới tải
    const defaultWishes = [
        { name: "Anh Nam", relation: "Bạn thân chú rể", message: "Chúc Lạc và Vân trăm năm hạnh phúc, răng long đầu bạc nhé! Tiệc cưới hoành tráng quá.", time: "07/06/2026 14:30" },
        { name: "Chị Thảo", relation: "Em họ cô dâu", message: "Chúc hai bạn luôn ngọt ngào như những ngày đầu. Em rất mong chờ đến ngày cưới!", time: "07/06/2026 15:45" },
        { name: "Tiến Dũng", relation: "Đồng nghiệp chú rể", message: "Chúc mừng ngày song hỷ lâm môn! Chúc vợ chồng son gặp nhiều may mắn và thành công trên chặng đường mới.", time: "07/06/2026 18:20" }
    ];

    function loadWishes() {
        let wishes = JSON.parse(localStorage.getItem('wedding_wishes'));
        if (!wishes) {
            wishes = defaultWishes;
            localStorage.setItem('wedding_wishes', JSON.stringify(wishes));
        }
        
        wishesWall.innerHTML = '';
        // Hiển thị lời chúc mới nhất lên đầu
        wishes.slice().reverse().forEach(wish => {
            const card = document.createElement('div');
            card.className = 'wish-card';
            
            const relationBadge = wish.relation ? `<span class="wish-relation">${wish.relation}</span>` : '';
            
            card.innerHTML = `
                <div class="wish-header">
                    <span class="wish-sender">${wish.name}</span>
                    ${relationBadge}
                </div>
                <p class="wish-content">"${wish.message}"</p>
                <div class="wish-time">${wish.time}</div>
            `;
            wishesWall.appendChild(card);
        });
    }

    loadWishes();

    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('rsvp-name').value.trim();
        const attendance = document.querySelector('input[name="attendance"]:checked').value;
        const guests = document.getElementById('rsvp-guests').value;
        const message = document.getElementById('rsvp-message').value.trim();
        const submitBtn = document.getElementById('btn-submit-rsvp');
        const spinner = submitBtn.querySelector('.spinner');
        
        // Hiện hiệu ứng tải
        submitBtn.disabled = true;
        spinner.classList.remove('hidden');
        
        // Giả lập gửi lên máy chủ trong 1.5 giây
        setTimeout(() => {
            // Lấy thời gian hiện tại để hiển thị
            const now = new Date();
            const timeString = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // Xác định mối quan hệ từ currentGuest nếu có
            let relation = 'Khách quý';
            if (currentGuest && currentGuest.role) {
                relation = currentGuest.role;
            } else if (attendance === 'no') {
                relation = 'Gửi lời chúc';
            } else {
                relation = 'Sẽ tham dự';
            }

            // Nếu khách hàng ghi lời chúc, lưu lại vào wishes wall
            if (message) {
                const newWish = {
                    name: name,
                    relation: relation,
                    message: message,
                    time: timeString
                };
                
                let wishes = JSON.parse(localStorage.getItem('wedding_wishes')) || [];
                wishes.push(newWish);
                localStorage.setItem('wedding_wishes', JSON.stringify(wishes));
                
                // Cập nhật lại giao diện wishes wall
                loadWishes();
            }

            // Ẩn form và hiện thông báo thành công
            rsvpForm.classList.add('hidden');
            rsvpSuccess.classList.remove('hidden');
            
            submitBtn.disabled = false;
            spinner.classList.add('hidden');
        }, 1500);
    });

    // 8. Canvas Gold Dust Particle System (Hiệu ứng nhũ vàng bay)
    const canvas = document.getElementById('dust-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    const maxParticles = 60;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.reset(true);
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.type === 'petal') {
                this.rotation += this.rotationSpeed;
                this.speedX = Math.sin(this.y * 0.01 + this.swayOffset) * 0.5;
            } else {
                this.speedX += Math.random() * 0.02 - 0.01;
            }
            
            this.alpha -= this.alphaSpeed;
            if (this.alpha <= 0) {
                this.reset();
            }

            if (this.y < -20) {
                this.reset();
            }
        }

        reset(initial = false) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
            this.type = Math.random() > 0.4 ? 'petal' : 'dust';
            
            if (this.type === 'petal') {
                this.size = Math.random() * 5 + 3;
                this.speedY = Math.random() * -0.8 - 0.4;
                this.speedX = Math.random() * 0.6 - 0.3;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 1.5 - 0.75;
                this.swayOffset = Math.random() * 100;
                const pinks = ['rgba(255, 209, 220, ', 'rgba(247, 185, 196, ', 'rgba(255, 228, 230, '];
                this.colorBase = pinks[Math.floor(Math.random() * pinks.length)];
            } else {
                this.size = Math.random() * 2 + 1;
                this.speedY = Math.random() * -0.5 - 0.2;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.colorBase = 'rgba(212, 175, 55, ';
            }
            
            this.alpha = Math.random() * 0.5 + 0.2;
            this.alphaSpeed = Math.random() * 0.003 + 0.001;
        }

        draw() {
            if (this.type === 'petal') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 1.4, this.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fillStyle = `${this.colorBase}${this.alpha})`;
                ctx.shadowColor = 'rgba(247, 185, 196, 0.3)';
                ctx.shadowBlur = 4;
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `${this.colorBase}${this.alpha})`;
                ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
                ctx.shadowBlur = 3;
                ctx.fill();
            }
        }
    }

    function initParticles() {
        // Khởi tạo các hạt phân bố ngẫu nhiên khắp màn hình lúc đầu
        for (let i = 0; i < maxParticles; i++) {
            const p = new Particle();
            p.y = Math.random() * canvas.height; // Phân bố đều lúc bắt đầu
            particles.push(p);
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
});
