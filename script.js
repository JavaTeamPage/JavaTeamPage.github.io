// Прелоадер
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 2200);
});

// ===== БУРГЕР-МЕНЮ =====
const burgerToggle = document.getElementById('burgerToggle');
const burgerMenu = document.getElementById('burgerMenu');
const burgerOverlay = document.getElementById('burgerOverlay');
const burgerClose = document.getElementById('burgerClose');
const burgerLinks = document.querySelectorAll('.burger-link');
const body = document.body;

function openBurgerMenu() {
    burgerMenu.classList.add('active');
    burgerOverlay.classList.add('active');
    burgerToggle.classList.add('active');
    body.classList.add('menu-open');
}

function closeBurgerMenu() {
    burgerMenu.classList.remove('active');
    burgerOverlay.classList.remove('active');
    burgerToggle.classList.remove('active');
    body.classList.remove('menu-open');
}

burgerToggle.addEventListener('click', openBurgerMenu);
burgerClose.addEventListener('click', closeBurgerMenu);
burgerOverlay.addEventListener('click', closeBurgerMenu);

// Закрытие бургер-меню при клике на ссылку
burgerLinks.forEach(link => {
    link.addEventListener('click', closeBurgerMenu);
});

// ===== ИСПРАВЛЕНИЕ КНОПОК =====
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link, .burger-link');

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
window.addEventListener('load', updateActiveLink);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            closeBurgerMenu();
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== БАЗА ДАННЫХ =====
const API_URL = 'http://localhost:8000';
let times = [];
let bookings = [];
let selectedTime = '';

// Загрузка данных с сервера
async function loadData() {
    try {
        // Загружаем доступное время
        const timesResponse = await fetch(API_URL + '/api/times');
        times = await timesResponse.json();
        
        // Загружаем подтвержденные праки
        const bookingsResponse = await fetch(API_URL + '/api/bookings');
        bookings = await bookingsResponse.json();
        
        renderTimes();
        renderBookings();
        updateMatchCenter();
    } catch (error) {
        console.log('Сервер базы данных не доступен');
        // Если сервер не доступен, показываем сообщение
        const timeBlock = document.getElementById('availableTimeBlock');
        if (timeBlock) {
            timeBlock.innerHTML = '<div class="no-time">СЕРВЕР НЕ ДОСТУПЕН</div>';
        }
    }
}

// Отрисовка доступного времени (ТОЛЬКО ИЗ БАЗЫ)
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    // Время которое еще не забронировали
    const freeTimes = times.filter(t => !bookings.some(b => b.time === t));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        return;
    }
    
    let html = '';
    freeTimes.forEach(t => {
        html += `<button class="time-slot ${selectedTime === t ? 'selected' : ''}" 
                       onclick="selectTime('${t}')">${t}</button>`;
    });
    
    block.innerHTML = html;
}

// Отрисовка подтвержденных праков
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

// Обновление матч центра
function updateMatchCenter() {
    const opponent = document.getElementById('matchOpponent');
    const timer = document.getElementById('matchTimer');
    
    if (bookings.length > 0) {
        opponent.textContent = bookings[0].team;
        
        // Обновляем таймер если нужно
        const [hours, minutes] = bookings[0].time.split(':').map(Number);
        const now = new Date();
        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);
        
        if (now > matchDate) {
            matchDate.setDate(matchDate.getDate() + 1);
        }
        
        const diff = matchDate - now;
        if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            timer.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
    }
}

// Выбор времени
window.selectTime = function(time) {
    selectedTime = time;
    renderTimes();
};

// ===== НОВАЯ СИСТЕМА КАРТ (КРУПНЫЕ КНОПКИ) =====
const mapItems = document.querySelectorAll('.map-item');
let selectedMaps = [];

mapItems.forEach(item => {
    item.addEventListener('click', function() {
        const mapName = this.dataset.map;
        
        if (this.classList.contains('selected')) {
            // Убираем выделение
            this.classList.remove('selected');
            selectedMaps = selectedMaps.filter(m => m !== mapName);
        } else {
            // Проверяем лимит
            if (selectedMaps.length >= 3) {
                alert('❌ Можно выбрать не более 3 карт');
                return;
            }
            // Добавляем выделение
            this.classList.add('selected');
            selectedMaps.push(mapName);
        }
    });
});

// ===== ОТПРАВКА ЗАЯВКИ =====
window.submitPractice = function() {
    if (!selectedTime) {
        alert('❌ Выберите время для прака');
        return;
    }
    
    const team = document.getElementById('teamName').value.trim();
    const captainNick = document.getElementById('captainNick').value.trim();
    const captainId = document.getElementById('captainId').value.trim();
    const captainTag = document.getElementById('captainTag').value.trim();
    const roster = document.getElementById('roster').value.trim();
    
    if (!team || !captainNick || !captainId || !captainTag || !roster) {
        alert('❌ Заполните все поля');
        return;
    }
    
    if (selectedMaps.length === 0) {
        alert('❌ Выберите хотя бы одну карту');
        return;
    }
    
    const bookingData = {
        time: selectedTime,
        team: team,
        captainNick: captainNick,
        captainId: captainId,
        captainTag: captainTag,
        maps: selectedMaps,
        roster: roster
    };
    
    // Отправка на сервер
    fetch(API_URL + '/new_booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    })
    .then(response => response.json())
    .then(() => {
        alert('✅ Заявка отправлена! Ожидайте подтверждения администратора.');
        
        // Очистка формы
        document.getElementById('teamName').value = '';
        document.getElementById('captainNick').value = '';
        document.getElementById('captainId').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('roster').value = '';
        
        // Сброс карт
        mapItems.forEach(item => item.classList.remove('selected'));
        selectedMaps = [];
        selectedTime = '';
        
        // Обновляем данные
        loadData();
        renderTimes();
    })
    .catch(() => {
        alert('❌ Ошибка отправки. Сервер не доступен.');
    });
};

// ===== ДАННЫЕ ДЛЯ СОСТАВА (С KPR) =====
const rosterData = [
    { 
        nick: 'Eclipse', 
        id: '159742523', 
        kd: '1.87', 
        pracs: '12', 
        hours: '645',
        kpr: '0.85'
    },
    { 
        nick: 'Paradox', 
        id: '78443609', 
        kd: '1.36', 
        pracs: '6', 
        hours: '893',
        kpr: '0.72'
    },
    { 
        nick: 'Blast', 
        id: '228967585', 
        kd: '1.60', 
        pracs: '11', 
        hours: '578',
        kpr: '0.71'
    },
    { 
        nick: 'Entry', 
        id: '165878779', 
        kd: '2.02', 
        pracs: '2', 
        hours: '254',
        kpr: '0.92'
    },
    { 
        nick: 'elesy', 
        id: '18587432', 
        kd: '1.11', 
        pracs: '5', 
        hours: '1127',
        kpr: '0.63'
    }
];

const rosterContainer = document.getElementById('rosterContainer');
rosterContainer.innerHTML = '';

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

// Запускаем загрузку данных
loadData();
setInterval(loadData, 3000);

// ===== АНИМАЦИЯ ПОЯВЛЕНИЯ =====
const observerOptions = { threshold: 0.1 };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
        }
    });
});

document.querySelectorAll('.player-card, .practice-card, .confirmed-card, .about-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px) scale(0.95)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});