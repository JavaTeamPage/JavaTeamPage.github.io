// Данные (все пусто, пока ТЫ не добавишь)
let availableTimes = [];      // Свободное время (ты ставишь)
let bookedPractices = [];     // Забронированные праки
let historyMatches = [];      // История матчей
let timerInterval = null;
let selectedTime = '';

// Загрузка страницы
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupMobileMenu();
    loadData();
    activateSection('home');
    updateMatchCenter();
    
    // Принудительно навешиваем обработчик на кнопку отправки
    const submitBtn = document.querySelector('.btn-blue');
    if (submitBtn) {
        submitBtn.onclick = function(e) {
            e.preventDefault();
            submitPractice();
            return false;
        };
    }
});

// Загрузка данных с сервера
function loadData() {
    // Загружаем доступное время (которое ТЫ выставил в админке)
    fetch('http://localhost:8000/api/available_times')
        .then(response => response.json())
        .then(data => {
            availableTimes = data;
            renderAvailableTimes();
        })
        .catch(error => {
            console.log('Сервер не доступен');
            // Если сервер не работает - показываем что времени нет
            availableTimes = [];
            renderAvailableTimes();
        });
    
    // Загружаем забронированные праки
    fetch('http://localhost:8000/api/booked')
        .then(response => response.json())
        .then(data => {
            bookedPractices = data;
            renderBookedPractices();
            updateMatchCenter();
        })
        .catch(error => {
            console.log('Сервер не доступен');
            bookedPractices = [];
            renderBookedPractices();
        });
    
    // Загружаем историю
    fetch('http://localhost:8000/api/history')
        .then(response => response.json())
        .then(data => {
            historyMatches = data;
            renderHistory();
        })
        .catch(error => {
            console.log('Сервер не доступен');
            historyMatches = [];
            renderHistory();
        });
}

// Отрисовка доступного времени (только то что ТЫ поставил)
function renderAvailableTimes() {
    const block = document.getElementById('availableTimeBlock');
    if (!block) return;
    
    if (!availableTimes || availableTimes.length === 0) {
        block.innerHTML = `
            <div class="no-time">
                <span>СЕГОДНЯ ПРАКОВ НЕТ</span>
            </div>
        `;
        return;
    }
    
    let html = '<div class="time-selector"><span class="time-label">ДОСТУПНОЕ ВРЕМЯ:</span>';
    
    // Показываем только свободное время (которое еще не забронировали)
    availableTimes.forEach(t => {
        const isBooked = bookedPractices.some(b => b.time === t.time);
        if (!isBooked) {
            html += `<button class="time-btn" onclick="selectTime('${t.time}')">${t.time}</button>`;
        }
    });
    
    html += '</div>';
    
    // Если все время забронировали
    if (html === '<div class="time-selector"><span class="time-label">ДОСТУПНОЕ ВРЕМЯ:</span></div>') {
        block.innerHTML = `
            <div class="no-time">
                <span>ВСЕ ВРЕМЯ ЗАБРОНИРОВАНО</span>
            </div>
        `;
    } else {
        block.innerHTML = html;
    }
}

// Выбор времени
function selectTime(time) {
    selectedTime = time;
    
    // Подсвечиваем выбранную кнопку
    document.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.textContent === time) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    showNotification(`✅ Выбрано время: ${time}`, 'success');
}

// Отрисовка забронированных праков
function renderBookedPractices() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (!bookedPractices || bookedPractices.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет забронированных праков</div>';
        return;
    }
    
    list.innerHTML = bookedPractices.map(p => `
        <div class="practice-item confirmed">
            <div class="practice-time">${p.time}</div>
            <div class="practice-teams">JAVATEAM vs ${p.team}</div>
            <div class="practice-status confirmed">ПОДТВЕРЖДЕН</div>
        </div>
    `).join('');
}

// Отрисовка истории
function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (!historyMatches || historyMatches.length === 0) {
        list.innerHTML = '<div class="empty-state">История матчей пуста</div>';
        return;
    }
    
    list.innerHTML = historyMatches.map(m => `
        <div class="history-item ${m.result}">
            <span class="history-type">${m.type || 'ПРАК'}</span>
            <span class="history-opponent">VS ${m.opponent}</span>
            <span class="history-score">${m.score}</span>
            <span class="history-result">${m.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
        </div>
    `).join('');
}

// Отправка заявки (с выбранным временем)
function submitPractice() {
    if (!selectedTime) {
        showNotification('❌ Выберите время из доступных', 'error');
        return;
    }
    
    const team = document.getElementById('teamName');
    const captainTag = document.getElementById('captainTag');
    const captainId = document.getElementById('captainId');
    const roster = document.getElementById('rosterPlayers');
    
    if (!team || !captainTag || !captainId || !roster) {
        showNotification('❌ Ошибка формы', 'error');
        return;
    }
    
    const selectedMaps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        selectedMaps.push(cb.value);
    });
    
    if (!team.value) {
        showNotification('❌ Введите название команды', 'error');
        return;
    }
    
    if (!captainTag.value || !captainId.value) {
        showNotification('❌ Заполните контакты капитана', 'error');
        return;
    }
    
    if (selectedMaps.length === 0) {
        showNotification('❌ Выберите минимум одну карту', 'error');
        return;
    }
    
    const players = roster.value.split(',').map(p => p.trim()).filter(p => p);
    if (players.length < 5) {
        showNotification('❌ Укажите 5 игроков', 'error');
        return;
    }
    
    // Данные для отправки
    const practiceData = {
        time: selectedTime,
        team: team.value,
        captainTag: captainTag.value,
        captainId: captainId.value,
        maps: selectedMaps,
        roster: roster.value
    };
    
    // Отправляем на Python сервер
    fetch('http://localhost:8000/api/new_practice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(practiceData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Ответ сервера:', data);
        showNotification('✅ Заявка отправлена!', 'success');
        clearForm();
        
        // Обновляем данные
        loadData();
    })
    .catch((error) => {
        console.error('❌ Ошибка:', error);
        showNotification('❌ Сервер не доступен', 'error');
    });
}

// Очистка формы
function clearForm() {
    document.getElementById('teamName').value = '';
    document.getElementById('captainTag').value = '';
    document.getElementById('captainId').value = '';
    document.getElementById('rosterPlayers').value = '';
    document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
    
    // Сбрасываем выбранное время
    selectedTime = '';
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// Мобильное меню
function setupMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (toggle) {
        toggle.addEventListener('click', function() {
            menu.classList.add('active');
        });
    }
    
    if (close) {
        close.addEventListener('click', function() {
            menu.classList.remove('active');
        });
    }
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            mobileLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            menu.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            if (targetId) {
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    activateSection(targetId.substring(1));
                }
            }
        });
    });
}

// Навигация
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href');
            if (targetId) {
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    activateSection(targetId.substring(1));
                }
            }
        });
    });
}

function activateSection(sectionId) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const id = href.substring(1);
            if (id === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}

function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        activateSection(id);
    }
}

// ========== МАТЧ ЦЕНТР ==========
function updateMatchCenter() {
    const matchOpponent = document.getElementById('matchOpponent');
    const matchTimer = document.getElementById('matchTimer');
    const matchStatus = document.getElementById('matchStatus');
    
    // Очищаем старый таймер
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (!bookedPractices || bookedPractices.length === 0) {
        matchOpponent.textContent = '—';
        matchTimer.textContent = '';
        matchStatus.textContent = 'НЕТ БЛИЖАЙШИХ МАТЧЕЙ';
        return;
    }
    
    // Берем первый матч
    const nextPractice = bookedPractices[0];
    matchOpponent.textContent = nextPractice.team;
    matchStatus.textContent = 'БЛИЖАЙШИЙ МАТЧ';
    
    // Запускаем таймер
    startMatchTimer(nextPractice.time);
}

function startMatchTimer(matchTime) {
    const timerElement = document.getElementById('matchTimer');
    if (!timerElement) return;
    
    // Парсим время (пример: "19:00")
    const [hours, minutes] = matchTime.split(':').map(Number);
    
    function updateTimer() {
        const now = new Date();
        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);
        
        // Если время матча уже прошло сегодня, ставим на завтра
        if (now > matchDate) {
            matchDate.setDate(matchDate.getDate() + 1);
        }
        
        const diff = matchDate - now;
        
        if (diff <= 0) {
            timerElement.textContent = 'МАТЧ ИДЕТ';
            return;
        }
        
        // Считаем часы и минуты
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursLeft > 0) {
            timerElement.textContent = `ДО МАТЧА: ${hoursLeft}ч ${minutesLeft}м`;
        } else {
            timerElement.textContent = `ДО МАТЧА: ${minutesLeft}м`;
        }
    }
    
    // Обновляем сразу и каждую минуту
    updateTimer();
    timerInterval = setInterval(updateTimer, 60000);
}

// Уведомления
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${type === 'success' ? '#0066ff' : '#333'};
        color: white;
        padding: 18px 25px;
        border-radius: 16px;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Добавляем стили для анимаций уведомлений
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

// Глобальные функции
window.scrollToSection = scrollToSection;
window.submitPractice = submitPractice;
window.selectTime = selectTime;