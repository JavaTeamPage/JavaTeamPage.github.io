// Данные
let practices = [];

// Загрузка страницы
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupMobileMenu();
    renderPractices();
    setTodayDate();
    
    // Активируем первую секцию
    activateSection('home');
    
    // Загружаем сохраненные заявки
    loadPractices();
});

// Мобильное меню
function setupMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            menu.classList.add('active');
        });
    }
    
    if (close) {
        close.addEventListener('click', () => {
            menu.classList.remove('active');
        });
    }
    
    // Закрытие меню при клике на ссылку
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            mobileLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            menu.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            activateSection(targetId.substring(1));
        });
    });
}

// Десктопная навигация
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            activateSection(targetId.substring(1));
        });
    });
}

// Активация секции
function activateSection(sectionId) {
    const desktopLinks = document.querySelectorAll('.nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    desktopLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        link.classList.toggle('active', href === sectionId);
    });
    
    mobileLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        link.classList.toggle('active', href === sectionId);
    });
}

// Скролл к секции
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        activateSection(id);
    }
}

// Установка сегодняшней даты
function setTodayDate() {
    const today = new Date();
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const dateStr = `${today.getDate()} ${months[today.getMonth()]}`;
    const descElement = document.getElementById('todayDate');
    if (descElement) {
        descElement.innerHTML = `Сегодня • ${dateStr} • Доступные слоты`;
    }
}

// Загрузка праков из localStorage
function loadPractices() {
    const saved = localStorage.getItem('javateam_practices');
    if (saved) {
        practices = JSON.parse(saved);
        renderPractices();
    }
}

// Сохранение праков
function savePractices() {
    localStorage.setItem('javateam_practices', JSON.stringify(practices));
}

// Отправка заявки
function submitPractice() {
    // Собираем данные
    const time = document.getElementById('practiceTime').value;
    const team = document.getElementById('teamName').value;
    const captainTag = document.getElementById('captainTag').value;
    const captainId = document.getElementById('captainId').value;
    const roster = document.getElementById('rosterPlayers').value;
    
    // Собираем выбранные карты
    const selectedMaps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        selectedMaps.push(cb.value);
    });
    
    // Валидация
    if (!time) {
        showNotification('❌ Выберите время!', 'error');
        return;
    }
    
    if (!team) {
        showNotification('❌ Введите название команды!', 'error');
        return;
    }
    
    if (!captainTag || !captainId) {
        showNotification('❌ Заполните контакты капитана!', 'error');
        return;
    }
    
    if (selectedMaps.length === 0) {
        showNotification('❌ Выберите минимум одну карту!', 'error');
        return;
    }
    
    const players = roster.split(',').map(p => p.trim()).filter(p => p);
    if (players.length < 5) {
        showNotification('❌ Укажите минимум 5 игроков!', 'error');
        return;
    }
    
    // Создаем заявку
    const newPractice = {
        id: Date.now(),
        time: time,
        team: team.toUpperCase(),
        captainTag: captainTag,
        captainId: captainId,
        maps: selectedMaps.join(', '),
        roster: players.join(', '),
        status: 'pending',
        date: new Date().toLocaleString()
    };
    
    practices.push(newPractice);
    savePractices();
    renderPractices();
    clearForm();
    
    // Отправляем в админку (если сервер запущен)
    sendToAdmin(newPractice);
    
    showNotification('✅ Заявка отправлена! Ожидайте подтверждения.', 'success');
}

// Отправка в админку
function sendToAdmin(data) {
    // Здесь будет отправка на Python сервер
    console.log('📤 Отправка в админку:', data);
    
    // Пока просто сохраняем локально
    let pendingRequests = JSON.parse(localStorage.getItem('pending_requests') || '[]');
    pendingRequests.push(data);
    localStorage.setItem('pending_requests', JSON.stringify(pendingRequests));
}

// Очистка формы
function clearForm() {
    document.getElementById('practiceTime').value = '';
    document.getElementById('teamName').value = '';
    document.getElementById('captainTag').value = '';
    document.getElementById('captainId').value = '';
    document.getElementById('rosterPlayers').value = '';
    
    document.querySelectorAll('.map-item input:checked').forEach(cb => {
        cb.checked = false;
    });
}

// Отрисовка праков
function renderPractices() {
    const list = document.getElementById('practiceList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (practices.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Нет активных заявок</div>';
        return;
    }
    
    // Показываем только последние 5
    const recent = practices.slice(-5).reverse();
    
    recent.forEach(p => {
        const item = document.createElement('div');
        item.className = `practice-item ${p.status}`;
        item.innerHTML = `
            <div class="practice-time">${p.time}</div>
            <div class="practice-teams">JAVATEAM vs ${p.team}</div>
            <div class="practice-status ${p.status}">${p.status === 'pending' ? 'PENDING' : 'CONFIRMED'}</div>
        `;
        list.appendChild(item);
    });
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
        animation: slideIn 0.3s ease, float 3s ease-in-out infinite;
        border: 1px solid rgba(255,255,255,0.1);
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
/* Пустые состояния */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #888;
    font-size: 14px;
    border: 1px dashed #333;
    border-radius: 12px;
    margin: 20px 0;
}

/* История */
.history-list {
    background: #111;
    border-radius: 16px;
    overflow: hidden;
}

.history-item {
    display: grid;
    grid-template-columns: 80px 1fr 100px 100px;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #1a1a1a;
    transition: 0.3s;
}

.history-item:hover {
    background: #1a1a1a;
    transform: translateX(10px);
}

.history-item:last-child {
    border-bottom: none;
}

.history-item.win {
    border-left: 3px solid #0066ff;
}

.history-item.loss {
    border-left: 3px solid #888;
}

.history-type {
    color: #888;
    font-size: 12px;
}

.history-opponent {
    font-weight: 500;
}

.history-score {
    font-weight: 600;
    color: #0066ff;
}

.history-result {
    font-size: 12px;
    font-weight: 500;
}

.history-item.win .history-result {
    color: #0066ff;
}

.history-item.loss .history-result {
    color: #888;
}

@media (max-width: 768px) {
    .history-item {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
    .history-type {
        grid-column: 1 / -1;
    }
}