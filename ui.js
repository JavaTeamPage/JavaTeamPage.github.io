// ==================== ДАННЫЕ ====================
let times = [];
let bookings = [];
let history = [];
let selectedTime = '';
let timerInterval = null;

// ==================== ЗАГРУЗКА ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('[✅] Сайт загружен');
    
    setupNavigation();
    setupMobileMenu();
    
    // Первая загрузка
    loadData();
    
    // Обновление КАЖДУЮ СЕКУНДУ
    setInterval(loadData, 1000);
    
    // Кнопка отправки
    const submitBtn = document.querySelector('.btn-blue');
    if (submitBtn) {
        submitBtn.onclick = function(e) {
            e.preventDefault();
            submitPractice();
            return false;
        };
    }
    
    // Ограничение на карты (максимум 3)
    document.querySelectorAll('.map-item input').forEach(cb => {
        cb.addEventListener('change', function() {
            let checked = document.querySelectorAll('.map-item input:checked').length;
            if (checked > 3) {
                this.checked = false;
                alert('❌ Можно выбрать только 3 карты');
            }
        });
    });
});

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadData() {
    // Доступное время
    fetch('http://localhost:8000/api/times')
        .then(response => response.json())
        .then(data => {
            times = data;
            renderTimes();
        })
        .catch(error => {
            console.log('[❌] Ошибка загрузки времени:', error);
        });
    
    // Забронированные праки
    fetch('http://localhost:8000/api/bookings')
        .then(response => response.json())
        .then(data => {
            bookings = data;
            renderBookings();
            updateMatchCenter();
        })
        .catch(error => {
            console.log('[❌] Ошибка загрузки праков:', error);
        });
    
    // История
    fetch('http://localhost:8000/api/history')
        .then(response => response.json())
        .then(data => {
            history = data;
            renderHistory();
        })
        .catch(error => {
            console.log('[❌] Ошибка загрузки истории:', error);
        });
}

// ==================== ОТРИСОВКА ВРЕМЕНИ ====================
function renderTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    // Свободное время (которое еще не забронировали)
    const freeTimes = times.filter(t => !bookings.some(b => b.time === t));
    
    if (freeTimes.length === 0) {
        block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        return;
    }
    
    let html = '<div class="time-selector"><span class="time-label">ДОСТУПНОЕ ВРЕМЯ:</span>';
    
    freeTimes.forEach(t => {
        html += `<button class="time-btn ${selectedTime === t ? 'selected' : ''}" 
                       onclick="selectTime('${t}')">${t}</button>`;
    });
    
    block.innerHTML = html + '</div>';
}

// ==================== ВЫБОР ВРЕМЕНИ ====================
function selectTime(t) {
    selectedTime = t;
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.textContent === t) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    alert(`✅ Выбрано время: ${t}`);
}

// ==================== ОТПРАВКА ЗАЯВКИ ====================
function submitPractice() {
    if (!selectedTime) {
        alert('❌ Выберите время');
        return;
    }
    
    const team = document.getElementById('teamName').value;
    const captain = document.getElementById('captainTag').value;
    const captainId = document.getElementById('captainId').value;
    const roster = document.getElementById('rosterPlayers').value;
    
    const maps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        maps.push(cb.value);
    });
    
    if (!team) {
        alert('❌ Введите название команды');
        return;
    }
    
    if (!captain || !captainId) {
        alert('❌ Заполните контакты капитана');
        return;
    }
    
    if (maps.length === 0) {
        alert('❌ Выберите хотя бы одну карту');
        return;
    }
    
    const data = {
        time: selectedTime,
        team: team,
        captain: captain,
        captainId: captainId,
        maps: maps,
        roster: roster
    };
    
    console.log('[📤] Отправка:', data);
    
    fetch('http://localhost:8000/new_booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(() => {
        alert('✅ Заявка отправлена!');
        
        // Очистка формы
        document.getElementById('teamName').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('captainId').value = '';
        document.getElementById('rosterPlayers').value = '';
        document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
        
        selectedTime = '';
        
        // Мгновенное обновление
        loadData();
    })
    .catch(error => {
        console.error('[❌] Ошибка:', error);
        alert('❌ Ошибка отправки');
    });
}

// ==================== ОТРИСОВКА ЗАБРОНИРОВАННЫХ ПРАКОВ ====================
function renderBookings() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (bookings.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет забронированных праков</div>';
        return;
    }
    
    list.innerHTML = bookings.map(b => `
        <div class="practice-item confirmed">
            <div class="practice-time">${b.time}</div>
            <div class="practice-teams">JAVATEAM vs ${b.team}</div>
            <div class="practice-status confirmed">ПОДТВЕРЖДЕН</div>
        </div>
    `).join('');
}

// ==================== ОТРИСОВКА ИСТОРИИ ====================
function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (history.length === 0) {
        list.innerHTML = '<div class="empty-state">История матчей пуста</div>';
        return;
    }
    
    list.innerHTML = history.map(h => `
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
    const matchOpponent = document.getElementById('matchOpponent');
    const matchTimer = document.getElementById('matchTimer');
    const matchStatus = document.getElementById('matchStatus');
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (bookings.length === 0) {
        matchOpponent.textContent = '—';
        matchTimer.textContent = '';
        matchStatus.textContent = 'НЕТ БЛИЖАЙШИХ МАТЧЕЙ';
        return;
    }
    
    const next = bookings[0];
    matchOpponent.textContent = next.team;
    matchStatus.textContent = 'БЛИЖАЙШИЙ МАТЧ';
    
    startTimer(next.time);
}

function startTimer(matchTime) {
    const timerElement = document.getElementById('matchTimer');
    if (!timerElement) return;
    
    const [hours, minutes] = matchTime.split(':').map(Number);
    
    function update() {
        const now = new Date();
        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);
        
        if (now > matchDate) {
            matchDate.setDate(matchDate.getDate() + 1);
        }
        
        const diff = matchDate - now;
        
        if (diff <= 0) {
            timerElement.textContent = 'МАТЧ ИДЕТ';
            return;
        }
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        timerElement.textContent = h > 0 ? `ДО МАТЧА: ${h}ч ${m}м` : `ДО МАТЧА: ${m}м`;
    }
    
    update();
    timerInterval = setInterval(update, 60000);
}

// ==================== МОБИЛЬНОЕ МЕНЮ ====================
function setupMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (toggle) {
        toggle.addEventListener('click', () => menu.classList.add('active'));
    }
    
    if (close) {
        close.addEventListener('click', () => menu.classList.remove('active'));
    }
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            mobileLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            menu.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            if (targetId) {
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ==================== НАВИГАЦИЯ ====================
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href');
            if (targetId) {
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.scrollToSection = scrollToSection;
window.selectTime = selectTime;
