// ui.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
console.log('🎮 JAVATEAM UI Initializing...');

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 JAVATEAM Website Started');
    
    try {
        // Показываем админ панель
        showAdminPanel();
        
        // Инициализация
        initMenu();
        initPrakiBookingSystem();
        initOtherElements();
        initHistory();
        
        // Загружаем данные
        await loadData();
        
        console.log('✅ Все системы запущены');
        
    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        showNotification('Ошибка загрузки сайта', 'error');
    }
});

// ===== ПОКАЗАТЬ АДМИН ПАНЕЛЬ =====
function showAdminPanel() {
    // Находим или создаем кнопку админа
    let adminBtn = document.querySelector('.admin-panel-btn');
    
    if (!adminBtn) {
        // Создаем кнопку админа
        const menu = document.querySelector('.menu');
        if (menu) {
            adminBtn = document.createElement('button');
            adminBtn.className = 'menu-btn admin-panel-btn';
            adminBtn.setAttribute('data-page', 'admin');
            adminBtn.innerHTML = `
                <div class="menu-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <span>АДМИН</span>
            `;
            menu.appendChild(adminBtn);
            
            // Добавляем обработчик
            adminBtn.addEventListener('click', function() {
                openPage('admin');
            });
        }
    }
    
    // Показываем кнопку
    if (adminBtn) {
        adminBtn.style.display = 'flex';
    }
    
    // Создаем страницу админа если её нет
    createAdminPage();
}

// ===== СОЗДАТЬ СТРАНИЦУ АДМИНА =====
function createAdminPage() {
    if (document.getElementById('admin')) return;
    
    const adminHTML = `
    <section class="page-block" id="admin">
        <div class="admin-container">
            <div class="section-header">
                <div class="section-title-wrapper">
                    <div class="section-title-bg">АДМИН</div>
                    <h2 class="section-title">ПАНЕЛЬ УПРАВЛЕНИЯ</h2>
                </div>
                <div class="section-subtitle">Управление бронированиями и играми</div>
                <div class="section-line"></div>
            </div>

            <div class="admin-panel">
                <!-- СТАТИСТИКА -->
                <div class="admin-section">
                    <h3><i class="fas fa-chart-bar"></i> СТАТИСТИКА</h3>
                    <div class="admin-stats">
                        <div class="admin-stat">
                            <div class="stat-label">Сегодняшних броней</div>
                            <div class="stat-value" id="admin-today-bookings">0</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-label">Всего игр</div>
                            <div class="stat-value" id="admin-total-games">0</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-label">В localStorage</div>
                            <div class="stat-value" id="admin-local-bookings">0</div>
                        </div>
                    </div>
                </div>

                <!-- СИНХРОНИЗАЦИЯ -->
                <div class="admin-section">
                    <h3><i class="fas fa-sync-alt"></i> СИНХРОНИЗАЦИЯ</h3>
                    <div class="admin-actions">
                        <button class="admin-btn" id="sync-btn">
                            <i class="fas fa-sync"></i>
                            Синхронизировать брони
                        </button>
                        <button class="admin-btn" id="refresh-btn">
                            <i class="fas fa-redo"></i>
                            Обновить данные
                        </button>
                    </div>
                </div>

                <!-- УПРАВЛЕНИЕ -->
                <div class="admin-section">
                    <h3><i class="fas fa-tools"></i> УПРАВЛЕНИЕ</h3>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="openPage('praki')">
                            <i class="fas fa-plus"></i>
                            Добавить бронь
                        </button>
                        <button class="admin-btn" onclick="openPage('history')">
                            <i class="fas fa-gamepad"></i>
                            К истории игр
                        </button>
                        <button class="admin-btn danger-btn" id="reset-btn">
                            <i class="fas fa-trash"></i>
                            Сбросить сегодня
                        </button>
                    </div>
                </div>

                <!-- ЭКСПОРТ -->
                <div class="admin-section">
                    <h3><i class="fas fa-download"></i> ЭКСПОРТ</h3>
                    <div class="admin-actions">
                        <button class="admin-btn" id="export-btn">
                            <i class="fas fa-file-export"></i>
                            Экспорт данных
                        </button>
                        <button class="admin-btn" id="view-local-btn">
                            <i class="fas fa-database"></i>
                            Просмотр localStorage
                        </button>
                    </div>
                </div>

                <!-- ИНФОРМАЦИЯ -->
                <div class="admin-section">
                    <h3><i class="fas fa-info-circle"></i> ИНФОРМАЦИЯ</h3>
                    <div class="admin-info">
                        <p><strong>Текущая проблема:</strong> Брони сохраняются только в localStorage браузера.</p>
                        <p><strong>Решение:</strong> Админ должен вручную синхронизировать данные между пользователями.</p>
                        <p><strong>Инструкция:</strong></p>
                        <ol>
                            <li>Игрок создает бронь → сохраняется в ЕГО браузере</li>
                            <li>Игрок сообщает ID брони админу</li>
                            <li>Админ добавляет бронь через панель</li>
                            <li>Все видят обновленные данные</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
    
    // Добавляем в page-content
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.insertAdjacentHTML('beforeend', adminHTML);
        
        // Инициализируем кнопки админа
        setTimeout(initAdminButtons, 100);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ КНОПОК АДМИНА =====
function initAdminButtons() {
    // Синхронизация
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const result = await db.syncLocalWithGitHub();
            showNotification(result.message, 'success');
        });
    }
    
    // Обновить данные
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadData();
            showNotification('Данные обновлены', 'success');
        });
    }
    
    // Сбросить сегодня
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const result = await db.adminResetBookings();
            if (result.success) {
                await loadData();
                showNotification('Сегодняшние брони сброшены', 'success');
            }
        });
    }
    
    // Экспорт
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await db.adminExportData();
            showNotification('Данные экспортированы', 'success');
        });
    }
    
    // Просмотр localStorage
    const viewLocalBtn = document.getElementById('view-local-btn');
    if (viewLocalBtn) {
        viewLocalBtn.addEventListener('click', () => {
            const localBookings = db.getFromLocalStorage();
            const today = new Date().toISOString().split('T')[0];
            
            let message = `📋 Брони в localStorage (${today}):\n\n`;
            
            if (localBookings.length === 0) {
                message += 'Нет броней в localStorage';
            } else {
                localBookings.forEach((b, i) => {
                    message += `${i+1}. ${b.teamName} - ${b.time} (ID: ${b.id})\n`;
                });
                message += `\nВсего: ${localBookings.length} броней`;
            }
            
            alert(message);
        });
    }
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    console.log('📥 Loading data...');
    showNotification('Загрузка данных...', 'info');
    
    try {
        // Загружаем брони с GitHub
        bookings = await db.getBookings();
        console.log('📅 Bookings from GitHub:', bookings.length);
        
        // Загружаем брони из localStorage (временные)
        const localBookings = db.getFromLocalStorage();
        console.log('💾 Local bookings:', localBookings.length);
        
        // Объединяем (убираем дубликаты)
        const allBookings = [...bookings];
        localBookings.forEach(local => {
            if (!allBookings.some(g => g.id === local.id)) {
                allBookings.push({...local, isLocal: true});
            }
        });
        
        bookings = allBookings;
        updateBookingsDisplay();
        updateTimeSlotsFromBookings();
        
        // Загружаем историю игр
        gamesHistory = await db.getGames();
        console.log('🎮 Games history:', gamesHistory.length);
        renderGamesTable();
        updateStats();
        updateInfoStats();
        
        // Обновляем админ статистику
        updateAdminStats();
        
        showNotification('✅ Данные загружены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        updateBookingsDisplay();
        renderGamesTable();
    }
}

// ===== ОБНОВИТЬ СТАТИСТИКУ АДМИНА =====
function updateAdminStats() {
    // Сегодняшние брони
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.bookingDate === today);
    const adminTodayBookings = document.getElementById('admin-today-bookings');
    if (adminTodayBookings) adminTodayBookings.textContent = todayBookings.length;
    
    // Всего игр
    const adminTotalGames = document.getElementById('admin-total-games');
    if (adminTotalGames) adminTotalGames.textContent = gamesHistory.length;
    
    // LocalStorage
    const localBookings = db.getFromLocalStorage();
    const adminLocalBookings = document.getElementById('admin-local-bookings');
    if (adminLocalBookings) adminLocalBookings.textContent = localBookings.length;
}

// ===== МЕНЮ И ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ =====
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
    
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            openPage('info');
        });
    }
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
            if (pageId === 'admin') updateAdminStats();
            
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
                showNotification(`Время ${time} уже занято!`, 'error');
                return;
            }
            
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
                const timeIcon = s.querySelector('.time-icon');
                if (timeIcon) timeIcon.style.color = '';
            });
            
            this.classList.add('selected');
            const timeIcon = this.querySelector('.time-icon');
            if (timeIcon) timeIcon.style.color = '#ffd700';
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
    const requiredInputs = document.querySelectorAll('.form-input[required]');
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#ff4757';
            isValid = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    if (!selectedTimeSlot) {
        showNotification('Выберите время для бронирования', 'error');
        isValid = false;
    }
    
    const selectedMaps = document.querySelectorAll('.map-btn.active');
    if (selectedMaps.length === 0) {
        showNotification('Выберите хотя бы одну карту', 'error');
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
        const span = btn.querySelector('span');
        if (span) selectedMaps.push(span.textContent);
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
        
        // Добавляем в локальный список
        bookings.push(result);
        
        // Обновляем отображение
        updateBookingsDisplay();
        updateTimeSlotStatus(selectedTimeSlot, 'booked', teamName);
        
        // Обновляем админ статистику
        updateAdminStats();
        
        // Сбрасываем форму
        resetPrakiForm();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function resetPrakiForm() {
    document.querySelectorAll('.map-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.form-input').forEach(input => {
        input.value = '';
        input.style.borderColor = '';
    });
    
    selectedTimeSlot = null;
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
        const timeIcon = slot.querySelector('.time-icon');
        if (timeIcon) timeIcon.style.color = '';
    });
}

function updateTimeSlotStatus(time, status, teamName = '') {
    const timeElement = document.querySelector(`.time-slot[data-time="${time}"]`);
    if (timeElement) {
        const statusElement = timeElement.querySelector('.time-status');
        if (statusElement) {
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
}

function updateTimeSlotsFromBookings() {
    document.querySelectorAll('.time-slot').forEach(slot => {
        const time = slot.getAttribute('data-time');
        updateTimeSlotStatus(time, 'available');
    });
    
    const today = new Date().toISOString().split('T')[0];
    bookings.forEach(booking => {
        if (booking.bookingDate === today) {
            updateTimeSlotStatus(booking.time, 'booked', booking.teamName);
        }
    });
}

function updateBookingsDisplay() {
    const tbody = document.getElementById('bookings-table-body');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.bookingDate === today);
    
    if (todayBookings.length === 0) {
        if (noBookingsMessage) noBookingsMessage.style.display = 'block';
        return;
    }
    
    if (noBookingsMessage) noBookingsMessage.style.display = 'none';
    
    const sortedBookings = todayBookings.sort((a, b) => {
        return parseInt(a.time.split(':')[0]) - parseInt(b.time.split(':')[0]);
    });
    
    sortedBookings.forEach(booking => {
        const row = document.createElement('tr');
        const formattedDate = new Date(booking.bookingDate).toLocaleDateString('ru-RU');
        const isLocal = booking.isLocal ? ' ⚠️ (локально)' : '';
        
        row.innerHTML = `
            <td><strong class="booking-time">${booking.time}</strong></td>
            <td><strong>${booking.teamName}${isLocal}</strong></td>
            <td>${booking.captainName}</td>
            <td>${Array.isArray(booking.teamRoster) ? booking.teamRoster.join(', ') : booking.teamRoster}</td>
            <td>${Array.isArray(booking.maps) ? booking.maps.join(', ') : booking.maps}</td>
            <td>${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ===== ИСТОРИЯ ИГР =====
function initHistory() {
    renderGamesTable();
    updateStats();
    initFilters();
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
            <td class="${resultClass}">${resultText} (${game.score || ''})</td>
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
    
    const totalGamesEl = document.getElementById('total-games');
    const winsEl = document.getElementById('wins');
    const lossesEl = document.getElementById('losses');
    const winRateEl = document.getElementById('win-rate');
    
    if (totalGamesEl) totalGamesEl.textContent = totalGames;
    if (winsEl) winsEl.textContent = wins;
    if (lossesEl) lossesEl.textContent = losses;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
}

function updateInfoStats() {
    const totalGames = gamesHistory.length;
    const wins = gamesHistory.filter(game => game.result === 'win').length;
    
    const totalGamesEl = document.getElementById('info-total-games');
    const winsEl = document.getElementById('info-wins');
    
    if (totalGamesEl) {
        animateCounter(totalGamesEl, 0, totalGames, 1000);
    }
    if (winsEl) {
        animateCounter(winsEl, 0, wins, 1000);
    }
}

function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
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
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
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
        const resultText = game.result === 'win' ? 'Победа' : 
                          game.result === 'loss' ? 'Поражение' : 'Ничья';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="${resultClass}">${resultText} (${game.score || ''})</td>
            <td>${Array.isArray(game.team) ? game.team.join(', ') : game.team}</td>
            <td>${game.comment || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ ДРУГИХ ЭЛЕМЕНТОВ =====
function initOtherElements() {
    // Кнопка присоединения на главной
    const joinBtn = document.querySelector('.info-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            openPage('praki');
        });
    }
    
    // Статистика членов команды
    initMemberCards();
}

function initMemberCards() {
    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
        
        card.addEventListener('click', function() {
            const player = this.getAttribute('data-player');
            showNotification(`Игрок: ${player}`, 'info');
        });
    });
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Кнопка закрытия
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Автоматическое закрытие
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ===== CSS для уведомлений =====
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--dark-color);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
            border-left: 4px solid #00ff88;
            max-width: 400px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left-color: #00ff88;
        }
        
        .notification.error {
            border-left-color: #ff4757;
        }
        
        .notification.info {
            border-left-color: #0099ff;
        }
        
        .notification i.fa-check-circle {
            color: #00ff88;
        }
        
        .notification i.fa-exclamation-circle {
            color: #ff4757;
        }
        
        .notification i.fa-info-circle {
            color: #0099ff;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            margin-left: auto;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Добавляем стили при загрузке
addNotificationStyles();

// ===== АНИМАЦИЯ СЧЕТЧИКОВ =====
function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 1000;
                let start = 0;
                
                const updateCounter = () => {
                    const increment = target / (duration / 16);
                    start += increment;
                    
                    if (start < target) {
                        counter.textContent = Math.floor(start);
                        setTimeout(updateCounter, 16);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    });
    
    document.querySelectorAll('.stat-number').forEach(counter => {
        observer.observe(counter);
    });
}

// ===== РЕСИВЕР ДЛЯ ВНЕШНИХ СООБЩЕНИЙ =====
window.addEventListener('message', function(event) {
    if (event.data.type === 'refreshData') {
        loadData();
        showNotification('Данные обновлены', 'success');
    }
});

console.log('✅ JAVATEAM UI Ready!');
