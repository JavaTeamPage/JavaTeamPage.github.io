// ==================== ДАННЫЕ ====================
let times = [];
let bookings = [];
let historyMatches = [];
let selectedTime = '';
let timerInterval = null;

// Адрес сервера (для GitHub и локально)
const API_URL = 'http://localhost:8000';

// ==================== ЗАГРУЗКА ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[✅] JAVATEAM загружен');
    
    // Убираем прелоадер через 1.5 секунды
    setTimeout(() => {
        const preloader = document.querySelector('.preloader');
        if (preloader) preloader.style.display = 'none';
    }, 1500);

    initMobileMenu();
    initNavigation();
    initMapLimits();
    initPlayerCards();
    initAvatars();
    
    // Загружаем данные сразу
    loadData();
    
    // Обновление каждые 3 секунды
    setInterval(loadData, 3000);
    
    // Кнопка отправки
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitPractice();
        });
    }
});

// ==================== АВАТАРКИ ====================
function initAvatars() {
    // Для GitHub правильные пути
    const basePath = window.location.hostname.includes('github.io') 
        ? '/JavaTeamPage/image/' 
        : 'image/';
    
    document.querySelectorAll('.player-avatar img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.includes('image/')) {
            // Путь уже правильный
        } else {
            const playerName = img.alt;
            img.src = `${basePath}${playerName}.jpg`;
        }
        
        // Если изображение не загрузилось - показываем заглушку
        img.onerror = function() {
            this.src = `https://via.placeholder.com/150/4f46e5/ffffff?text=${this.alt}`;
        };
    });
}

// ==================== МОБИЛЬНОЕ МЕНЮ ====================
function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mobileNav');
    const close = document.getElementById('mobileClose');
    const overlay = document.querySelector('.menu-overlay');
    const links = document.querySelectorAll('.mobile-link');
    
    if (!toggle || !nav) return;
    
    // Создаем оверлей если его нет
    let menuOverlay = overlay;
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        document.body.appendChild(menuOverlay);
    }
    
    function openMenu() {
        nav.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        nav.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    toggle.addEventListener('click', openMenu);
    
    if (close) {
        close.addEventListener('click', closeMenu);
    }
    
    menuOverlay.addEventListener('click', closeMenu);
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            
            const targetId = link.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    // При изменении размера окна закрываем меню
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

// ==================== НАВИГАЦИЯ ====================
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    
    function updateActiveLink() {
        let current = '';
        const scrollY = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
}

// ==================== КАРТЫ (МАКСИМУМ 3) ====================
function initMapLimits() {
    document.querySelectorAll('.map-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            const checked = document.querySelectorAll('.map-item input[type="checkbox"]:checked');
            if (checked.length > 3) {
                this.checked = false;
                showNotification('❌ Можно выбрать только 3 карты', 'error');
            }
        });
    });
}

// ==================== КАРТОЧКИ ИГРОКОВ ====================
function initPlayerCards() {
    document.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('click', function() {
            const player = this.dataset.player;
            console.log(`👤 Игрок: ${player}`);
            // Здесь можно добавить попап с профилем
        });
    });
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadData() {
    // Загружаем доступное время
    fetch(`${API_URL}/api/times`)
        .then(response => {
            if (!response.ok) throw new Error('Сервер не отвечает');
            return response.json();
        })
        .then(data => {
            times = data;
            renderTimes();
        })
        .catch(error => {
            console.warn('⚠️ Сервер не доступен, используем локальные данные');
            // Для теста показываем демо-данные
            times = ['19:00', '20:00', '21:00'];
            renderTimes();
        });
    
    // Загружаем забронированные праки
    fetch(`${API_URL}/api/bookings`)
        .then(response => {
            if (!response.ok) throw new Error('Сервер не отвечает');
            return response.json();
        })
        .then(data => {
            bookings = data;
            renderBookings();
            updateMatchCenter();
        })
        .catch(error => {
            console.warn('⚠️ Сервер не доступен');
            bookings = [];
            renderBookings();
        });
    
    // Загружаем историю
    fetch(`${API_URL}/api/history`)
        .then(response => {
            if (!response.ok) throw new Error('Сервер не отвечает');
            return response.json();
        })
        .then(data => {
            historyMatches = data;
            renderHistory();
        })
        .catch(error => {
            console.warn('⚠️ Сервер не доступен');
            historyMatches = [];
            renderHistory();
        });
}

// ==================== ВРЕМЯ ====================
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    // Время которое еще не занято
    const freeTimes = times.filter(t => !bookings.some(b => b.time === t));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        return;
    }
    
    let html = '<div class="time-grid">';
    freeTimes.forEach(t => {
        html += `<button class="time-btn ${selectedTime === t ? 'selected' : ''}" 
                       onclick="selectTime('${t}')">${t}</button>`;
    });
    html += '</div>';
    
    block.innerHTML = html;
}

function selectTime(t) {
    selectedTime = t;
    renderTimes();
    showNotification(`✅ Выбрано время: ${t}`, 'success');
}

// ==================== ЗАЯВКА ====================
function submitPractice() {
    if (!selectedTime) {
        showNotification('❌ Выберите время', 'error');
        return;
    }
    
    const team = document.getElementById('teamName')?.value;
    const captain = document.getElementById('captainTag')?.value;
    const captainId = document.getElementById('captainId')?.value;
    const roster = document.getElementById('rosterPlayers')?.value;
    
    const maps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        maps.push(cb.value);
    });
    
    if (!team || !captain || !captainId) {
        showNotification('❌ Заполните все поля', 'error');
        return;
    }
    
    if (maps.length === 0) {
        showNotification('❌ Выберите карты', 'error');
        return;
    }
    
    const data = {
        time: selectedTime,
        team: team,
        captain: captain,
        captainId: captainId,
        maps: maps,
        roster: roster || ''
    };
    
    fetch(`${API_URL}/new_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(() => {
        showNotification('✅ Заявка отправлена!', 'success');
        
        // Очистка формы
        document.getElementById('teamName').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('captainId').value = '';
        document.getElementById('rosterPlayers').value = '';
        document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
        
        selectedTime = '';
        loadData(); // Обновляем данные
    })
    .catch(error => {
        console.error('❌ Ошибка:', error);
        showNotification('❌ Ошибка отправки', 'error');
    });
}

// ==================== ЗАБРОНИРОВАННЫЕ ====================
function renderBookings() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (bookings.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет забронированных праков</div>';
        return;
    }
    
    list.innerHTML = bookings.map(b => `
        <div class="practice-item">
            <span class="practice-time">${b.time}</span>
            <span class="practice-teams">JAVATEAM vs ${b.team}</span>
            <span class="practice-status">ПОДТВЕРЖДЕН</span>
        </div>
    `).join('');
}

// ==================== ИСТОРИЯ ====================
function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (historyMatches.length === 0) {
        list.innerHTML = '<div class="empty-state">История матчей пуста</div>';
        return;
    }
    
    list.innerHTML = historyMatches.map(h => `
        <div class="history-item ${h.result}">
            <span class="history-type">ПРАК</span>
            <span class="history-opponent">VS ${h.opponent}</span>
            <span class="history-score">${h.score}</span>
            <span class="history-result">${h.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
        </div>
    `).join('');
}

// ==================== МАТЧ ЦЕНТР ====================
function updateMatchCenter() {
    const opponent = document.getElementById('matchOpponent');
    const timer = document.getElementById('matchTimer');
    const status = document.getElementById('matchStatus');
    
    if (timerInterval) clearInterval(timerInterval);
    
    if (bookings.length === 0) {
        opponent.textContent = '—';
        timer.textContent = '';
        status.textContent = 'Нет ближайших матчей';
        return;
    }
    
    const next = bookings[0];
    opponent.textContent = next.team;
    status.textContent = 'Ближайший матч';
    
    const [hours, minutes] = next.time.split(':').map(Number);
    
    function updateTimer() {
        const now = new Date();
        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);
        
        if (now > matchDate) {
            matchDate.setDate(matchDate.getDate() + 1);
        }
        
        const diff = matchDate - now;
        
        if (diff <= 0) {
            timer.textContent = 'Матч идет';
            return;
        }
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timer.textContent = h > 0 ? `${h}ч ${m}м` : `${m}м`;
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 60000);
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#4f46e5'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 9999;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        border: 1px solid rgba(255,255,255,0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(5px);
        z-index: 999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    
    .menu-overlay.active {
        opacity: 1;
        pointer-events: all;
    }
`;
document.head.appendChild(style);

// ==================== СКРОЛЛ К СЕКЦИИ ====================
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.scrollToSection = scrollToSection;
window.selectTime = selectTime;
