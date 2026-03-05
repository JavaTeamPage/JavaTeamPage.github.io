// Данные (пустые, ТЫ будешь добавлять через админку)
let practices = [];
let historyMatches = [];
let timerInterval = null;

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

// Загрузка данных (только то, что ТЫ добавил)
function loadData() {
    const savedPractices = localStorage.getItem('javateam_practices');
    if (savedPractices) {
        practices = JSON.parse(savedPractices);
    }
    
    const savedHistory = localStorage.getItem('javateam_history');
    if (savedHistory) {
        historyMatches = JSON.parse(savedHistory);
    }
    
    renderPractices();
    renderHistory();
    updateMatchCenter();
}

// Сохранение данных (когда ТЫ добавляешь через админку)
function saveData() {
    localStorage.setItem('javateam_practices', JSON.stringify(practices));
    localStorage.setItem('javateam_history', JSON.stringify(historyMatches));
    updateMatchCenter(); // Обновляем матч центр при изменении
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

// Отправка заявки (игроки подают заявки)
function submitPractice() {
    const time = document.getElementById('practiceTime');
    const team = document.getElementById('teamName');
    const captainTag = document.getElementById('captainTag');
    const captainId = document.getElementById('captainId');
    const roster = document.getElementById('rosterPlayers');
    
    if (!time || !team || !captainTag || !captainId || !roster) {
        showNotification('❌ Ошибка формы', 'error');
        return;
    }
    
    const selectedMaps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        selectedMaps.push(cb.value);
    });
    
    if (!time.value) {
        showNotification('❌ Выберите время', 'error');
        return;
    }
    
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
    
    // Заявка отправляется (ТЫ увидишь ее в админке)
    showNotification('✅ Заявка отправлена! Ожидайте подтверждения.', 'success');
    clearForm();
    
    // Здесь будет отправка на твой Python сервер
    console.log('📤 Новая заявка:', {
        time: time.value,
        team: team.value,
        captain: captainTag.value,
        maps: selectedMaps,
        roster: players
    });
}

// Очистка формы
function clearForm() {
    document.getElementById('practiceTime').value = '';
    document.getElementById('teamName').value = '';
    document.getElementById('captainTag').value = '';
    document.getElementById('captainId').value = '';
    document.getElementById('rosterPlayers').value = '';
    document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
}

// Отрисовка праков (только те, что ТЫ добавил)
function renderPractices() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (practices.length === 0) {
        list.innerHTML = '<div class="empty-state">Сегодня праков нет</div>';
        return;
    }
    
    list.innerHTML = practices.map(p => `
        <div class="practice-item confirmed">
            <div class="practice-time">${p.time}</div>
            <div class="practice-teams">JAVATEAM vs ${p.team}</div>
            <div class="practice-status confirmed">ПОДТВЕРЖДЕН</div>
        </div>
    `).join('');
}

// Отрисовка истории (только те игры, что ТЫ добавил)
function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    if (historyMatches.length === 0) {
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
    
    // Получаем ближайший подтвержденный прак
    const confirmedPractices = practices.filter(p => p.status === 'confirmed');
    
    if (confirmedPractices.length === 0) {
        // Нет праков
        matchOpponent.textContent = '—';
        matchTimer.textContent = '';
        matchStatus.textContent = 'НЕТ БЛИЖАЙШИХ МАТЧЕЙ';
        return;
    }
    
    // Берем первый (самый ранний)
    const nextPractice = confirmedPractices[0];
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