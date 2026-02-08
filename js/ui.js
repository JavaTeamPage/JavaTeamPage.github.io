// ui.js - ПОЛНАЯ ВЕРСИЯ СО СКРЫТОЙ АДМИНКОЙ
console.log('🎮 JAVATEAM UI Initializing...');

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;
let adminClickCount = 0;
let adminClickTimeout;

// ===== СКРЫТАЯ АДМИН-СИСТЕМА =====
function initHiddenAdmin() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            adminClickCount++;
            console.log(`👑 Admin click: ${adminClickCount}`);
            
            clearTimeout(adminClickTimeout);
            adminClickTimeout = setTimeout(() => {
                adminClickCount = 0;
            }, 2000);
            
            // Если кликнули 3 раза - показываем поле для пароля
            if (adminClickCount === 3) {
                showPasswordInput();
                adminClickCount = 0;
            }
        });
    }
}

function showPasswordInput() {
    // Удаляем старый инпут если есть
    const oldInput = document.querySelector('.admin-password-input');
    if (oldInput) oldInput.remove();
    
    // Создаем инпут для пароля
    const passwordInput = document.createElement('div');
    passwordInput.className = 'admin-password-input';
    passwordInput.innerHTML = `
        <div class="password-container">
            <div class="password-header">
                <i class="fas fa-lock"></i>
                <span>АДМИН ДОСТУП</span>
            </div>
            <input type="password" id="admin-password" placeholder="Введите пароль" autocomplete="off">
            <button id="submit-password">
                <i class="fas fa-key"></i> Войти
            </button>
            <div class="password-hint">Подсказка: Фамилия создателя</div>
        </div>
    `;
    
    document.body.appendChild(passwordInput);
    
    // Показываем анимацию
    setTimeout(() => {
        passwordInput.classList.add('show');
    }, 10);
    
    // Обработчик ввода пароля
    const input = document.getElementById('admin-password');
    const submitBtn = document.getElementById('submit-password');
    
    input.focus();
    
    submitBtn.addEventListener('click', checkAdminPassword);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkAdminPassword();
    });
    
    // Закрытие при клике вне поля
    passwordInput.addEventListener('click', function(e) {
        if (e.target === passwordInput) {
            hidePasswordInput();
        }
    });
}

function checkAdminPassword() {
    const password = document.getElementById('admin-password').value;
    const correctPassword = 'KirillBerezhansky';
    
    if (password === correctPassword) {
        showNotification('✅ Доступ разрешен!', 'success');
        hidePasswordInput();
        // Показываем админ-панель
        showAdminPanel();
        openPage('admin');
    } else {
        showNotification('❌ Неверный пароль!', 'error');
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }
}

function hidePasswordInput() {
    const passwordInput = document.querySelector('.admin-password-input');
    if (passwordInput) {
        passwordInput.classList.remove('show');
        setTimeout(() => {
            passwordInput.remove();
        }, 300);
    }
}

// ===== ПОКАЗАТЬ АДМИН ПАНЕЛЬ =====
function showAdminPanel() {
    // Создаем кнопку админа если её нет
    let adminBtn = document.querySelector('.admin-panel-btn');
    
    if (!adminBtn) {
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
                        <p><strong>Пароль админа:</strong> KirillBerezhansky</p>
                        <p><strong>Текущая проблема:</strong> Брони сохраняются только в localStorage браузера.</p>
                        <p><strong>Решение:</strong> Админ должен вручную синхронизировать данные.</p>
                        <p><strong>Как открыть админку:</strong> Нажать 3 раза на логотип "JavaTeam" вверху</p>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
    
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.insertAdjacentHTML('beforeend', adminHTML);
        setTimeout(initAdminButtons, 100);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ КНОПОК АДМИНА =====
function initAdminButtons() {
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const result = await db.syncLocalWithGitHub();
            showNotification(result.message, 'success');
        });
    }
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadData();
            showNotification('Данные обновлены', 'success');
        });
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('⚠️ Сбросить ВСЕ сегодняшние брони?\n\nЭто действие нельзя отменить!')) {
                const result = await db.adminResetBookings();
                if (result.success) {
                    await loadData();
                    showNotification('Сегодняшние брони сброшены', 'success');
                }
            }
        });
    }
    
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await db.adminExportData();
            showNotification('Данные экспортированы', 'success');
        });
    }
    
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 JAVATEAM Website Started');
    
    try {
        // Инициализация скрытой админки
        initHiddenAdmin();
        
        // Инициализация основных функций
        initMenu();
        initPrakiBookingSystem();
        initOtherElements();
        initHistory();
        
        // Загружаем данные
        await loadData();
        
        // Добавляем CSS для админки
        addAdminStyles();
        
        console.log('✅ Все системы запущены');
        
    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        showNotification('Ошибка загрузки сайта', 'error');
    }
});

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    console.log('📥 Loading data...');
    showNotification('Загрузка данных...', 'info');
    
    try {
        bookings = await db.getBookings();
        console.log('📅 Bookings from GitHub:', bookings.length);
        
        const localBookings = db.getFromLocalStorage();
        console.log('💾 Local bookings:', localBookings.length);
        
        const allBookings = [...bookings];
        localBookings.forEach(local => {
            if (!allBookings.some(g => g.id === local.id)) {
                allBookings.push({...local, isLocal: true});
            }
        });
        
        bookings = allBookings;
        updateBookingsDisplay();
        updateTimeSlotsFromBookings();
        
        gamesHistory = await db.getGames();
        console.log('🎮 Games history:', gamesHistory.length);
        renderGamesTable();
        updateStats();
        updateInfoStats();
        
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
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.bookingDate === today);
    const adminTodayBookings = document.getElementById('admin-today-bookings');
    if (adminTodayBookings) adminTodayBookings.textContent = todayBookings.length;
    
    const adminTotalGames = document.getElementById('admin-total-games');
    if (adminTotalGames) adminTotalGames.textContent = gamesHistory.length;
    
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
        
        bookings.push(result);
        updateBookingsDisplay();
        updateTimeSlotStatus(selectedTimeSlot, 'booked', teamName);
        updateAdminStats();
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
    const joinBtn = document.querySelector('.info-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            openPage('praki');
        });
    }
    
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
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ===== CSS ДЛЯ АДМИНКИ И УВЕДОМЛЕНИЙ =====
function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Скрытая админка */
        .admin-password-input {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .admin-password-input.show {
            opacity: 1;
        }
        
        .password-container {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 2px solid #ffd700;
            text-align: center;
            min-width: 320px;
        }
        
        .password-header {
            color: #ffd700;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-family: 'Orbitron', sans-serif;
        }
        
        #admin-password {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255,255,255,0.1);
            border: 2px solid #0099ff;
            border-radius: 6px;
            color: white;
            font-size: 16px;
            margin-bottom: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        #admin-password:focus {
            outline: none;
            border-color: #00ff88;
            box-shadow: 0 0 15px rgba(0,255,136,0.3);
        }
        
        #submit-password {
            background: linear-gradient(90deg, #0099ff, #00ff88);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            transition: transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        #submit-password:hover {
            transform: scale(1.05);
        }
        
        .password-hint {
            margin-top: 15px;
            color: #888;
            font-size: 12px;
            font-style: italic;
        }
        
        /* Уведомления */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a1a2e;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 9998;
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
        
        .notification i {
            font-size: 20px;
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

console.log('✅ JAVATEAM UI Ready!');
