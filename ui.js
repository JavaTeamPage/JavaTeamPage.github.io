// ==================== ДАННЫЕ ====================
let times = [];
let bookings = [];
let historyMatches = [];
let selectedTime = '';
let timerInterval = null;
const API_URL = 'http://localhost:8000';

// ==================== ЗАГРУЗКА ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[✓] JAVATEAM загружен');
    
    setTimeout(() => {
        document.querySelector('.preloader').style.display = 'none';
    }, 1500);

    initMobileMenu();
    initNavigation();
    initMapLimits();
    loadData();
    setInterval(loadData, 3000);
    
    document.querySelector('.submit-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        submitPractice();
    });
});

// ==================== МОБИЛЬНОЕ МЕНЮ ====================
function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mobileNav');
    const close = document.getElementById('mobileClose');
    const overlay = document.querySelector('.menu-overlay');
    const links = document.querySelectorAll('.mobile-link');
    
    if (!toggle || !nav) return;
    
    function openMenu() {
        nav.classList.add('active');
        overlay.classList.add('active');
    }
    
    function closeMenu() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    toggle.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ==================== НАВИГАЦИЯ ====================
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('.nav-link, .mobile-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollY = window.scrollY;
        
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                current = section.getAttribute('id');
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ==================== КАРТЫ (МАКС 3) ====================
function initMapLimits() {
    document.querySelectorAll('.map-item input').forEach(cb => {
        cb.addEventListener('change', function() {
            const checked = document.querySelectorAll('.map-item input:checked');
            if (checked.length > 3) {
                this.checked = false;
                showNotification('Максимум 3 карты', 'error');
            }
        });
    });
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadData() {
    fetch(`${API_URL}/api/times`)
        .then(r => r.json())
        .then(data => {
            times = data;
            renderTimes();
        })
        .catch(() => {
            times = [];
            renderTimes();
        });
    
    fetch(`${API_URL}/api/bookings`)
        .then(r => r.json())
        .then(data => {
            bookings = data;
            renderBookings();
            updateMatchCenter();
        })
        .catch(() => {
            bookings = [];
            renderBookings();
        });
    
    fetch(`${API_URL}/api/history`)
        .then(r => r.json())
        .then(data => {
            historyMatches = data;
            renderHistory();
        })
        .catch(() => {
            historyMatches = [];
            renderHistory();
        });
}

// ==================== ВРЕМЯ ====================
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    const freeTimes = times.filter(t => !bookings.some(b => b.time === t));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="empty-state">НЕТ ДОСТУПНОГО ВРЕМЕНИ</div>';
        return;
    }
    
    block.innerHTML = freeTimes.map(t => 
        `<button class="time-btn ${selectedTime === t ? 'selected' : ''}" 
                onclick="selectTime('${t}')">${t}</button>`
    ).join('');
}

function selectTime(t) {
    selectedTime = t;
    renderTimes();
    showNotification(`Выбрано: ${t}`, 'success');
}

// ==================== ЗАЯВКА ====================
function submitPractice() {
    if (!selectedTime) {
        showNotification('Выберите время', 'error');
        return;
    }
    
    const team = document.getElementById('teamName')?.value;
    const captain = document.getElementById('captainTag')?.value;
    const captainId = document.getElementById('captainId')?.value;
    const roster = document.getElementById('rosterPlayers')?.value;
    
    const maps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => maps.push(cb.value));
    
    if (!team || !captain || !captainId) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (maps.length === 0) {
        showNotification('Выберите карты', 'error');
        return;
    }
    
    fetch(`${API_URL}/new_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            time: selectedTime,
            team,
            captain,
            captainId,
            maps,
            roster: roster || ''
        })
    })
    .then(r => r.json())
    .then(() => {
        showNotification('Заявка отправлена', 'success');
        document.getElementById('teamName').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('captainId').value = '';
        document.getElementById('rosterPlayers').value = '';
        document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
        selectedTime = '';
        loadData();
    })
    .catch(() => showNotification('Ошибка', 'error'));
}

// ==================== ЗАБРОНИРОВАННЫЕ ====================
function renderBookings() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (bookings.length === 0) {
        list.innerHTML = '<div class="empty-state">НЕТ ЗАБРОНИРОВАННЫХ ПРАКОВ</div>';
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
        list.innerHTML = '<div class="empty-state">ИСТОРИЯ ПУСТА</div>';
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
        status.textContent = 'НЕТ БЛИЖАЙШИХ МАТЧЕЙ';
        return;
    }
    
    const next = bookings[0];
    opponent.textContent = next.team;
    status.textContent = 'БЛИЖАЙШИЙ МАТЧ';
    
    const [hours, minutes] = next.time.split(':').map(Number);
    
    function updateTimer() {
        const now = new Date();
        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);
        
        if (now > matchDate) matchDate.setDate(matchDate.getDate() + 1);
        
        const diff = matchDate - now;
        if (diff <= 0) {
            timer.textContent = 'МАТЧ ИДЕТ';
            return;
        }
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        timer.textContent = h > 0 ? `${h}Ч ${m}М` : `${m}М`;
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 60000);
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        z-index: 9999;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        animation: slideIn 0.2s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.2s ease';
        setTimeout(() => notification.remove(), 200);
    }, 2000);
}

// ==================== СТИЛИ УВЕДОМЛЕНИЙ ====================
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
`;
document.head.appendChild(style);

// ==================== СКРОЛЛ ====================
function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.scrollToSection = scrollToSection;
window.selectTime = selectTime;
window.submitPractice = submitPractice;