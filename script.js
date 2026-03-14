// ============================================
//      JAVATEAM - СКРИПТ САЙТА v2.0
//      ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let selectedTime = '';
let selectedMaps = [];
let isMenuOpen = false;

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
            setTimeout(() => preloader.classList.add('hidden'), 500);
        }
        preloaderBar.style.width = percent + '%';
        preloaderPercent.textContent = percent + '%';
    }, 100);
})();

// ===== МОБИЛЬНОЕ МЕНЮ =====
(function() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const close = document.getElementById('mobileMenuClose');
    
    if (!toggle || !menu || !overlay) return;
    
    toggle.addEventListener('click', () => {
        menu.classList.add('active');
        overlay.classList.add('active');
        toggle.classList.add('active');
        document.body.classList.add('menu-open');
        isMenuOpen = true;
    });
    
    const closeMenu = () => {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
        isMenuOpen = false;
    };
    
    if (close) close.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMenuOpen) closeMenu();
    });
})();

// ===== НАВИГАЦИЯ =====
(function() {
    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (header) header.classList.toggle('scrolled', scrollY > 50);
        
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                current = section.getAttribute('id');
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) link.classList.add('active');
        });
    });
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href?.startsWith('#')) {
                e.preventDefault();
                document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
})();

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadData() {
    if (!window.JAVATEAM_DB) {
        console.error('JAVATEAM_DB не найден!');
        return;
    }
    
    try {
        // ИСПРАВЛЕНО: getConfirmed() вместо getBookings()
        const times = JAVATEAM_DB.getAvailableTimes?.() || [];
        const confirmed = JAVATEAM_DB.getConfirmed?.() || [];
        const history = JAVATEAM_DB.getHistory?.() || [];
        
        renderTimes(times);
        renderConfirmed(confirmed);
        renderHistory(history);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// ===== ВРЕМЯ =====
function renderTimes(times) {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    if (!times || times.length === 0) {
        block.innerHTML = '<div class="empty-state">Нет доступного времени</div>';
        return;
    }
    
    block.innerHTML = times.map(time => 
        `<button class="time-slot ${selectedTime === time ? 'selected' : ''}" onclick="window.selectTime('${time}')">${time}</button>`
    ).join('');
}

window.selectTime = function(time) {
    selectedTime = time;
    renderTimes(JAVATEAM_DB?.getAvailableTimes() || []);
};

// ===== КАРТЫ =====
(function() {
    const mapItems = document.querySelectorAll('.map-item');
    const counter = document.getElementById('mapsCounter');
    
    mapItems.forEach(item => {
        item.addEventListener('click', () => {
            const mapName = item.dataset.map;
            
            if (item.classList.contains('selected')) {
                item.classList.remove('selected');
                selectedMaps = selectedMaps.filter(m => m !== mapName);
            } else {
                if (selectedMaps.length >= 3) {
                    alert('Можно выбрать не более 3 карт');
                    return;
                }
                item.classList.add('selected');
                selectedMaps.push(mapName);
            }
            if (counter) counter.textContent = selectedMaps.length + ' / 3';
        });
    });
})();

// ===== ОТПРАВКА ЗАЯВКИ =====
window.submitPractice = function() {
    if (!selectedTime) return alert('❌ Выберите время');
    
    const team = document.getElementById('teamName')?.value.trim();
    const captain = document.getElementById('captainNick')?.value.trim();
    const captainId = document.getElementById('captainId')?.value.trim();
    const tg = document.getElementById('captainTag')?.value.trim();
    const roster = document.getElementById('roster')?.value.trim();
    
    if (!team || !captain || !captainId || !tg || !roster) {
        return alert('❌ Заполните все поля');
    }
    
    if (!tg.startsWith('@')) return alert('❌ Telegram должен начинаться с @');
    if (!/^\d+$/.test(captainId)) return alert('❌ ID только цифры');
    if (selectedMaps.length === 0) return alert('❌ Выберите карты');
    
    const players = roster.split(',').map(p => p.trim()).filter(p => p);
    if (players.length < 5) return alert('❌ Укажите 5 игроков');
    
    if (!window.JAVATEAM_DB) return alert('❌ База данных не загружена');
    
    const result = JAVATEAM_DB.addPending({
        time: selectedTime,
        team: team.toUpperCase(),
        captain, captainId, tg,
        maps: selectedMaps.join(', '),
        roster
    });
    
    if (result.success) {
        alert('✅ Заявка отправлена! Ожидайте подтверждения.');
        document.getElementById('teamName').value = '';
        document.getElementById('captainNick').value = '';
        document.getElementById('captainId').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('roster').value = '';
        document.querySelectorAll('.map-item').forEach(i => i.classList.remove('selected'));
        selectedMaps = [];
        selectedTime = '';
        if (counter) counter.textContent = '0 / 3';
        loadData();
    } else {
        alert('❌ ' + (result.error || 'Ошибка отправки'));
    }
};

// ===== ПОДТВЕРЖДЕННЫЕ ПРАКИ =====
function renderConfirmed(confirmed) {
    const list = document.getElementById('confirmedList');
    if (!list) return;
    
    if (!confirmed || confirmed.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет подтвержденных праков</div>';
        return;
    }
    
    list.innerHTML = confirmed.map(b => `
        <div class="confirmed-item">
            <span class="confirmed-time">${b.time}</span>
            <span class="confirmed-teams">JAVATEAM vs ${b.team}</span>
            <span class="confirmed-status">ПОДТВЕРЖДЁН</span>
        </div>
    `).join('');
}

// ===== ИСТОРИЯ =====
function renderHistory(history) {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (!history || history.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет сыгранных праков</div>';
        return;
    }
    
    list.innerHTML = history.map(h => `
        <div class="history-row ${h.result}">
            <span class="history-opponent">VS ${h.opponent}</span>
            <span class="history-score">${h.score}</span>
            <span class="history-result">${h.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
        </div>
    `).join('');
}

// ===== СОСТАВ =====
function renderRoster() {
    if (!window.JAVATEAM_DB) return;
    
    const mainContainer = document.getElementById('mainRoster');
    const reserveContainer = document.getElementById('reserveRoster');
    
    const mainRoster = JAVATEAM_DB.getMainRoster?.() || [];
    const reserveRoster = JAVATEAM_DB.getReserveRoster?.() || [];
    
    if (mainContainer) {
        mainContainer.innerHTML = mainRoster.map(p => `
            <div class="player-card">
                <div class="player-nick">${p.nick}</div>
                <div class="player-id">ID: ${p.id}</div>
                <div class="player-stats">
                    <div class="player-stat"><span class="stat-label">K/D</span><span class="stat-value">${p.stats?.kd || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">ПРАКИ</span><span class="stat-value">${p.stats?.matches || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">ЧАСЫ</span><span class="stat-value">${p.stats?.hours || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">РАНГ</span><span class="stat-value">${p.rank || 'LEGENDS'}</span></div>
                </div>
                <div class="player-device">${p.device || '📱'}</div>
            </div>
        `).join('');
    }
    
    if (reserveContainer) {
        reserveContainer.innerHTML = reserveRoster.map(p => `
            <div class="player-card">
                <div class="player-nick">${p.nick}</div>
                <div class="player-id">ID: ${p.id}</div>
                <div class="player-stats">
                    <div class="player-stat"><span class="stat-label">K/D</span><span class="stat-value">${p.stats?.kd || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">ПРАКИ</span><span class="stat-value">${p.stats?.matches || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">ЧАСЫ</span><span class="stat-value">${p.stats?.hours || '0'}</span></div>
                    <div class="player-stat"><span class="stat-label">РАНГ</span><span class="stat-value">${p.rank || 'UNRANKED'}</span></div>
                </div>
                <div class="player-device">${p.device || '💻'}</div>
            </div>
        `).join('');
    }
}

// ===== КНОПКА НАВЕРХ =====
(function() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 500);
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ===== FAQ АККОРДЕОН =====
(function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
})();

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('JAVATEAM инициализация...');
    
    if (typeof JAVATEAM_DB !== 'undefined') {
        console.log('✅ База данных найдена');
        renderRoster();
        loadData();
        setInterval(loadData, 3000);
    } else {
        console.error('❌ База данных не найдена!');
    }
});

window.scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

console.log('%c╔════════════════════════════════════════╗\n║     JAVATEAM v2.0 ЗАГРУЖЕН            ║\n╚════════════════════════════════════════╝', 'color: #7C3AED; font-weight: bold;');
