// Данные
let practices = [];
let historyMatches = [];

// Загрузка страницы
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupMobileMenu();
    loadData();
    setTodayDate();
    activateSection('home');
    
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

// Загрузка данных
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
}

// Сохранение данных
function saveData() {
    localStorage.setItem('javateam_practices', JSON.stringify(practices));
    localStorage.setItem('javateam_history', JSON.stringify(historyMatches));
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

// Дата
function setTodayDate() {
    const today = new Date();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const dateElement = document.getElementById('todayDate');
    if (dateElement) {
        dateElement.innerHTML = `Сегодня • ${today.getDate()} ${months[today.getMonth()]}`;
    }
}

// Отправка заявки
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
    
    const newPractice = {
        id: Date.now(),
        time: time.value,
        team: team.value.toUpperCase(),
        status: 'pending'
    };
    
    practices.push(newPractice);
    saveData();
    renderPractices();
    clearForm();
    showNotification('✅ Заявка отправлена!', 'success');
    
    // Прокрутка к списку заявок
    setTimeout(() => {
        document.getElementById('practiceList').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
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

// Отрисовка праков
function renderPractices() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    if (practices.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет активных заявок</div>';
        return;
    }
    
    list.innerHTML = practices.slice(-5).reverse().map(p => `
        <div class="practice-item ${p.status}">
            <div class="practice-time">${p.time}</div>
            <div class="practice-teams">JAVATEAM vs ${p.team}</div>
            <div class="practice-status ${p.status}">${p.status === 'pending' ? 'PENDING' : 'CONFIRMED'}</div>
        </div>
    `).join('');
}

// Отрисовка истории
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

// Глобальные функции
window.scrollToSection = scrollToSection;
window.submitPractice = submitPractice;