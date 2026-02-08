// ui.js - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🎮 JAVATEAM UI Initializing...');

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;
let selectedMaps = [];
let isAdminAuthenticated = false;
const ADMIN_PASSWORD = 'JavaTeam2024!'; // Сменить на свой пароль!

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 JAVATEAM Website Started');
    
    // Добавляем стили
    addNotificationStyles();
    addAdminModalStyles();
    
    try {
        // Проверяем подключение к Gist
        await checkGistConnection();
        
        // Инициализация
        initMenu();
        initPrakiBookingSystem();
        initOtherElements();
        initHistory();
        initAdminPanel();
        
        // Проверяем авторизацию админа
        checkAdminAuth();
        
        // Загружаем данные
        await loadData();
        
        // Обновляем время
        updateTime();
        setInterval(updateTime, 60000); // Обновлять каждую минуту
        
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
        const tokenStatus = await db.checkTokenStatus();
        if (!tokenStatus.valid) {
            console.warn('⚠️ GitHub Token не настроен или недействителен!');
            
            // Показываем предупреждение
            setTimeout(() => {
                const adminBtn = document.querySelector('.admin-panel-btn');
                if (adminBtn && !sessionStorage.getItem('token_warn_shown')) {
                    showNotification(
                        'ВНИМАНИЕ: Для синхронизации данных между пользователями нужен GitHub Token.',
                        'warning',
                        8000
                    );
                    sessionStorage.setItem('token_warn_shown', 'true');
                }
            }, 2000);
        } else {
            console.log('✅ GitHub Token действителен:', tokenStatus.user);
        }
    } catch (error) {
        console.warn('⚠️ Gist недоступен, используем локальный режим');
        showNotification('Режим локальных данных. Брони не видны другим пользователям.', 'warning', 5000);
    }
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    console.log('📥 Loading data...');
    showLoading('Загрузка данных...');
    
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
        
        hideLoading();
        showNotification('✅ Данные загружены!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        hideLoading();
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
            color: '#ffd700'
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
            color: '#00ff88'
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
            color: '#ff4757'
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
            color: '#0099ff'
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
            color: '#ff6b6b'
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
            color: '#9b59b6',
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
            color: '#1abc9c',
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
    const imageName = player.name.toLowerCase().replace('?', '').replace('!', '');
    
    return `
        <div class="member-card ${rankClass}" data-player="${player.name.toLowerCase()}" style="--player-color: ${player.color}">
            <div class="member-card-inner">
                <div class="member-image">
                    <div class="member-image-placeholder" style="background: ${player.color}">
                        <i class="fas fa-user"></i>
                    </div>
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
                            <div class="stat-label">${player.role === 'ТРЕНЕР' ? 'Понимание' : 'hours'}</div>
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
            
            // Проверяем доступ к админ-панели
            if (pageId === 'admin' && !isAdminAuthenticated) {
                showAdminLoginModal();
                return;
            }
            
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
    
    // Добавляем клавиши навигации
    document.addEventListener('keydown', function(e) {
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    openPage('info');
                    break;
                case '2':
                    e.preventDefault();
                    openPage('members');
                    break;
                case '3':
                    e.preventDefault();
                    openPage('praki');
                    break;
                case '4':
                    e.preventDefault();
                    openPage('history');
                    break;
                case '5':
                    e.preventDefault();
                    if (isAdminAuthenticated) {
                        openPage('admin');
                    } else {
                        showAdminLoginModal();
                    }
                    break;
            }
        }
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
            const isActive = this.classList.contains('active');
            const maxSelected = 3;
            const currentSelected = document.querySelectorAll('.map-btn.active').length;
            
            if (!isActive && currentSelected >= maxSelected) {
                showNotification(`Можно выбрать не более ${maxSelected} карт`, 'warning');
                return;
            }
            
            this.classList.toggle('active');
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
            
            // Обновляем выбранные карты
            selectedMaps = Array.from(document.querySelectorAll('.map-btn.active'))
                .map(btn => btn.getAttribute('data-map'));
        });
    });
    
    // Временные слоты
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            const isBooked = this.querySelector('.time-status').classList.contains('booked');
            
            if (isBooked) {
                showNotification(`Время ${time} уже занято командой "${this.querySelector('.time-status').textContent.replace('Занято: ', '')}"!`, 'error');
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
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> БРОНИРОВАНИЕ...';
                await createBooking();
                setTimeout(() => {
                    this.style.transform = '';
                    this.disabled = false;
                    this.innerHTML = `
                        <div class="btn-content">
                            <span>ЗАБРОНИРОВАТЬ ВРЕМЯ</span>
                            <div class="btn-icon">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                        </div>
                    `;
                }, 500);
            }
        });
    }
    
    // Валидация в реальном времени
    const inputs = document.querySelectorAll('.form-input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#00ff88';
            } else {
                this.style.borderColor = '';
            }
        });
    });
}

function validatePrakiBookingForm() {
    let isValid = true;
    const requiredInputs = document.querySelectorAll('.form-input[required]');
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#ff4757';
            input.style.animation = 'shake 0.5s';
            isValid = false;
            
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        } else {
            input.style.borderColor = '#00ff88';
        }
    });
    
    if (!selectedTimeSlot) {
        showNotification('Выберите время для бронирования', 'error');
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.style.animation = 'pulse 1s';
            setTimeout(() => slot.style.animation = '', 1000);
        });
        isValid = false;
    }
    
    const selectedMapsElements = document.querySelectorAll('.map-btn.active');
    if (selectedMapsElements.length === 0) {
        showNotification('Выберите хотя бы одну карту', 'error');
        document.querySelectorAll('.map-btn').forEach(btn => {
            btn.style.animation = 'pulse 1s';
            setTimeout(() => btn.style.animation = '', 1000);
        });
        isValid = false;
    }
    
    // Проверка состава команды (минимум 5 игроков)
    const rosterInput = document.getElementById('team-roster');
    if (rosterInput && rosterInput.value.trim()) {
        const players = rosterInput.value.split(',').map(p => p.trim()).filter(p => p);
        if (players.length < 5) {
            showNotification(`В составе должно быть минимум 5 игроков. Указано: ${players.length}`, 'error');
            rosterInput.style.borderColor = '#ff4757';
            isValid = false;
        } else if (players.length > 10) {
            showNotification(`В составе должно быть не более 10 игроков. Указано: ${players.length}`, 'error');
            rosterInput.style.borderColor = '#ff4757';
            isValid = false;
        }
    }
    
    return isValid;
}

async function createBooking() {
    const teamName = document.getElementById('team-name').value.trim();
    const captainName = document.getElementById('captain-name').value.trim();
    const teamRoster = document.getElementById('team-roster').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
    const selectedMapsElements = Array.from(document.querySelectorAll('.map-btn.active'));
    const selectedMaps = selectedMapsElements.map(btn => btn.getAttribute('data-map'));
    
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
        
        if (result.success) {
            // Показываем результат
            if (result.message.includes('локально')) {
                showNotification(result.message + ` ID: ${result.id}`, 'warning', 8000);
            } else {
                showNotification(result.message, 'success');
            }
            
            // Добавляем в локальный список
            bookings.push(result.booking);
            
            // Обновляем отображение
            updateBookingsDisplay();
            updateTimeSlotStatus(selectedTimeSlot, 'booked', teamName);
            
            // Обновляем админ статистику
            updateAdminStats();
            
            // Сбрасываем форму
            resetPrakiForm();
            
            // Перезагружаем данные через секунду
            setTimeout(async () => {
                await loadData();
            }, 1000);
        }
        
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
                statusElement.textContent = teamName ? `Занято: ${teamName}` : 'Занято';
                timeElement.style.opacity = '0.7';
                timeElement.style.cursor = 'not-allowed';
                timeElement.classList.remove('selected');
                timeElement.disabled = true;
            } else {
                statusElement.textContent = 'Свободно';
                timeElement.style.opacity = '1';
                timeElement.style.cursor = 'pointer';
                timeElement.disabled = false;
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
        if (booking.confirmed !== false) {
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
    const todayBookings = bookings.filter(b => b.bookingDate === today && b.confirmed !== false);
    
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
        const rosterText = Array.isArray(booking.teamRoster) ? 
            booking.teamRoster.join(', ') : 
            booking.teamRoster;
        const mapsText = Array.isArray(booking.maps) ? 
            booking.maps.join(', ') : 
            booking.maps;
        
        row.innerHTML = `
            <td><strong class="booking-time">${booking.time}</strong></td>
            <td><strong class="booking-team">${booking.teamName}</strong></td>
            <td>${booking.captainName}</td>
            <td class="booking-roster" title="${rosterText}">${rosterText.length > 30 ? rosterText.substring(0, 30) + '...' : rosterText}</td>
            <td class="booking-maps" title="${mapsText}">${mapsText.length > 20 ? mapsText.substring(0, 20) + '...' : mapsText}</td>
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
    initGameModal();
}

function renderGamesTable() {
    const tbody = document.getElementById('games-table-body');
    const noGamesMessage = document.getElementById('no-games-message');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (gamesHistory.length === 0) {
        if (noGamesMessage) noGamesMessage.style.display = 'flex';
        return;
    }
    
    if (noGamesMessage) noGamesMessage.style.display = 'none';
    
    const sortedGames = [...gamesHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedGames.forEach(game => {
        const row = document.createElement('tr');
        const formattedDate = new Date(game.date).toLocaleDateString('ru-RU');
        const resultClass = game.result;
        const resultText = game.result === 'win' ? 'Победа' : 
                          game.result === 'loss' ? 'Поражение' : 'Ничья';
        const resultIcon = game.result === 'win' ? 'trophy' : 
                          game.result === 'loss' ? 'times' : 'equals';
        const teamText = Array.isArray(game.team) ? game.team.join(', ') : game.team;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="game-result ${resultClass}">
                <i class="fas fa-${resultIcon}"></i>
                ${resultText} ${game.score ? `(${game.score})` : ''}
            </td>
            <td class="game-team" title="${teamText}">${teamText.length > 30 ? teamText.substring(0, 30) + '...' : teamText}</td>
            <td class="game-comment" title="${game.comment || '-'}">${game.comment || '-'}</td>
        `;
        
        if (isAdminAuthenticated) {
            row.dataset.gameId = game.id;
            row.classList.add('admin-row');
            row.addEventListener('click', () => showGameDetails(game));
        }
        
        tbody.appendChild(row);
    });
}

function updateStats() {
    const totalGames = gamesHistory.length;
    const wins = gamesHistory.filter(game => game.result === 'win').length;
    const losses = gamesHistory.filter(game => game.result === 'loss').length;
    const draws = gamesHistory.filter(game => game.result === 'draw').length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    const totalGamesEl = document.getElementById('total-games');
    const winsEl = document.getElementById('wins');
    const lossesEl = document.getElementById('losses');
    const winRateEl = document.getElementById('win-rate');
    
    if (totalGamesEl) {
        animateCounter(totalGamesEl, parseInt(totalGamesEl.textContent) || 0, totalGames, 800);
    }
    if (winsEl) {
        animateCounter(winsEl, parseInt(winsEl.textContent) || 0, wins, 800);
    }
    if (lossesEl) {
        animateCounter(lossesEl, parseInt(lossesEl.textContent) || 0, losses, 800);
    }
    if (winRateEl) {
        const currentRate = parseInt(winRateEl.textContent) || 0;
        winRateEl.textContent = `${winRate}%`;
        winRateEl.style.color = winRate >= 50 ? '#00ff88' : winRate >= 30 ? '#ffd700' : '#ff4757';
    }
}

function updateInfoStats() {
    const totalGames = gamesHistory.length;
    const wins = gamesHistory.filter(game => game.result === 'win').length;
    
    const totalGamesEl = document.getElementById('info-total-games');
    const winsEl = document.getElementById('info-wins');
    const membersEl = document.getElementById('info-members-count');
    
    if (totalGamesEl) {
        animateCounter(totalGamesEl, parseInt(totalGamesEl.textContent) || 0, totalGames, 1000);
    }
    if (winsEl) {
        animateCounter(winsEl, parseInt(winsEl.textContent) || 0, wins, 1000);
    }
    if (membersEl) {
        // Считаем реальное количество уникальных игроков в истории
        const allPlayers = new Set();
        gamesHistory.forEach(game => {
            if (Array.isArray(game.team)) {
                game.team.forEach(player => allPlayers.add(player.trim()));
            }
        });
        const uniquePlayers = allPlayers.size || 21; // Fallback to 21 if no games
        
        if (parseInt(membersEl.textContent) !== uniquePlayers) {
            animateCounter(membersEl, parseInt(membersEl.textContent) || 0, uniquePlayers, 1000);
        }
    }
}

function animateCounter(element, start, end, duration) {
    if (start === end) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current;
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
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
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
    
    if (filteredGames.length === 0) {
        const noGamesMessage = document.getElementById('no-games-message');
        if (noGamesMessage) {
            noGamesMessage.style.display = 'flex';
            noGamesMessage.innerHTML = `
                <i class="fas fa-filter"></i>
                <h3>Игр не найдено</h3>
                <p>Попробуйте изменить фильтры</p>
            `;
        }
        return;
    }
    
    const noGamesMessage = document.getElementById('no-games-message');
    if (noGamesMessage) noGamesMessage.style.display = 'none';
    
    filteredGames.forEach(game => {
        const row = document.createElement('tr');
        const formattedDate = new Date(game.date).toLocaleDateString('ru-RU');
        const resultClass = game.result;
        const resultText = game.result === 'win' ? 'Победа' : 
                          game.result === 'loss' ? 'Поражение' : 'Ничья';
        const resultIcon = game.result === 'win' ? 'trophy' : 
                          game.result === 'loss' ? 'times' : 'equals';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="game-result ${resultClass}">
                <i class="fas fa-${resultIcon}"></i>
                ${resultText} ${game.score ? `(${game.score})` : ''}
            </td>
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
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Синхронизация...';
            syncBtn.disabled = true;
            
            const result = await db.syncLocalWithGitHub();
            
            syncBtn.innerHTML = '<i class="fas fa-sync"></i> Синхронизировать брони';
            syncBtn.disabled = false;
            
            showNotification(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                await loadData();
            }
        });
    }
    
    // Обновить данные
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            refreshBtn.disabled = true;
            
            await loadData();
            
            refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Обновить данные';
            refreshBtn.disabled = false;
        });
    }
    
    // Проверить токен
    const checkTokenBtn = document.getElementById('check-token-btn');
    if (checkTokenBtn) {
        checkTokenBtn.addEventListener('click', async () => {
            const tokenStatus = await db.checkTokenStatus();
            
            if (tokenStatus.valid) {
                showNotification(`✅ Токен действителен! Пользователь: ${tokenStatus.user}`, 'success', 5000);
            } else {
                showNotification(`❌ ${tokenStatus.message}`, 'error', 5000);
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
                showNotification('✅ Сегодняшние брони сброшены', 'success');
            } else {
                showNotification(result.message, 'error');
            }
        });
    }
    
    // Экспорт
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const result = await db.adminExportData();
            showNotification(result.message, result.success ? 'success' : 'error');
        });
    }
    
    // Просмотр localStorage
    const viewLocalBtn = document.getElementById('view-local-btn');
    if (viewLocalBtn) {
        viewLocalBtn.addEventListener('click', () => {
            const stats = db.getLocalStorageStats();
            const today = new Date().toISOString().split('T')[0];
            
            let message = `📊 Локальная статистика:\n\n`;
            message += `• Всего броней: ${stats.total}\n`;
            message += `• Сегодняшних: ${stats.today}\n`;
            message += `• Дата: ${today}\n`;
            
            if (stats.lastUpdated) {
                message += `• Обновлено: ${new Date(stats.lastUpdated).toLocaleString('ru-RU')}`;
            }
            
            alert(message);
        });
    }
    
    // Добавление игры (модальное окно)
    const addGameBtn = document.querySelector('button[onclick*="history"]');
    if (addGameBtn) {
        addGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdminAuthenticated) {
                openPage('history');
                setTimeout(() => showAddGameModal(), 500);
            }
        });
    }
}

function updateAdminStats() {
    // Сегодняшние брони
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.bookingDate === today);
    const adminTodayBookings = document.getElementById('admin-today-bookings');
    if (adminTodayBookings) {
        animateCounter(adminTodayBookings, parseInt(adminTodayBookings.textContent) || 0, todayBookings.length, 500);
    }
    
    // Всего игр
    const adminTotalGames = document.getElementById('admin-total-games');
    if (adminTotalGames) {
        animateCounter(adminTotalGames, parseInt(adminTotalGames.textContent) || 0, gamesHistory.length, 500);
    }
    
    // LocalStorage
    const stats = db.getLocalStorageStats();
    const adminLocalBookings = document.getElementById('admin-local-bookings');
    if (adminLocalBookings) {
        animateCounter(adminLocalBookings, parseInt(adminLocalBookings.textContent) || 0, stats.today, 500);
    }
}

// ===== АВТОРИЗАЦИЯ АДМИНА =====
function checkAdminAuth() {
    const auth = sessionStorage.getItem('javateam_admin_auth');
    const expiry = sessionStorage.getItem('javateam_admin_expiry');
    
    if (auth === 'true' && expiry && new Date().getTime() < parseInt(expiry)) {
        isAdminAuthenticated = true;
        document.querySelectorAll('.admin-panel-btn').forEach(btn => {
            btn.style.color = '#ffd700';
        });
    } else {
        // Очищаем просроченную авторизацию
        sessionStorage.removeItem('javateam_admin_auth');
        sessionStorage.removeItem('javateam_admin_expiry');
        isAdminAuthenticated = false;
    }
}

function showAdminLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-login-modal';
    modal.innerHTML = `
        <div class="admin-login-content">
            <div class="admin-login-header">
                <i class="fas fa-user-shield"></i>
                <h3>ДОСТУП К АДМИН ПАНЕЛИ</h3>
            </div>
            <div class="admin-login-body">
                <p>Введите пароль для доступа к панели управления:</p>
                <input type="password" id="admin-password" placeholder="Пароль" autocomplete="current-password">
                <p class="login-hint">Подсказка: Пароль был установлен при создании сайта</p>
            </div>
            <div class="admin-login-footer">
                <button class="login-btn" id="login-submit">
                    <i class="fas fa-sign-in-alt"></i>
                    Войти
                </button>
                <button class="login-btn cancel-btn" id="login-cancel">
                    <i class="fas fa-times"></i>
                    Отмена
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Обработчики событий
    const passwordInput = modal.querySelector('#admin-password');
    const submitBtn = modal.querySelector('#login-submit');
    const cancelBtn = modal.querySelector('#login-cancel');
    
    passwordInput.focus();
    
    submitBtn.addEventListener('click', () => {
        const password = passwordInput.value.trim();
        if (password === ADMIN_PASSWORD) {
            // Авторизация успешна
            const expiry = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 часа
            sessionStorage.setItem('javateam_admin_auth', 'true');
            sessionStorage.setItem('javateam_admin_expiry', expiry.toString());
            
            isAdminAuthenticated = true;
            
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                openPage('admin');
                showNotification('✅ Авторизация успешна!', 'success');
            }, 300);
        } else {
            passwordInput.style.borderColor = '#ff4757';
            passwordInput.style.animation = 'shake 0.5s';
            showNotification('❌ Неверный пароль!', 'error');
            
            setTimeout(() => {
                passwordInput.style.animation = '';
                passwordInput.value = '';
                passwordInput.focus();
            }, 500);
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Enter для отправки
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelBtn.click();
        }
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ ДРУГИХ ЭЛЕМЕНТОВ =====
function initOtherElements() {
    // Кнопка присоединения на главной
    const joinBtn = document.querySelector('.info-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            openPage('praki');
            showNotification('Заполните форму для бронирования прака', 'info');
        });
    }
    
    // Статистика членов команды
    initMemberCards();
    
    // Индикатор времени
    updateTime();
}

function initMemberCards() {
    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)';
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            this.style.zIndex = '';
        });
        
        card.addEventListener('click', function() {
            const player = this.getAttribute('data-player');
            const name = this.querySelector('.member-name').textContent;
            const role = this.querySelector('.member-role').textContent;
            
            showNotification(`${name} - ${role}`, 'info');
        });
    });
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const date = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Проверяем нужно ли сбросить брони (после 00:00)
    if (hours === '00' && minutes < '05') {
        const lastReset = localStorage.getItem('last_reset_check');
        const today = now.toISOString().split('T')[0];
        
        if (lastReset !== today) {
            localStorage.setItem('last_reset_check', today);
            showNotification('🔁 Автоматическая проверка сброса броней...', 'info');
            
            // Загружаем свежие данные
            setTimeout(() => loadData(), 2000);
        }
    }
    
    // Обновляем индикатор на странице праков
    if (currentPage === 'praki') {
        const timeIndicator = document.querySelector('.current-time-indicator');
        if (!timeIndicator) {
            const prakiContainer = document.querySelector('.praki-container');
            if (prakiContainer) {
                const indicator = document.createElement('div');
                indicator.className = 'current-time-indicator';
                indicator.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span>Текущее время: ${hours}:${minutes}</span>
                    <span class="current-date">${date}</span>
                `;
                prakiContainer.prepend(indicator);
            }
        } else {
            timeIndicator.innerHTML = `
                <i class="fas fa-clock"></i>
                <span>Текущее время: ${hours}:${minutes}</span>
                <span class="current-date">${date}</span>
            `;
        }
    }
}

// ===== МОДАЛЬНОЕ ОКНО ДЛЯ ДОБАВЛЕНИЯ ИГРЫ =====
function initGameModal() {
    // Кнопка добавления игры будет в админ-панели
}

function showAddGameModal() {
    if (!isAdminAuthenticated) {
        showAdminLoginModal();
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'add-game-modal';
    modal.innerHTML = `
        <div class="add-game-content">
            <div class="add-game-header">
                <i class="fas fa-plus-circle"></i>
                <h3>ДОБАВИТЬ ИГРУ В ИСТОРИЮ</h3>
            </div>
            <div class="add-game-body">
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Дата игры</label>
                    <input type="date" id="game-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-users"></i> Противник (название команды)</label>
                    <input type="text" id="game-opponent" placeholder="Название команды противника">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-flag"></i> Результат</label>
                    <select id="game-result">
                        <option value="win">Победа</option>
                        <option value="loss">Поражение</option>
                        <option value="draw">Ничья</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-trophy"></i> Счет (необязательно)</label>
                    <input type="text" id="game-score" placeholder="Например: 13-7">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user-friends"></i> Наш состав (через запятую)</label>
                    <input type="text" id="game-team" placeholder="Player1, Player2, Player3, Player4, Player5">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-comment"></i> Комментарий</label>
                    <textarea id="game-comment" placeholder="Особенности игры, карты и т.д." rows="3"></textarea>
                </div>
            </div>
            <div class="add-game-footer">
                <button class="game-btn save-btn" id="save-game">
                    <i class="fas fa-save"></i>
                    Сохранить игру
                </button>
                <button class="game-btn cancel-btn" id="cancel-game">
                    <i class="fas fa-times"></i>
                    Отмена
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Обработчики
    const saveBtn = modal.querySelector('#save-game');
    const cancelBtn = modal.querySelector('#cancel-game');
    const opponentInput = modal.querySelector('#game-opponent');
    
    opponentInput.focus();
    
    saveBtn.addEventListener('click', async () => {
        const gameData = {
            date: modal.querySelector('#game-date').value,
            opponent: modal.querySelector('#game-opponent').value.trim(),
            result: modal.querySelector('#game-result').value,
            score: modal.querySelector('#game-score').value.trim(),
            team: modal.querySelector('#game-team').value.trim(),
            comment: modal.querySelector('#game-comment').value.trim()
        };
        
        // Валидация
        if (!gameData.opponent) {
            showNotification('Введите название команды противника', 'error');
            opponentInput.style.borderColor = '#ff4757';
            return;
        }
        
        if (!gameData.team) {
            showNotification('Введите состав нашей команды', 'error');
            return;
        }
        
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        saveBtn.disabled = true;
        
        try {
            const result = await db.addGame(gameData);
            
            if (result.success) {
                showNotification(result.message, 'success');
                
                // Добавляем игру в историю
                gamesHistory.unshift(result.game);
                renderGamesTable();
                updateStats();
                updateInfoStats();
                updateAdminStats();
                
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            } else {
                showNotification(result.message, 'error');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить игру';
                saveBtn.disabled = false;
            }
        } catch (error) {
            showNotification('Ошибка сохранения игры: ' + error.message, 'error');
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить игру';
            saveBtn.disabled = false;
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Закрытие по клику вне
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelBtn.click();
        }
    });
}

function showGameDetails(game) {
    const modal = document.createElement('div');
    modal.className = 'game-details-modal';
    
    const resultText = game.result === 'win' ? 'Победа' : 
                      game.result === 'loss' ? 'Поражение' : 'Ничья';
    const resultIcon = game.result === 'win' ? 'trophy' : 
                      game.result === 'loss' ? 'times' : 'equals';
    const resultColor = game.result === 'win' ? '#00ff88' : 
                       game.result === 'loss' ? '#ff4757' : '#ffd700';
    
    modal.innerHTML = `
        <div class="game-details-content">
            <div class="game-details-header" style="border-color: ${resultColor}">
                <i class="fas fa-${resultIcon}" style="color: ${resultColor}"></i>
                <h3>ДЕТАЛИ ИГРЫ</h3>
                <span class="game-result-badge" style="background: ${resultColor}">${resultText}</span>
            </div>
            <div class="game-details-body">
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-calendar"></i> Дата:</span>
                    <span class="detail-value">${new Date(game.date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-users"></i> Противник:</span>
                    <span class="detail-value">${game.opponent}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-flag"></i> Результат:</span>
                    <span class="detail-value" style="color: ${resultColor}">${resultText} ${game.score ? `(${game.score})` : ''}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-user-friends"></i> Наш состав:</span>
                    <span class="detail-value">${Array.isArray(game.team) ? game.team.join(', ') : game.team}</span>
                </div>
                ${game.comment ? `
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-comment"></i> Комментарий:</span>
                    <span class="detail-value">${game.comment}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-clock"></i> Добавлено:</span>
                    <span class="detail-value">${new Date(game.addedAt).toLocaleString('ru-RU')}</span>
                </div>
                ${game.addedBy ? `
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-user"></i> Добавил:</span>
                    <span class="detail-value">${game.addedBy}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-hashtag"></i> ID игры:</span>
                    <span class="detail-value game-id">${game.id}</span>
                </div>
            </div>
            <div class="game-details-footer">
                <button class="details-btn" id="copy-game-id">
                    <i class="fas fa-copy"></i>
                    Копировать ID
                </button>
                <button class="details-btn close-btn" id="close-details">
                    <i class="fas fa-times"></i>
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Обработчики
    const copyBtn = modal.querySelector('#copy-game-id');
    const closeBtn = modal.querySelector('#close-details');
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(game.id).then(() => {
            showNotification('✅ ID игры скопирован в буфер обмена', 'success');
        });
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Закрытие по клику вне
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    });
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info', duration = 5000) {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notif => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    });
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-text">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
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

function showLoading(message = 'Загрузка...') {
    let loader = document.querySelector('.loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.style.display = 'none';
        setTimeout(() => {
            if (loader.parentNode) {
                loader.remove();
            }
        }, 300);
    }
}

// ===== CSS ДЛЯ УВЕДОМЛЕНИЙ И МОДАЛЬНЫХ ОКОН =====
function addNotificationStyles() {
    if (document.querySelector('style[data-notifications]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-notifications', 'true');
    style.textContent = `
        /* Уведомления */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(10, 10, 10, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            transform: translateX(120%) scale(0.9);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 9999;
            border-left: 5px solid;
            max-width: 400px;
            min-width: 300px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .notification.show {
            transform: translateX(0) scale(1);
        }
        
        .notification-success {
            border-left-color: #00ff88;
        }
        
        .notification-error {
            border-left-color: #ff4757;
        }
        
        .notification-info {
            border-left-color: #0099ff;
        }
        
        .notification-warning {
            border-left-color: #ffd700;
        }
        
        .notification-icon {
            font-size: 22px;
        }
        
        .notification-icon .fa-check-circle { color: #00ff88; }
        .notification-icon .fa-exclamation-circle { color: #ff4757; }
        .notification-icon .fa-exclamation-triangle { color: #ffd700; }
        .notification-icon .fa-info-circle { color: #0099ff; }
        
        .notification-text {
            flex: 1;
            font-family: 'Exo 2', sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .notification-close {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.2s;
        }
        
        .notification-close:hover {
            background: rgba(255,255,255,0.2);
            transform: rotate(90deg);
        }
        
        /* Загрузка */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        }
        
        .loading-content {
            background: rgba(20,20,20,0.9);
            padding: 30px 40px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(0,255,136,0.3);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .loading-spinner {
            font-size: 40px;
            color: #00ff88;
            margin-bottom: 15px;
        }
        
        .loading-text {
            color: white;
            font-family: 'Exo 2', sans-serif;
            font-size: 16px;
            letter-spacing: 1px;
        }
        
        /* Анимации */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}

function addAdminModalStyles() {
    if (document.querySelector('style[data-admin-modals]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-admin-modals', 'true');
    style.textContent = `
        /* Модальное окно авторизации */
        .admin-login-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            backdrop-filter: blur(10px);
        }
        
        .admin-login-modal.show {
            opacity: 1;
        }
        
        .admin-login-content {
            background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
            border-radius: 15px;
            width: 90%;
            max-width: 400px;
            overflow: hidden;
            border: 2px solid rgba(255,215,0,0.3);
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
            transform: translateY(-20px) scale(0.95);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .admin-login-modal.show .admin-login-content {
            transform: translateY(0) scale(1);
        }
        
        .admin-login-header {
            background: rgba(255,215,0,0.1);
            padding: 25px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,215,0,0.3);
        }
        
        .admin-login-header i {
            font-size: 40px;
            color: #ffd700;
            margin-bottom: 15px;
        }
        
        .admin-login-header h3 {
            color: white;
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            letter-spacing: 1px;
            margin: 0;
        }
        
        .admin-login-body {
            padding: 25px;
        }
        
        .admin-login-body p {
            color: #ccc;
            font-family: 'Exo 2', sans-serif;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .admin-login-body input {
            width: 100%;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: white;
            font-family: 'Exo 2', sans-serif;
            font-size: 16px;
            margin-bottom: 15px;
            transition: border-color 0.3s;
        }
        
        .admin-login-body input:focus {
            border-color: #ffd700;
            outline: none;
        }
        
        .login-hint {
            font-size: 12px;
            color: #888;
            margin-top: 10px;
        }
        
        .admin-login-footer {
            display: flex;
            gap: 10px;
            padding: 20px;
            background: rgba(0,0,0,0.3);
        }
        
        .login-btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .login-btn:not(.cancel-btn) {
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #000;
            font-weight: bold;
        }
        
        .login-btn.cancel-btn {
            background: rgba(255,255,255,0.1);
            color: white;
        }
        
        .login-btn:hover:not(.cancel-btn) {
            background: linear-gradient(135deg, #ffed4e, #ffc107);
            transform: translateY(-2px);
        }
        
        .login-btn.cancel-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        /* Модальное окно добавления игры */
        .add-game-modal, .game-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            backdrop-filter: blur(10px);
        }
        
        .add-game-modal.show, .game-details-modal.show {
            opacity: 1;
        }
        
        .add-game-content, .game-details-content {
            background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            border: 2px solid rgba(0,255,136,0.3);
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
            transform: translateY(-20px) scale(0.95);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .add-game-modal.show .add-game-content,
        .game-details-modal.show .game-details-content {
            transform: translateY(0) scale(1);
        }
        
        .add-game-header, .game-details-header {
            background: rgba(0,255,136,0.1);
            padding: 25px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(0,255,136,0.3);
            position: relative;
        }
        
        .add-game-header i, .game-details-header i {
            font-size: 40px;
            color: #00ff88;
            margin-bottom: 15px;
        }
        
        .add-game-header h3, .game-details-header h3 {
            color: white;
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            letter-spacing: 1px;
            margin: 0;
        }
        
        .game-result-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            padding: 5px 15px;
            border-radius: 20px;
            font-family: 'Orbitron', sans-serif;
            font-size: 12px;
            font-weight: bold;
            color: #000;
        }
        
        .add-game-body, .game-details-body {
            padding: 25px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #ccc;
            font-family: 'Exo 2', sans-serif;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .form-group label i {
            margin-right: 8px;
            color: #00ff88;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: white;
            font-family: 'Exo 2', sans-serif;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            border-color: #00ff88;
            outline: none;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .detail-label {
            width: 120px;
            color: #888;
            font-family: 'Exo 2', sans-serif;
            font-size: 14px;
        }
        
        .detail-label i {
            margin-right: 8px;
            width: 20px;
        }
        
        .detail-value {
            flex: 1;
            color: white;
            font-family: 'Exo 2', sans-serif;
            font-size: 14px;
        }
        
        .game-id {
            font-family: 'Courier New', monospace;
            background: rgba(255,255,255,0.1);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            word-break: break-all;
        }
        
        .add-game-footer, .game-details-footer {
            display: flex;
            gap: 10px;
            padding: 20px;
            background: rgba(0,0,0,0.3);
        }
        
        .game-btn, .details-btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .game-btn.save-btn, .details-btn:not(.close-btn) {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000;
            font-weight: bold;
        }
        
        .game-btn.cancel-btn, .details-btn.close-btn {
            background: rgba(255,255,255,0.1);
            color: white;
        }
        
        .game-btn:hover:not(.cancel-btn),
        .details-btn:hover:not(.close-btn) {
            background: linear-gradient(135deg, #4dffb8, #00ff88);
            transform: translateY(-2px);
        }
        
        .game-btn.cancel-btn:hover,
        .details-btn.close-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        /* Текущее время */
        .current-time-indicator {
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(0,255,136,0.3);
            border-radius: 10px;
            padding: 15px 20px;
            margin: 20px auto;
            max-width: 500px;
            text-align: center;
            font-family: 'Orbitron', sans-serif;
            color: #00ff88;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            backdrop-filter: blur(5px);
        }
        
        .current-time-indicator i {
            font-size: 20px;
        }
        
        .current-time-indicator span {
            font-size: 16px;
            letter-spacing: 1px;
        }
        
        .current-date {
            color: #ccc;
            font-family: 'Exo 2', sans-serif;
            font-size: 14px !important;
        }
        
        /* Строки для админа */
        .admin-row {
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .admin-row:hover {
            background: rgba(255,215,0,0.1) !important;
        }
        
        .game-result.win {
            color: #00ff88;
            font-weight: bold;
        }
        
        .game-result.loss {
            color: #ff4757;
        }
        
        .game-result.draw {
            color: #ffd700;
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ JAVATEAM UI Ready!');
