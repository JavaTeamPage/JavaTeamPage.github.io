// ===== ГЛОБАЛЬНЫЕ ДАННЫЕ =====
let availableTimes = [];
let bookings = [];
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
    loadData();
    
    // Запускаем обновление каждые 2 секунды
    setInterval(loadData, 2000);
    
    // Кнопка отправки
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitPractice();
        });
    }
});

// ===== ЗАГРУЗКА ДАННЫХ ИЗ STORAGE =====
function loadData() {
    // Загружаем доступное время
    const times = JSON.parse(localStorage.getItem('javateam_times') || '[]');
    availableTimes = times.map(t => ({ time: t, available: true }));
    
    // Загружаем подтвержденные праки
    bookings = JSON.parse(localStorage.getItem('javateam_bookings') || '[]');
    
    renderTimes();
    renderBookings();
}

// ===== ОТРИСОВКА ВРЕМЕНИ =====
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    // Время которое еще не забронировали
    const bookedTimes = bookings.map(b => b.time);
    const freeTimes = availableTimes.filter(t => !bookedTimes.includes(t.time));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        return;
    }
    
    let html = '<div class="time-slots">';
    freeTimes.forEach(t => {
        html += `<button class="time-slot ${selectedTime === t.time ? 'selected' : ''}" 
                       onclick="window.selectTime('${t.time}')">${t.time}</button>`;
    });
    html += '</div>';
    
    block.innerHTML = html;
}

// ===== ВЫБОР ВРЕМЕНИ =====
window.selectTime = function(time) {
    selectedTime = time;
    renderTimes();
};

// ===== ОТРИСОВКА ПОДТВЕРЖДЕННЫХ ПРАКОВ =====
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
        roster: roster
    };
    
    // Сохраняем в pending
    const pending = JSON.parse(localStorage.getItem('javateam_pending') || '[]');
    pending.push(newBooking);
    localStorage.setItem('javateam_pending', JSON.stringify(pending));
    
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

document.querySelectorAll('.player-card, .practice-card, .confirmed-card, .about-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px) scale(0.95)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
