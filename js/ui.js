// ui.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
console.log('UI.js loading...');

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎮 JAVATEAM Website Initialized');
    
    try {
        initMenu();
        initPrakiBookingSystem();
        initOtherElements();
        initHistory();
        
        await loadData();
        
        console.log('✅ Все инициализировано');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showNotification('Ошибка загрузки сайта', 'error');
    }
});

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    console.log('Loading data...');
    
    try {
        bookings = await db.getBookings();
        console.log('Bookings loaded:', bookings.length);
        updateBookingsDisplay();
        updateTimeSlotsFromBookings();
        
        gamesHistory = await db.getGames();
        console.log('Games loaded:', gamesHistory.length);
        renderGamesTable();
        updateStats();
        updateInfoStats();
        
        showNotification('Данные загружены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        updateBookingsDisplay();
        renderGamesTable();
    }
}

// ===== МЕНЮ =====
function initMenu() {
    const menuButtons = document.querySelectorAll('.menu-btn');
    updateActiveMenuButton('info');
    updatePageIndicator('info');
    
    menuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            openPage(pageId);
        });
    });
    
    document.querySelector('.logo').addEventListener('click', function(e) {
        e.preventDefault();
        openPage('info');
    });
}

function openPage(pageId) {
    if (currentPage === pageId) return;
    
    const currentBlock = document.querySelector('.page-block.active');
    const newBlock = document.getElementById(pageId);
    
    if (currentBlock && newBlock) {
        currentBlock.classList.remove('active');
        currentBlock.style.opacity = '0';
        
        setTimeout(() => {
            newBlock.classList.add('active');
            newBlock.style.opacity = '1';
            updateActiveMenuButton(pageId);
            updatePageIndicator(pageId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (pageId === 'info') updateInfoStats();
            if (pageId === 'praki') updateBookingsDisplay();
            
        }, 300);
    }
    
    currentPage = pageId;
}

function updatePageIndicator(pageId) {
    const indicator = document.querySelector('.page-indicator');
    const buttons = document.querySelectorAll('.menu-btn');
    let buttonIndex = 0;
    
    buttons.forEach((btn, index) => {
        if (btn.getAttribute('data-page') === pageId) {
            buttonIndex = index;
        }
    });
    
    const buttonWidth = 100 / buttons.length;
    const position = buttonIndex * buttonWidth;
    
    if (indicator) {
        indicator.style.width = `${buttonWidth}%`;
        indicator.style.left = `${position}%`;
    }
}

function updateActiveMenuButton(pageId) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
        const icon = btn.querySelector('.menu-icon');
        if (icon) icon.style.color = '';
        
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
            if (icon) icon.style.color = '#ffd700';
        }
    });
}

// ===== БРОНИРОВАНИЕ =====
function initPrakiBookingSystem() {
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
        });
    });
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            const isBooked = this.querySelector('.time-status').classList.contains('booked');
            
            if (isBooked) {
                showNotification(`Время ${time} уже занято`, 'error');
                return;
            }
            
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
                s.querySelector('.time-icon').style.color = '';
            });
            
            this.classList.add('selected');
            this.querySelector('.time-icon').style.color = '#ffd700';
            selectedTimeSlot = time;
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
        });
    });
    
    const submitBtn = document.querySelector('.praki-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (validatePrakiBookingForm()) {
                this.style.transform = 'scale(0.95)';
                createBooking();
                setTimeout(() => this.style.transform = '', 500);
            }
        });
    }
}

function validatePrakiBookingForm() {
    let isValid = true;
    document.querySelectorAll('.form-input[required]').forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            isValid = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    if (!selectedTimeSlot) {
        showNotification('Выберите время', 'error');
        isValid = false;
    }
    
    if (document.querySelectorAll('.map-btn.active').length === 0) {
        showNotification('Выберите карты', 'error');
        isValid = false;
    }
    
    return isValid;
}

async function createBooking() {
    const teamName = document.getElementById('team-name').value.trim();
    const captainName = document.getElementById('captain-name').value.trim();
    const teamRoster = document.getElementById('team-roster').value.trim().split(',').map(p => p.trim());
    const comment = document.getElementById('comment').value.trim();
    
    const selectedMaps = [];
    document.querySelectorAll('.map-btn.active').forEach(btn => {
        selectedMaps.push(btn.querySelector('span').textContent);
    });
    
    const booking = {
        time: selectedTimeSlot,
        teamName: teamName,
        captainName: captainName,
        teamRoster: teamRoster,
        maps: selectedMaps,
        comment: comment
    };
    
    try {
        const result = await db.addBooking(booking);
        bookings.push(result);
        updateBookingsDisplay();
        updateTimeSlotStatus(selectedTimeSlot, 'booked', teamName);
        showNotification(`Бронь ${selectedTimeSlot} для ${teamName} создана!`, 'success');
        resetPrakiForm();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function resetPrakiForm() {
    document.querySelectorAll('.map-btn.active').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-input').forEach(input => {
        input.value = '';
        input.style.borderColor = '';
    });
    selectedTimeSlot = null;
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
        slot.querySelector('.time-icon').style.color = '';
    });
}

function updateTimeSlotStatus(time, status, teamName = '') {
    const timeElement = document.querySelector(`.time-slot[data-time="${time}"]`);
    if (timeElement) {
        const statusElement = timeElement.querySelector('.time-status');
        statusElement.className = 'time-status ' + status;
        
        if (status === 'booked') {
            statusElement.textContent = `Занято: ${teamName}`;
            timeElement.style.opacity = '0.7';
            timeElement.style.cursor = 'not-allowed';
        } else {
            statusElement.textContent = 'Свободно';
            timeElement.style.opacity = '1';
            timeElement.style.cursor = 'pointer';
        }
    }
}

function updateTimeSlotsFromBookings() {
    document.querySelectorAll('.time-slot').forEach(slot => {
        const time = slot.getAttribute('data-time');
        updateTimeSlotStatus(time, 'available');
    });
    
    bookings.forEach(booking => {
        updateTimeSlotStatus(booking.time, 'booked', booking.teamName);
    });
}

function updateBookingsDisplay() {
    const tbody = document.getElementById('bookings-table-body');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (bookings.length === 0) {
        if (noBookingsMessage) noBookingsMessage.style.display = 'block';
        return;
    }
    
    if (noBookingsMessage) noBookingsMessage.style.display = 'none';
    
    const sortedBookings = [...bookings].sort((a, b) => {
        return parseInt(a.time.split(':')[0]) - parseInt(b.time.split(':')[0]);
    });
    
    sortedBookings.forEach(booking => {
        const row = document.createElement('tr');
        const formattedDate = new Date(booking.bookingDate).toLocaleDateString('ru-RU');
        
        row.innerHTML = `
            <td><strong class="booking-time">${booking.time}</strong></td>
            <td><strong>${booking.teamName}</strong></td>
            <td>${booking.captainName}</td>
            <td>${Array.isArray(booking.teamRoster) ? booking.teamRoster.join(', ') : booking.teamRoster}</td>
            <td>${Array.isArray(booking.maps) ? booking.maps.join(', ') : booking.maps}</td>
            <td>${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ===== ИСТОРИЯ =====
function initHistory() {
    renderGamesTable();
    updateStats();
    initFilters();
    initModal();
}

function renderGamesTable() {
    const tbody = document.getElementById('games-table-body');
    const noGamesMessage = document.getElementById('no-games-message');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (gamesHistory.length === 0) {
        if (noGamesMessage) noGamesMessage.style.display = 'block';
        return;
    }
    
    if (noGamesMessage) noGamesMessage.style.display = 'none';
    
    const sortedGames = [...gamesHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedGames.forEach(game => {
        const row = document.createElement('tr');
        const formattedDate = new Date(game.date).toLocaleDateString('ru-RU');
        const resultClass = game.result;
        const resultText = game.result === 'win' ? 'Победа' : game.result === 'loss' ? 'Поражение' : 'Ничья';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="${resultClass}">${resultText} (${game.score})</td>
            <td>${Array.isArray(game.team) ? game.team.join(', ') : game.team}</td>
            <td>${game.comment || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function updateStats() {
    const totalGames = gamesHistory.length;
    const wins = gamesHistory.filter(game => game.result === 'win').length;
    const losses = gamesHistory.filter(game => game.result === 'loss').length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    document.getElementById('total-games').textContent = totalGames;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('win-rate').textContent = `${winRate}%`;
}

function updateInfoStats() {
    const totalGames = gamesHistory.length;
    const wins = gamesHistory.filter(game => game.result === 'win').length;
    
    document.getElementById('info-total-games').textContent = totalGames;
    document.getElementById('info-wins').textContent = wins;
}

function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const dateFilter = document.getElementById('date-filter');
    const resultFilter = document.getElementById('result-filter');
    
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', filterGames);
    if (dateFilter) dateFilter.addEventListener('change', filterGames);
    if (resultFilter) resultFilter.addEventListener('change', filterGames);
}

function filterGames() {
    const dateValue = document.getElementById('date-filter').value;
    const resultValue = document.getElementById('result-filter').value;
    
    let filteredGames = [...gamesHistory];
    
    if (dateValue !== 'all') {
        const now = new Date();
        let startDate;
        
        switch(dateValue) {
            case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
            case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
            case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
        }
        
        filteredGames = filteredGames.filter(game => new Date(game.date) >= startDate);
    }
    
    if (resultValue !== 'all') {
        filteredGames = filteredGames.filter(game => game.result === resultValue);
    }
    
    const tbody = document.getElementById('games-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    filteredGames.forEach(game => {
        const row = document.createElement('tr');
        const formattedDate = new Date(game.date).toLocaleDateString('ru-RU');
        const resultClass = game.result;
        const resultText = game.result === 'win' ? 'Победа' : game.result === 'loss' ? 'Поражение' : 'Ничья';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="${resultClass}">${resultText} (${game.score})</td>
            <td>${Array.isArray(game.team) ? game.team.join(', ') : game.team}</td>
            <td>${game.comment || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function initModal() {
    const modal = document.getElementById('add-game-modal');
    const addGameBtn = document.getElementById('add-game-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-game');
    const form = document.getElementById('add-game-form');
    
    if (!modal) return;
    
    if (addGameBtn) {
        addGameBtn.addEventListener('click', function() {
            modal.classList.add('active');
            document.getElementById('game-date').value = new Date().toISOString().split('T')[0];
        });
    }
    
    function closeModal() {
        modal.classList.remove('active');
        if (form) form.reset();
    }
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const gameData = {
                date: document.getElementById('game-date').value,
                opponent: document.getElementById('opponent').value,
                result: document.getElementById('result').value,
                score: document.getElementById('score').value,
                team: document.getElementById('team').value.split(',').map(name => name.trim()),
                comment: document.getElementById('comment').value
            };
            
            try {
                const result = await db.addGame(gameData);
                gamesHistory.push(result);
                renderGamesTable();
                updateStats();
                updateInfoStats();
                closeModal();
                showNotification('Игра добавлена!', 'success');
            } catch (error) {
                showNotification('Ошибка: ' + error.message, 'error');
            }
        });
    }
}

// ===== ДРУГИЕ ЭЛЕМЕНТЫ =====
function initOtherElements() {
    const joinBtn = document.querySelector('.info-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            openPage('praki');
            showNotification('Забронируйте время для праков', 'info');
        });
    }
    
    document.querySelectorAll('.member-card').forEach(card => {
        card.addEventListener('click', function() {
            const player = this.getAttribute('data-player');
            const playerInfo = {
                'v3k': 'V3k - Капитан команды',
                'paradox': 'Paradox - Люркер',
                'maybe': 'Maybe? - Снайпер',
                'blast': 'Blast - Рифлер',
                'snowy': 'Snowy - Опенфрагер',
                'pastic': 'Pastic - Тренер',
                'exlusev': 'exluseV - Рекрут'
            }[player] || 'Игрок JAVATEAM';
            showNotification(playerInfo, 'info');
        });
    });
    
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                window.open(href, '_blank');
            } else {
                e.preventDefault();
                showNotification('Ссылка недоступна', 'info');
            }
        });
    });
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    let icon = 'fa-info-circle';
    let color = '#ffd700';
    
    switch(type) {
        case 'success': icon = 'fa-check-circle'; color = '#00ff88'; break;
        case 'error': icon = 'fa-times-circle'; color = '#ff4757'; break;
        case 'info': icon = 'fa-info-circle'; color = '#0099ff'; break;
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(20, 20, 20, 0.95);
        border: 1px solid ${color};
        border-radius: 10px;
        padding: 15px 20px;
        color: ${color};
        font-family: "Exo 2", sans-serif;
        font-size: 14px;
        max-width: 350px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        backdrop-filter: blur(10px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// ===== ЭКСПОРТ =====
window.openPage = openPage;
window.showNotification = showNotification;

console.log('%c JAVATEAM - STANDOFF 2 ESPORTS TEAM', 'background: linear-gradient(90deg, #ffd700, #9d00ff); color: #000; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;');
console.log('%c Добро пожаловать на наш сайт!', 'color: #ffd700; font-size: 14px;');