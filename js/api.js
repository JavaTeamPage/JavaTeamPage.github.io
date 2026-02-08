// ui.js - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🎮 JAVATEAM UI Initializing...');

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;
let selectedMaps = [];

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 JAVATEAM Website Started');
    
    try {
        // Проверяем подключение к Gist
        await checkGistConnection();
        
        // Инициализация
        initMenu();
        initPrakiBookingSystem();
        initOtherElements();
        initHistory();
        initAdminPanel();
        
        // Загружаем данные
        await loadData();
        
        console.log('✅ Все системы запущены');
        
    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        showNotification('Ошибка загрузки сайта', 'error');
    }
});

// ===== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К GIST =====
async function checkGistConnection() {
    console.log('🔍 Проверка подключения к Gist...');
    
    try {
        const data = await db._fetchGistData();
        console.log('✅ Gist подключен:', Object.keys(data));
        
        // Проверяем токен
        if (!db.GITHUB_TOKEN || db.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
            console.warn('⚠️ GitHub Token не настроен! Брони не будут сохраняться для всех.');
            
            // Показываем предупреждение только в админ-панели
            setTimeout(() => {
                if (window.location.hash === '#admin' || currentPage === 'admin') {
                    showNotification('ВНИМАНИЕ АДМИНУ: Установите GitHub Token в github-db.js!', 'error', 10000);
                }
            }, 1000);
        }
    } catch (error) {
        console.warn('⚠️ Gist недоступен, используем локальный режим');
        showNotification('Режим локальных данных. Брони не видны другим пользователям.', 'warning', 5000);
    }
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    console.log('📥 Loading data...');
    showNotification('Загрузка данных...', 'info');
    
    try {
        // Загружаем брони с Gist
        bookings = await db.getBookings();
        console.log('📅 Bookings from DB:', bookings.length);
        
        // Обновляем отображение
        updateBookingsDisplay();
        updateTimeSlotsFromBookings();
        
        // Загружаем историю игр
        gamesHistory = await db.getGames();
        console.log('🎮 Games history:', gamesHistory.length);
        renderGamesTable();
        updateStats();
        updateInfoStats();
        
        // Загружаем состав команды
        loadTeamMembers();
        
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

// ===== ЗАГРУЗКА СОСТАВА КОМАНДЫ =====
function loadTeamMembers() {
    // Основной состав
    const mainGrid = document.querySelector('.members-category:first-child .members-grid');
    const supportGrid = document.querySelector('.members-category:last-child .members-grid');
    
    if (!mainGrid || !supportGrid) return;
    
    // Основной состав
    const mainPlayers = [
        {
            name: 'V3k',
            role: 'КАПИТАН',
            icon: 'crown',
            kd: '1.84',
            hs: '50%',
            hours: '378',
            desc: 'Стратег команды, отвечает за тактические построения и контроль темпа игры.',
            skills: ['Стратегия', 'IGL', 'AWP'],
            img: 'player1.png'
        },
        {
            name: 'Paradox',
            role: 'ЛЮРКЕР',
            icon: 'user-ninja',
            kd: '1.27',
            hs: '50.2%',
            hours: '850',
            desc: 'Мастер скрытных перемещений и неожиданных атак со спины противника.',
            skills: ['Фланги', 'Скрытность', 'Клинер'],
            img: 'player2.png'
        },
        {
            name: 'Maybe?',
            role: 'СНАЙПЕР',
            icon: 'crosshairs',
            kd: '1.84',
            hs: '53.3%',
            hours: '1363',
            desc: 'Снайпер с невероятной точностью. Может выиграть раунд одним удачным выстрелом.',
            skills: ['AWP', 'Хедшоты', 'Опенер'],
            img: 'player3.png'
        },
        {
            name: 'Eclipse',
            role: 'РИФЛЕР',
            icon: 'bomb',
            kd: '1.84',
            hs: '53.5%',
            hours: '565',
            desc: 'Агрессивный рифлер, специалист по входам на сайты и созданию пространства для команды.',
            skills: ['Энтри', 'Агрессия', 'Трейд'],
            img: 'player4.png'
        },
        {
            name: 'k3llmy',
            role: 'ОПЕНФРАГЕР',
            icon: 'running',
            kd: '1.38',
            hs: '41.7%',
            hours: '543',
            desc: 'Быстрый и мобильный игрок, специализируется на открытии фрагов и разведке.',
            skills: ['Скорость', 'Разведка', 'Патруль'],
            img: 'player5.png'
        }
    ];
    
    // Тренер и рекрут
    const supportPlayers = [
        {
            name: 'Pastic',
            role: 'ТРЕНЕР',
            icon: 'chalkboard-teacher',
            kd: '7+',
            hs: '50+',
            hours: '100%',
            desc: 'Опытный тренер с глубоким пониманием игры. Отвечает за тактическую подготовку и анализ соперников.',
            skills: ['Тактика', 'Анализ', 'Психология'],
            img: 'player1.png',
            isCoach: true
        },
        {
            name: 'blast',
            role: 'РЕКРУТ',
            icon: 'seedling',
            kd: '1.56',
            hs: '54.4%',
            hours: '505',
            desc: 'Перспективный игрок с большим потенциалом. Проходит адаптацию к командной игре.',
            skills: ['Потенциал', 'Адаптация', 'Мотивация'],
            img: 'player6.png',
            isRecruit: true
        }
    ];
    
    // Очищаем сетки
    mainGrid.innerHTML = '';
    supportGrid.innerHTML = '';
    
    // Добавляем основной состав
    mainPlayers.forEach(player => {
        mainGrid.innerHTML += createMemberCard(player);
    });
    
    // Добавляем поддержку
    supportPlayers.forEach(player => {
        supportGrid.innerHTML += createMemberCard(player);
    });
    
    // Инициализируем карточки
    initMemberCards();
}

function createMemberCard(player) {
    const rankClass = player.isCoach ? 'coach-card' : player.isRecruit ? 'recruit-card' : '';
    const rankText = player.isCoach ? 'ТРЕНЕР' : player.isRecruit ? 'РЕКРУТ' : player.role;
    
    return `
        <div class="member-card ${rankClass}" data-player="${player.name.toLowerCase()}">
            <div class="member-card-inner">
                <div class="member-image">
                    <img src="image/${player.img}" alt="${player.name}" onerror="this.src='image/default-player.jpg'">
                    <div class="member-rank">${rankText}</div>
                </div>
                <div class="member-info">
                    <div class="member-header">
                        <div class="member-name">${player.name}</div>
                        <div class="member-role">
                            <i class="fas fa-${player.icon}"></i>
                            ${player.role}
                        </div>
                    </div>
                    
                    <div class="member-stats">
                        <div class="stat">
                            <div class="stat-value">${player.kd}</div>
                            <div class="stat-label">${player.role === 'ТРЕНЕР' ? 'Лет опыта' : 'K/D'}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${player.hs}</div>
                            <div class="stat-label">${player.role === 'ТРЕНЕР' ? 'Лучших тактик' : player.role === 'РЕКРУТ' ? 'Хедшоты' : 'Хедшоты'}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${player.hours}</div>
                            <div class="stat-label">${player.role === 'ТРЕНЕР' ? 'Понимание' : 'hour'}</div>
                        </div>
                    </div>
                    
                    <div class="member-desc">${player.desc}</div>
                    
                    <div class="member-skills">
                        ${player.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
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
            if (pageId === 'members') loadTeamMembers();
            
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
    // Карты
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
            
            // Сохраняем выбранные карты
            selectedMaps = Array.from(document.querySelectorAll('.map-btn.active'))
                .map(btn => btn.querySelector('span').textContent);
        });
    });
    
    // Временные слоты
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
    
    // Кнопка отправки
    const submitBtn = document.querySelector('.praki-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (validatePrakiBookingForm()) {
                this.style.transform = 'scale(0.95)';
                await createBooking();
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
    const teamRoster = document.getElementById('team-roster').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
    const selectedMaps = Array.from(document.querySelectorAll('.map-btn.active'))
        .map(btn => btn.querySelector('span').textContent);
    
    const booking = {
        time: selectedTimeSlot,
        teamName: teamName,
        captainName: captainName,
        teamRoster: teamRoster,
        maps: selectedMaps,
        comment: comment
    };
    
    try {
        console.log('Создание брони:', booking);
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
        
        // Перезагружаем данные
        setTimeout(() => loadData(), 1000);
        
    } catch (error) {
        console.error('Ошибка создания брони:', error);
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
    selectedMaps = [];
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
                timeElement.classList.remove('selected');
            } else {
                statusElement.textContent = 'Свободно';
                timeElement.style.opacity = '1';
                timeElement.style.cursor = 'pointer';
            }
        }
    }
}

function updateTimeSlotsFromBookings() {
    // Сбрасываем все слоты
    document.querySelectorAll('.time-slot').forEach(slot => {
        const time = slot.getAttribute('data-time');
        updateTimeSlotStatus(time, 'available');
    });
    
    // Помечаем занятые слоты
    bookings.forEach(booking => {
        updateTimeSlotStatus(booking.time, 'booked', booking.teamName);
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
    
    // Сортируем по времени
    const sortedBookings = todayBookings.sort((a, b) => {
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

// ===== АДМИН ПАНЕЛЬ =====
function initAdminPanel() {
    // Синхронизация
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            showNotification('Синхронизация...', 'info');
            const result = await db.syncLocalWithGitHub();
            showNotification(result.message, 'success');
            await loadData();
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
    
    // Проверить токен
    const checkTokenBtn = document.getElementById('check-token-btn');
    if (checkTokenBtn) {
        checkTokenBtn.addEventListener('click', async () => {
            if (!db.GITHUB_TOKEN || db.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
                showNotification('Токен не настроен!', 'error');
                return;
            }
            
            try {
                const response = await fetch(`https://api.github.com/gists/${db.GIST_ID}`, {
                    headers: {
                        'Authorization': `token ${db.GITHUB_TOKEN}`
                    }
                });
                
                if (response.ok) {
                    showNotification('✅ Токен работает!', 'success');
                } else {
                    showNotification('❌ Токен недействителен', 'error');
                }
            } catch (error) {
                showNotification('Ошибка проверки токена', 'error');
            }
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
    const localBookings = db.getFromLocalStorage ? db.getFromLocalStorage() : [];
    const adminLocalBookings = document.getElementById('admin-local-bookings');
    if (adminLocalBookings) adminLocalBookings.textContent = localBookings.length;
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
function showNotification(message, type = 'info', duration = 5000) {
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
    }, duration);
}

// ===== CSS для уведомлений =====
function addNotificationStyles() {
    if (document.querySelector('style[data-notifications]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-notifications', 'true');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0a0a0a;
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
            font-family: 'Exo 2', sans-serif;
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
        
        .notification.warning {
            border-left-color: #ffd700;
        }
        
        .notification i {
            font-size: 18px;
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

console.log('✅ JAVATEAM UI Ready!');
