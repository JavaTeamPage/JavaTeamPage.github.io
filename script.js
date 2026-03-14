/* ================================================ */
/* JAVATEAM - ОСНОВНОЙ СКРИПТ v4.0                   */
/* ================================================ */

// ===== ПРЕЛОАДЕР =====
(function() {
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloaderBar');
    const preloaderPercent = document.getElementById('preloaderPercent');
    
    if (!preloader || !preloaderBar || !preloaderPercent) return;
    
    let percent = 0;
    const interval = setInterval(() => {
        percent += Math.floor(Math.random() * 10) + 1;
        if (percent >= 100) {
            percent = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.classList.add('loaded');
            }, 500);
        }
        
        preloaderBar.style.width = percent + '%';
        preloaderPercent.textContent = percent + '%';
    }, 100);
})();

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let selectedTime = '';
let selectedMaps = [];
let isMenuOpen = false;

// ===== МОБИЛЬНОЕ МЕНЮ =====
(function() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    const menuClose = document.getElementById('mobileMenuClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (!menuToggle || !mobileMenu || !menuOverlay) return;
    
    function openMenu() {
        mobileMenu.classList.add('active');
        menuOverlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.classList.add('menu-open');
        isMenuOpen = true;
    }
    
    function closeMenu() {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
        isMenuOpen = false;
    }
    
    menuToggle.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMenu();
        }
    });
})();

// ===== НАВИГАЦИЯ =====
(function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const header = document.getElementById('header');
    
    function updateActiveLink() {
        const scrollY = window.scrollY;
        
        if (header) {
            header.classList.toggle('scrolled', scrollY > 50);
        }
        
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            
            if (scrollY >= top && scrollY < bottom) {
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
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
})();

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadData() {
    if (typeof JAVATEAM_DB !== 'undefined') {
        try {
            const availableTimes = JAVATEAM_DB.getAvailableTimes();
            const bookings = JAVATEAM_DB.getBookings();
            const history = JAVATEAM_DB.getHistory();
            
            renderTimes(availableTimes);
            renderBookings(bookings);
            renderHistory(history);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }
}

// ===== ОТРИСОВКА ВРЕМЕНИ =====
function renderTimes(times) {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    if (!times || times.length === 0) {
        block.innerHTML = '<div class="empty-state"><i class="bi bi-clock"></i><span>Нет доступного времени</span></div>';
        return;
    }
    
    let html = '';
    times.forEach(time => {
        const selectedClass = selectedTime === time ? 'selected' : '';
        html += `<button class="time-slot ${selectedClass}" onclick="window.selectTime('${time}')">${time}</button>`;
    });
    block.innerHTML = html;
}

window.selectTime = function(time) {
    selectedTime = time;
    if (typeof JAVATEAM_DB !== 'undefined') {
        renderTimes(JAVATEAM_DB.getAvailableTimes());
    }
};

// ===== КАРТЫ =====
(function() {
    const mapItems = document.querySelectorAll('.map-item');
    const mapsCounter = document.getElementById('mapsCounter');
    
    mapItems.forEach(item => {
        item.addEventListener('click', function() {
            const mapName = this.dataset.map;
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedMaps = selectedMaps.filter(m => m !== mapName);
            } else {
                if (selectedMaps.length >= 3) {
                    alert('Можно выбрать не более 3 карт');
                    return;
                }
                this.classList.add('selected');
                selectedMaps.push(mapName);
            }
            
            if (mapsCounter) {
                mapsCounter.textContent = selectedMaps.length + ' / 3';
            }
        });
    });
})();

// ===== ОТПРАВКА ЗАЯВКИ =====
window.submitPractice = function() {
    if (!selectedTime) {
        alert('❌ Выберите время');
        return;
    }
    
    const team = document.getElementById('teamName')?.value.trim();
    const captain = document.getElementById('captainNick')?.value.trim();
    const captainId = document.getElementById('captainId')?.value.trim();
    const tg = document.getElementById('captainTag')?.value.trim();
    const roster = document.getElementById('roster')?.value.trim();
    
    if (!team || !captain || !captainId || !tg || !roster) {
        alert('❌ Заполните все поля');
        return;
    }
    
    if (!tg.startsWith('@')) {
        alert('❌ Telegram должен начинаться с @');
        return;
    }
    
    if (!/^\d+$/.test(captainId)) {
        alert('❌ ID должен содержать только цифры');
        return;
    }
    
    if (selectedMaps.length === 0) {
        alert('❌ Выберите хотя бы одну карту');
        return;
    }
    
    const players = roster.split(',').map(p => p.trim()).filter(p => p);
    if (players.length < 5) {
        alert('❌ Укажите минимум 5 игроков');
        return;
    }
    
    const practiceData = {
        time: selectedTime,
        team: team.toUpperCase(),
        captain: captain,
        captainId: captainId,
        tg: tg,
        maps: selectedMaps.join(', '),
        roster: roster,
        timestamp: new Date().toISOString()
    };
    
    if (typeof JAVATEAM_DB !== 'undefined') {
        const result = JAVATEAM_DB.addPending(practiceData);
        if (result.success) {
            alert('✅ Заявка отправлена! Ожидайте подтверждения.');
            clearForm();
        } else {
            alert('❌ ' + (result.error || 'Ошибка отправки'));
        }
    }
};

function clearForm() {
    document.getElementById('teamName').value = '';
    document.getElementById('captainNick').value = '';
    document.getElementById('captainId').value = '';
    document.getElementById('captainTag').value = '';
    document.getElementById('roster').value = '';
    
    document.querySelectorAll('.map-item').forEach(item => item.classList.remove('selected'));
    selectedMaps = [];
    selectedTime = '';
    
    const mapsCounter = document.getElementById('mapsCounter');
    if (mapsCounter) mapsCounter.textContent = '0 / 3';
    
    if (typeof JAVATEAM_DB !== 'undefined') {
        renderTimes(JAVATEAM_DB.getAvailableTimes());
    }
}

// ===== ОТРИСОВКА ПОДТВЕРЖДЕННЫХ =====
function renderBookings(bookings) {
    const list = document.getElementById('confirmedList');
    if (!list) return;
    
    if (!bookings || bookings.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="bi bi-calendar-x"></i><span>Нет подтвержденных праков</span></div>';
        return;
    }
    
    let html = '';
    bookings.forEach((booking, index) => {
        html += `
            <div class="confirmed-item" style="animation-delay: ${index * 0.1}s">
                <span class="confirmed-time">${booking.time}</span>
                <span class="confirmed-teams">JAVATEAM vs ${booking.team}</span>
                <span class="confirmed-status">ПОДТВЕРЖДЁН</span>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ===== ОТРИСОВКА ИСТОРИИ =====
function renderHistory(history) {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (!history || history.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="bi bi-clock-history"></i><span>Нет сыгранных праков</span></div>';
        return;
    }
    
    let html = '';
    history.forEach((item, index) => {
        html += `
            <div class="history-row ${item.result || 'win'}" style="animation-delay: ${index * 0.1}s">
                <span class="history-opponent">VS ${item.opponent || 'UNKNOWN'}</span>
                <span class="history-score">${item.score || '0:0'}</span>
                <span class="history-result">${item.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ===== ОТРИСОВКА СОСТАВА (ИЗ БАЗЫ) =====
function renderRoster() {
    if (typeof JAVATEAM_DB === 'undefined') return;
    
    const mainRoster = JAVATEAM_DB.getMainRoster();
    const reserveRoster = JAVATEAM_DB.getReserveRoster();
    
    const mainContainer = document.getElementById('mainRoster');
    const reserveContainer = document.getElementById('reserveRoster');
    
    if (mainContainer) {
        mainContainer.innerHTML = mainRoster.map((player, index) => `
            <div class="player-card" style="animation-delay: ${index * 0.1}s">
                <div class="player-nick">${player.nick}</div>
                <div class="player-id">ID: ${player.uid}</div>
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
                        <span class="stat-label">РАНГ</span>
                        <span class="stat-value">${player.rank}</span>
                    </div>
                </div>
                <div class="player-device">${player.device}</div>
            </div>
        `).join('');
    }
    
    if (reserveContainer) {
        reserveContainer.innerHTML = reserveRoster.map((player, index) => `
            <div class="player-card" style="animation-delay: ${index * 0.1}s">
                <div class="player-nick">${player.nick}</div>
                <div class="player-id">ID: ${player.uid}</div>
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
                        <span class="stat-label">РАНГ</span>
                        <span class="stat-value">${player.rank}</span>
                    </div>
                </div>
                <div class="player-device">${player.device}</div>
            </div>
        `).join('');
    }
}

// ===== КНОПКА НАВЕРХ =====
(function() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('show', window.scrollY > 500);
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ===== СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ =====
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1A1C28;
        border: 1px solid #2D2F3E;
        border-radius: 12px;
        padding: 15px 25px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        border-left: 3px solid #7C3AED;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-left-color: #10B981;
    }
    .notification.success i {
        color: #10B981;
    }
    
    .notification.error {
        border-left-color: #EF4444;
    }
    .notification.error i {
        color: #EF4444;
    }
    
    .notification i {
        font-size: 20px;
    }
`;
document.head.appendChild(style);

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('JAVATEAM инициализация...');
    
    renderRoster(); // ← СОСТАВ ЗАГРУЖАЕТСЯ ИЗ БАЗЫ
    loadData();
    
    setInterval(loadData, 3000);
});

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.scrollToSection = function(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
};

console.log('%c╔════════════════════════════════════════╗\n║     JAVATEAM v4.0 ЗАГРУЖЕН            ║\n╚════════════════════════════════════════╝', 'color: #7C3AED; font-weight: bold;');
// ===== ВРЕМЕННОЕ РЕШЕНИЕ - СОСТАВ НАПРЯМУЮ =====
(function() {
    console.log('🔄 Загружаю состав напрямую...');
    
    const mainRoster = [
        { nick: 'Эклипсе', uid: '159742523', kd: '0', pracs: '0', hours: '0', rank: 'LEGENDS', device: '📱' },
        { nick: 'Bloodaim', uid: '228967585', kd: '0', pracs: '0', hours: '0', rank: 'LEGENDS', device: '📱' },
        { nick: 'D3lrayyy', uid: '165878779', kd: '0', pracs: '0', hours: '0', rank: 'LEGENDS', device: '📱' },
        { nick: 'Desent', uid: '78443609', kd: '0', pracs: '0', hours: '0', rank: 'LEGENDS', device: '📱' },
        { nick: 'Lukolivov', uid: '18587432', kd: '0', pracs: '0', hours: '0', rank: 'LEGENDS', device: '📱' }
    ];
    
    const reserveRoster = [
        { nick: 'Blast', uid: '11223344', kd: '0', pracs: '0', hours: '0', rank: 'UNRANKED', device: '💻' },
        { nick: 'Qw3ak', uid: '55667788', kd: '0', pracs: '0', hours: '0', rank: 'UNRANKED', device: '💻' },
        { nick: 'Paradox', uid: '99001122', kd: '0', pracs: '0', hours: '0', rank: 'UNRANKED', device: '💻' }
    ];
    
    function renderDirectRoster() {
        const mainContainer = document.getElementById('mainRoster');
        const reserveContainer = document.getElementById('reserveRoster');
        
        if (mainContainer) {
            mainContainer.innerHTML = mainRoster.map(player => `
                <div class="player-card">
                    <div class="player-nick">${player.nick}</div>
                    <div class="player-id">ID: ${player.uid}</div>
                    <div class="player-stats">
                        <div class="player-stat"><span class="stat-label">K/D</span><span class="stat-value">${player.kd}</span></div>
                        <div class="player-stat"><span class="stat-label">ПРАКИ</span><span class="stat-value">${player.pracs}</span></div>
                        <div class="player-stat"><span class="stat-label">ЧАСЫ</span><span class="stat-value">${player.hours}</span></div>
                        <div class="player-stat"><span class="stat-label">РАНГ</span><span class="stat-value">${player.rank}</span></div>
                    </div>
                    <div class="player-device">${player.device}</div>
                </div>
            `).join('');
            console.log('✅ Основной состав загружен');
        }
        
        if (reserveContainer) {
            reserveContainer.innerHTML = reserveRoster.map(player => `
                <div class="player-card">
                    <div class="player-nick">${player.nick}</div>
                    <div class="player-id">ID: ${player.uid}</div>
                    <div class="player-stats">
                        <div class="player-stat"><span class="stat-label">K/D</span><span class="stat-value">${player.kd}</span></div>
                        <div class="player-stat"><span class="stat-label">ПРАКИ</span><span class="stat-value">${player.pracs}</span></div>
                        <div class="player-stat"><span class="stat-label">ЧАСЫ</span><span class="stat-value">${player.hours}</span></div>
                        <div class="player-stat"><span class="stat-label">РАНГ</span><span class="stat-value">${player.rank}</span></div>
                    </div>
                    <div class="player-device">${player.device}</div>
                </div>
            `).join('');
            console.log('✅ Резервный состав загружен');
        }
    }
    
    // Загружаем при готовности DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderDirectRoster);
    } else {
        renderDirectRoster();
    }
})();
