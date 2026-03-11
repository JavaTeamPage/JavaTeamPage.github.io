// ===== ГЛОБАЛЬНЫЕ ДАННЫЕ (хранятся в браузере) =====
let availableTimes = [
    { time: '19:00', available: true },
    { time: '20:00', available: true },
    { time: '21:00', available: true },
    { time: '22:00', available: true }
];

let bookings = [
    { time: '19:00', team: '7WEEN', status: 'confirmed' },
    { time: '20:00', team: 'ROD', status: 'confirmed' }
];

let historyMatches = [];

let selectedTime = '';

// ===== ЗАГРУЗКА =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('JAVATEAM загружен');
    
    // Прелоадер
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, 1500);
    
    initBurgerMenu();
    initNavigation();
    initMapLimits();
    loadFromStorage();
    renderAll();
    
    // Кнопка отправки
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitPractice();
        });
    }
});

// ===== БУРГЕР-МЕНЮ =====
function initBurgerMenu() {
    const toggle = document.getElementById('burgerToggle');
    const menu = document.getElementById('burgerMenu');
    const close = document.getElementById('burgerClose');
    const overlay = document.getElementById('burgerOverlay');
    const links = document.querySelectorAll('.burger-link');
    
    function openMenu() {
        menu.classList.add('active');
        overlay.classList.add('active');
        toggle.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    if (toggle) toggle.addEventListener('click', openMenu);
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

// ===== НАВИГАЦИЯ =====
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('.nav-link, .burger-link');
    
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

// ===== ЗАГРУЗКА ИЗ STORAGE =====
function loadFromStorage() {
    const savedTimes = localStorage.getItem('javateam_times');
    const savedBookings = localStorage.getItem('javateam_bookings');
    const savedHistory = localStorage.getItem('javateam_history');
    
    if (savedTimes) availableTimes = JSON.parse(savedTimes);
    if (savedBookings) bookings = JSON.parse(savedBookings);
    if (savedHistory) historyMatches = JSON.parse(savedHistory);
}

// ===== СОХРАНЕНИЕ В STORAGE =====
function saveToStorage() {
    localStorage.setItem('javateam_times', JSON.stringify(availableTimes));
    localStorage.setItem('javateam_bookings', JSON.stringify(bookings));
    localStorage.setItem('javateam_history', JSON.stringify(historyMatches));
}

// ===== ОТРИСОВКА ВСЕГО =====
function renderAll() {
    renderTimes();
    renderBookings();
    renderHistory();
}

// ===== ВРЕМЯ =====
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    const freeTimes = availableTimes.filter(t => t.available && !bookings.some(b => b.time === t.time));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        return;
    }
    
    let html = '';
    freeTimes.forEach(t => {
        html += `<button class="time-slot ${selectedTime === t.time ? 'selected' : ''}" 
                       onclick="window.selectTime('${t.time}')">${t.time}</button>`;
    });
    
    block.innerHTML = html;
}

window.selectTime = function(time) {
    selectedTime = time;
    renderTimes();
};

// ===== КАРТЫ (МАКС 3) =====
function initMapLimits() {
    const mapItems = document.querySelectorAll('.map-item');
    let selectedMaps = [];
    
    mapItems.forEach(item => {
        item.addEventListener('click', function() {
            const mapName = this.dataset.map;
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedMaps = selectedMaps.filter(m => m !== mapName);
            } else {
                if (selectedMaps.length >= 3) {
                    alert('❌ Можно выбрать не более 3 карт');
                    return;
                }
                this.classList.add('selected');
                selectedMaps.push(mapName);
            }
        });
    });
}

// ===== ОТПРАВКА ЗАЯВКИ =====
window.submitPractice = function() {
    if (!selectedTime) {
        alert('❌ Выберите время');
        return;
    }
    
    const team = document.getElementById('teamName').value.trim();
    const captain = document.getElementById('captainNick').value.trim();
    const captainId = document.getElementById('captainId').value.trim();
    const tg = document.getElementById('captainTag').value.trim();
    const roster = document.getElementById('roster').value.trim();
    
    const selectedMaps = [];
    document.querySelectorAll('.map-item.selected').forEach(item => {
        selectedMaps.push(item.dataset.map);
    });
    
    if (!team || !captain || !captainId || !tg || !roster) {
        alert('❌ Заполните все поля');
        return;
    }
    
    if (selectedMaps.length === 0) {
        alert('❌ Выберите карты');
        return;
    }
    
    // Создаем заявку
    const newBooking = {
        time: selectedTime,
        team: team,
        captain: captain,
        captainId: captainId,
        tg: tg,
        maps: selectedMaps.join(', '),
        roster: roster,
        status: 'pending'
    };
    
    // Сохраняем в localStorage
    const pendingBookings = JSON.parse(localStorage.getItem('javateam_pending') || '[]');
    pendingBookings.push(newBooking);
    localStorage.setItem('javateam_pending', JSON.stringify(pendingBookings));
    
    alert('✅ Заявка отправлена! Ожидайте подтверждения администратора.');
    
    // Очистка формы
    document.getElementById('teamName').value = '';
    document.getElementById('captainNick').value = '';
    document.getElementById('captainId').value = '';
    document.getElementById('captainTag').value = '';
    document.getElementById('roster').value = '';
    document.querySelectorAll('.map-item').forEach(item => item.classList.remove('selected'));
    selectedTime = '';
    renderTimes();
};

// ===== ЗАБРОНИРОВАННЫЕ ПРАКИ =====
function renderBookings() {
    const list = document.getElementById('confirmedList');
    if (!list) return;
    
    if (bookings.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет подтвержденных праков</div>';
        return;
    }
    
    list.innerHTML = bookings.map(b => `
        <div class="confirmed-item">
            <span class="confirmed-time">${b.time}</span>
            <span class="confirmed-teams">JAVATEAM vs ${b.team}</span>
            <span class="confirmed-status">ПОДТВЕРЖДЁН</span>
        </div>
    `).join('');
}

// ===== ИСТОРИЯ =====
function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (historyMatches.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет сыгранных праков</div>';
        return;
    }
    
    list.innerHTML = historyMatches.map(m => `
        <div class="history-row ${m.result}">
            <span class="history-opponent">VS ${m.opponent}</span>
            <span class="history-score">${m.score}</span>
            <span class="history-result">${m.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
        </div>
    `).join('');
}

// ===== ДАННЫЕ СОСТАВА =====
const rosterData = [
    { nick: 'Eclipse', id: '159742523', kd: '1.87', pracs: '12', hours: '645', kpr: '0.85' },
    { nick: 'Paradox', id: '78443609', kd: '1.36', pracs: '6', hours: '893', kpr: '0.72' },
    { nick: 'Blast', id: '228967585', kd: '1.60', pracs: '11', hours: '578', kpr: '0.71' },
    { nick: 'Entry', id: '165878779', kd: '2.02', pracs: '2', hours: '254', kpr: '0.92' },
    { nick: 'elesy', id: '18587432', kd: '1.11', pracs: '5', hours: '1127', kpr: '0.63' }
];

const rosterContainer = document.getElementById('rosterContainer');
rosterData.forEach((player, index) => {
    rosterContainer.innerHTML += `
        <div class="player-card" style="animation-delay: ${index * 0.1}s">
            <div class="player-nick">${player.nick}</div>
            <div class="player-id">ID: ${player.id}</div>
            <div class="player-stats">
                <div class="player-stat">
                    <span class="stat-label">K/D</span>
                    <span class="stat-value">${player.kd}</span>
                </div>
                <div class="player-stat">
                    <span class="stat-label">ПРАКИ</span>
                    <span class="stat-value">${player.pracs}</span>
                </div>
                <div class="player-stat">
                    <span class="stat-label">ЧАСЫ</span>
                    <span class="stat-value">${player.hours}</span>
                </div>
                <div class="player-stat">
                    <span class="stat-label">KPR</span>
                    <span class="stat-value">${player.kpr}</span>
                </div>
            </div>
        </div>
    `;
});

// ===== АНИМАЦИЯ ПОЯВЛЕНИЯ =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.player-card, .practice-card, .confirmed-card, .about-card, .history-row').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px) scale(0.95)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});