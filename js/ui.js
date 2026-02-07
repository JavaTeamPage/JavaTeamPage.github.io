// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPage = 'info';
let gamesHistory = [];
let bookings = [];
let selectedTimeSlot = null;
let adminClickCount = 0;
let adminClickTimer = null;
let isAdmin = false;
let adminPassword = "javateam123"; // Стандартный пароль

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('JAVATEAM Website Initialized');
    
    // Проверяем сохраненный пароль
    if (localStorage.getItem('adminPassword')) {
        adminPassword = localStorage.getItem('adminPassword');
    }
    
    // Проверяем, авторизован ли админ
    if (localStorage.getItem('isAdmin') === 'true') {
        isAdmin = true;
        console.log('%c 🔐 Админ режим активен', 'color: #00ff88; font-size: 14px;');
    }
    
    // Инициализация меню
    initMenu();
    
    // Инициализация системы бронирования праков
    initPrakiBookingSystem();
    
    // Инициализация истории игр
    initHistory();
    
    // Инициализация других элементов
    initOtherElements();
    
    // Инициализация админ системы
    initAdminSystem();
    
    // Обновляем статистику на главной
    updateInfoStats();
    
    // Проверяем сброс броней (если прошли сутки)
    checkBookingsReset();
    
    // Загружаем текущие брони
    loadBookings();
    
    // Обновляем интерфейс
    updateAdminUI();
    
    // Консольное сообщение
    console.log('%c JAVATEAM - STANDOFF 2 ESPORTS TEAM', 'background: linear-gradient(90deg, #ffd700, #9d00ff); color: #000; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;');
    console.log('%c Админ панель: тройной клик на логотип JavaTeam', 'color: #ffd700; font-size: 12px; font-style: italic;');
});

// ===== МЕНЮ И ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ =====
function initMenu() {
    const menuButtons = document.querySelectorAll('.menu-btn');
    const pageIndicator = document.querySelector('.page-indicator');
    
    // Убираем кнопку "Награды" если она есть
    document.querySelectorAll('.menu-btn[data-page="rewards"]').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Устанавливаем активную кнопку
    updateActiveMenuButton('info');
    updatePageIndicator('info');
    
    // Обработчик кликов по кнопкам меню
    menuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            openPage(pageId);
        });
        
        // Эффект при наведении
        button.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(-2px)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = '';
            }
        });
    });
}

function openPage(pageId) {
    if (currentPage === pageId) return;
    
    // Плавное скрытие текущей страницы
    const currentBlock = document.querySelector('.page-block.active');
    const newBlock = document.getElementById(pageId);
    
    if (currentBlock && newBlock) {
        currentBlock.classList.remove('active');
        currentBlock.style.opacity = '0';
        
        // Показываем новую страницу
        setTimeout(() => {
            newBlock.classList.add('active');
            newBlock.style.opacity = '1';
            
            // Обновляем меню
            updateActiveMenuButton(pageId);
            updatePageIndicator(pageId);
            
            // Прокрутка наверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Обновляем статистику на главной при переходе на info
            if (pageId === 'info') {
                updateInfoStats();
            }
            
            // Обновляем брони при переходе на праки
            if (pageId === 'praki') {
                updateBookingsDisplay();
            }
            
        }, 300);
    }
    
    currentPage = pageId;
}

function updatePageIndicator(pageId) {
    const indicator = document.querySelector('.page-indicator');
    // Только видимые кнопки (без Наград)
    const buttons = Array.from(document.querySelectorAll('.menu-btn')).filter(btn => 
        btn.style.display !== 'none' && btn.getAttribute('data-page') !== 'rewards'
    );
    
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
        // Пропускаем скрытые кнопки
        if (btn.style.display === 'none') return;
        
        btn.classList.remove('active');
        const icon = btn.querySelector('.menu-icon');
        if (icon) {
            icon.style.color = '';
        }
        
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
            if (icon) {
                icon.style.color = '#ffd700';
            }
        }
    });
}

// ===== СИСТЕМА БРОНИРОВАНИЯ PRAKI =====
function initPrakiBookingSystem() {
    // Инициализация временных слотов
    initTimeSlots();
    
    // Карты в форме
    const mapButtons = document.querySelectorAll('.map-btn');
    mapButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Эффект нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Кнопка отправки формы
    const submitBtn = document.querySelector('.praki-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Валидация формы
            if (validatePrakiBookingForm()) {
                // Эффект нажатия
                this.style.transform = 'scale(0.95)';
                
                // Создаем бронь
                createBooking();
                
                // Сбрасываем форму
                setTimeout(() => {
                    resetPrakiForm();
                    this.style.transform = '';
                }, 500);
            }
        });
    }
    
    // Валидация инпутов
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            validateInput(this);
        });
    });
}

function initTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            
            // Проверяем, не занято ли время
            if (this.querySelector('.time-status').classList.contains('booked')) {
                showNotification(`Время ${time} уже занято другой командой`, 'error');
                return;
            }
            
            // Снимаем выделение со всех слотов
            timeSlots.forEach(s => {
                s.classList.remove('selected');
                s.querySelector('.time-icon').style.color = '';
            });
            
            // Выделяем выбранный слот
            this.classList.add('selected');
            this.querySelector('.time-icon').style.color = '#ffd700';
            
            // Сохраняем выбранное время
            selectedTimeSlot = time;
            
            // Эффект нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

function validatePrakiBookingForm() {
    let isValid = true;
    const requiredInputs = document.querySelectorAll('.form-input[required]');
    
    // Проверка полей формы
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            isValid = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    // Проверка выбранного времени
    if (!selectedTimeSlot) {
        showNotification('Пожалуйста, выберите время для прака', 'error');
        isValid = false;
    }
    
    // Проверка выбранных карт
    const selectedMaps = document.querySelectorAll('.map-btn.active');
    if (selectedMaps.length === 0) {
        showNotification('Пожалуйста, выберите хотя бы одну карту', 'error');
        isValid = false;
    }
    
    return isValid;
}

function validateInput(input) {
    if (input.value.trim() && input.checkValidity()) {
        input.style.borderColor = 'var(--success-color)';
        return true;
    } else if (!input.required && !input.value.trim()) {
        input.style.borderColor = '';
        return true;
    } else {
        input.style.borderColor = 'var(--danger-color)';
        return false;
    }
}

function createBooking() {
    const teamName = document.getElementById('team-name').value.trim();
    const captainName = document.getElementById('captain-name').value.trim();
    const teamRoster = document.getElementById('team-roster').value.trim().split(',').map(p => p.trim());
    const comment = document.getElementById('comment').value.trim();
    
    // Получаем выбранные карты
    const selectedMaps = [];
    document.querySelectorAll('.map-btn.active').forEach(btn => {
        selectedMaps.push(btn.querySelector('span').textContent);
    });
    
    // Создаем объект брони
    const booking = {
        id: Date.now(),
        time: selectedTimeSlot,
        teamName: teamName,
        captainName: captainName,
        teamRoster: teamRoster,
        maps: selectedMaps,
        comment: comment,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTimestamp: Date.now()
    };
    
    // Добавляем бронь в массив
    bookings.push(booking);
    
    // Сохраняем в localStorage
    saveBookingsToStorage();
    
    // Обновляем отображение
    updateBookingsDisplay();
    
    // Обновляем статус времени
    updateTimeSlotStatus(selectedTimeSlot, 'booked', teamName);
    
    // Показываем уведомление
    showNotification(`Вы успешно забронировали время ${selectedTimeSlot} для команды "${teamName}"`, 'success');
}

function resetPrakiForm() {
    // Сбрасываем выбранные карты
    document.querySelectorAll('.map-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Сбрасываем поля ввода
    document.querySelectorAll('.form-input').forEach(input => {
        input.value = '';
        input.style.borderColor = '';
    });
    
    // Сбрасываем выбранное время
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

// ===== УПРАВЛЕНИЕ БРОНИРОВАНИЯМИ =====
function loadBookings() {
    // Загружаем данные из localStorage
    if (localStorage.getItem('prakiBookings')) {
        bookings = JSON.parse(localStorage.getItem('prakiBookings'));
        
        // Проверяем дату последнего сброса
        const lastReset = localStorage.getItem('lastBookingsReset');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastReset !== today) {
            // Сбрасываем брони, если прошли сутки
            resetBookings();
        } else {
            // Обновляем отображение
            updateBookingsDisplay();
            updateTimeSlotsFromBookings();
        }
    } else {
        bookings = [];
        saveBookingsToStorage();
    }
}

function saveBookingsToStorage() {
    localStorage.setItem('prakiBookings', JSON.stringify(bookings));
}

function updateBookingsDisplay() {
    const tbody = document.getElementById('bookings-table-body');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (bookings.length === 0) {
        if (noBookingsMessage) {
            noBookingsMessage.style.display = 'block';
        }
        return;
    }
    
    if (noBookingsMessage) {
        noBookingsMessage.style.display = 'none';
    }
    
    // Сортируем по времени (ранние сверху)
    const sortedBookings = [...bookings].sort((a, b) => {
        const timeA = parseInt(a.time.split(':')[0]);
        const timeB = parseInt(b.time.split(':')[0]);
        return timeA - timeB;
    });
    
    sortedBookings.forEach(booking => {
        const row = document.createElement('tr');
        
        // Форматируем дату брони
        const bookingDate = new Date(booking.bookingDate);
        const formattedDate = bookingDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Создаем ячейки
        row.innerHTML = `
            <td><strong class="booking-time">${booking.time}</strong></td>
            <td><strong>${booking.teamName}</strong></td>
            <td>${booking.captainName}</td>
            <td>${booking.teamRoster.join(', ')}</td>
            <td>${booking.maps.join(', ')}</td>
            <td>${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function updateTimeSlotsFromBookings() {
    // Сбрасываем все слоты
    document.querySelectorAll('.time-slot').forEach(slot => {
        const time = slot.getAttribute('data-time');
        updateTimeSlotStatus(time, 'available');
    });
    
    // Обновляем занятые слоты
    bookings.forEach(booking => {
        updateTimeSlotStatus(booking.time, 'booked', booking.teamName);
    });
}

function checkBookingsReset() {
    const lastReset = localStorage.getItem('lastBookingsReset');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastReset || lastReset !== today) {
        // Сбрасываем брони
        resetBookings();
        
        // Сохраняем дату сброса
        localStorage.setItem('lastBookingsReset', today);
        
        // Показываем уведомление
        showNotification('Бронирования на новый день сброшены! Можно бронировать время заново.', 'info');
    }
}

function resetBookings() {
    // Очищаем массив бронирований
    bookings = [];
    saveBookingsToStorage();
    
    // Обновляем отображение
    updateBookingsDisplay();
    updateTimeSlotsFromBookings();
}

// ===== ИСТОРИЯ ИГР =====
function initHistory() {
    // Загружаем данные из localStorage или создаем пустой массив
    if (localStorage.getItem('gamesHistory')) {
        gamesHistory = JSON.parse(localStorage.getItem('gamesHistory'));
    } else {
        gamesHistory = []; // Пустая история
        saveGamesToStorage();
    }
    
    // Отображаем игры
    renderGamesTable();
    updateStats();
    
    // Инициализация фильтров
    initFilters();
}

function renderGamesTable() {
    const tbody = document.getElementById('games-table-body');
    const noGamesMessage = document.getElementById('no-games-message');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (gamesHistory.length === 0) {
        if (noGamesMessage) {
            noGamesMessage.style.display = 'block';
        }
        return;
    }
    
    if (noGamesMessage) {
        noGamesMessage.style.display = 'none';
    }
    
    // Сортируем по дате (новые сверху)
    const sortedGames = [...gamesHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedGames.forEach(game => {
        const row = document.createElement('tr');
        
        // Форматируем дату
        const date = new Date(game.date);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Определяем класс результата
        const resultClass = game.result;
        const resultText = game.result === 'win' ? 'Победа' : 
                          game.result === 'loss' ? 'Поражение' : 'Ничья';
        
        // Создаем ячейки
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${game.opponent}</strong></td>
            <td class="${resultClass}">${resultText} (${game.score})</td>
            <td>${game.team.join(', ')}</td>
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
    
    // Обновляем DOM элементы
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
    
    // Обновляем статистику на главной странице
    const totalGamesEl = document.getElementById('info-total-games');
    const winsEl = document.getElementById('info-wins');
    
    if (totalGamesEl) totalGamesEl.textContent = totalGames;
    if (winsEl) winsEl.textContent = wins;
}

function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const dateFilter = document.getElementById('date-filter');
    const resultFilter = document.getElementById('result-filter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            filterGames();
        });
    }
    
    // Сброс фильтров при изменении
    if (dateFilter && resultFilter) {
        dateFilter.addEventListener('change', filterGames);
        resultFilter.addEventListener('change', filterGames);
    }
}

function filterGames() {
    const dateFilter = document.getElementById('date-filter');
    const resultFilter = document.getElementById('result-filter');
    
    if (!dateFilter || !resultFilter) return;
    
    const dateValue = dateFilter.value;
    const resultValue = resultFilter.value;
    
    let filteredGames = [...gamesHistory];
    
    // Фильтр по дате
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
        
        filteredGames = filteredGames.filter(game => 
            new Date(game.date) >= startDate
        );
    }
    
    // Фильтр по результату
    if (resultValue !== 'all') {
        filteredGames = filteredGames.filter(game => 
            game.result === resultValue
        );
    }
    
    // Временно заменяем основной массив для отображения
    const tempGames = gamesHistory;
    gamesHistory = filteredGames;
    renderGamesTable();
    gamesHistory = tempGames;
}

function saveGamesToStorage() {
    localStorage.setItem('gamesHistory', JSON.stringify(gamesHistory));
}

// ===== ДРУГИЕ ЭЛЕМЕНТЫ =====
function initOtherElements() {
    // Кнопка "Присоединиться"
    const joinBtn = document.querySelector('.info-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            // Прокрутка к форме праков
            openPage('praki');
            showNotification('Забронируйте время для участия в праках', 'info');
        });
    }
    
    // Карточки игроков
    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach(card => {
        card.addEventListener('click', function() {
            const player = this.getAttribute('data-player');
            showPlayerDetails(player);
        });
    });
    
    // Социальные ссылки
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                // Открываем в новом окне
                window.open(href, '_blank');
            } else {
                e.preventDefault();
                showNotification('Ссылка временно недоступна', 'info');
            }
        });
    });
}

function showPlayerDetails(playerId) {
    const playerNames = {
        'v3k': 'V3k - Капитан команды, стратег',
        'paradox': 'Paradox - Люркер, специалист по флангам',
        'maybe': 'Maybe? - Снайпер, главный опенер',
        'blast': 'Blast - Рифлер, агрессивный энтри фрагер',
        'snowy': 'Snowy - Опенфрагер, разведчик',
        'pastic': 'Pastic - Тренер, тактик',
        'exlusev': 'exluseV - Рекрут, перспективный игрок'
    };
    
    const playerInfo = playerNames[playerId] || 'Игрок JAVATEAM';
    showNotification(playerInfo, 'info');
}

// ===== АДМИН СИСТЕМА =====
function initAdminSystem() {
    // Логотип для активации админки
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.id = 'admin-activator';
        logo.style.cursor = 'pointer';
        
        // Удаляем старый обработчик если есть
        const oldHandler = logo.onclick;
        if (oldHandler) {
            logo.removeEventListener('click', oldHandler);
        }
        
        // Добавляем новый обработчик для тройного клика
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            handleAdminClick(this);
        });
    }
    
    // Инициализация админ стилей
    initAdminStyles();
}

function handleAdminClick(element) {
    adminClickCount++;
    
    if (adminClickTimer) {
        clearTimeout(adminClickTimer);
    }
    
    // Эффект при клике
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
    
    // Если 3 клика за 1.5 секунды
    adminClickTimer = setTimeout(() => {
        if (adminClickCount >= 3) {
            // Показываем окно авторизации
            showAdminAuthModal();
            console.log('%c 🔐 АДМИН ПАНЕЛЬ: Ожидание кода доступа', 'color: #ffd700; font-size: 14px;');
        }
        adminClickCount = 0;
    }, 1500);
}

function showAdminAuthModal() {
    // Создаем модальное окно авторизации
    const modal = document.createElement('div');
    modal.id = 'admin-auth-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-lock"></i> АДМИН ДОСТУП</h3>
                <button class="modal-close" id="close-admin-auth">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="admin-code"><i class="fas fa-key"></i> Введите код доступа</label>
                    <input type="password" id="admin-code" placeholder="Введите код администратора" autocomplete="off">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-cancel" id="cancel-admin">Отмена</button>
                    <button type="button" class="btn-submit" id="submit-admin">Войти</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('admin-code').focus();
    }, 10);
    
    // Обработчики событий
    document.getElementById('close-admin-auth').addEventListener('click', closeAdminAuthModal);
    document.getElementById('cancel-admin').addEventListener('click', closeAdminAuthModal);
    
    document.getElementById('submit-admin').addEventListener('click', function() {
        const code = document.getElementById('admin-code').value;
        if (code === adminPassword) {
            isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            closeAdminAuthModal();
            showAdminPanelModal();
            updateAdminUI();
            showNotification('Админ доступ разрешен!', 'success');
            console.log('%c 🔓 АДМИН ПАНЕЛЬ: Доступ открыт', 'color: #00ff88; font-size: 14px;');
        } else {
            document.getElementById('admin-code').style.borderColor = 'var(--danger-color)';
            showNotification('Неверный код доступа!', 'error');
        }
    });
    
    // Enter для отправки
    document.getElementById('admin-code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('submit-admin').click();
        }
    });
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAdminAuthModal();
        }
    });
}

function closeAdminAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function showAdminPanelModal() {
    // Создаем модальное окно админ панели
    const modal = document.createElement('div');
    modal.id = 'admin-panel-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content admin-modal">
            <div class="modal-header">
                <h3><i class="fas fa-user-shield"></i> АДМИН ПАНЕЛЬ</h3>
                <button class="modal-close" id="close-admin-panel">&times;</button>
            </div>
            <div class="modal-body">
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="games">Управление играми</button>
                    <button class="admin-tab" data-tab="bookings">Управление бронями</button>
                    <button class="admin-tab" data-tab="system">Системные настройки</button>
                </div>
                
                <div class="admin-tab-content active" id="games-tab">
                    <h4><i class="fas fa-plus-circle"></i> Добавить новую игру</h4>
                    <form id="admin-add-game-form">
                        <div class="form-group">
                            <label for="admin-game-date"><i class="fas fa-calendar"></i> Дата игры</label>
                            <input type="date" id="admin-game-date" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-opponent"><i class="fas fa-users"></i> Противник</label>
                            <input type="text" id="admin-opponent" placeholder="Название команды" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-result"><i class="fas fa-flag"></i> Результат</label>
                            <select id="admin-result" required>
                                <option value="">Выберите результат</option>
                                <option value="win">Победа</option>
                                <option value="loss">Поражение</option>
                                <option value="draw">Ничья</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-score"><i class="fas fa-sliders-h"></i> Счет</label>
                            <input type="text" id="admin-score" placeholder="Например: 13-7" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-team"><i class="fas fa-user-friends"></i> Состав (через запятую)</label>
                            <input type="text" id="admin-team" placeholder="V3k, Paradox, Maybe?, Blast, Snowy" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin-game-comment"><i class="fas fa-comment"></i> Комментарий</label>
                            <textarea id="admin-game-comment" placeholder="Описание игры, ключевые моменты..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn-submit">Добавить игру</button>
                    </form>
                    
                    <div class="admin-divider">
                        <span>или</span>
                    </div>
                    
                    <h4><i class="fas fa-trash-alt"></i> Управление существующими играми</h4>
                    <div class="admin-games-list" id="admin-games-list">
                        <p class="no-data">Загрузка игр...</p>
                    </div>
                </div>
                
                <div class="admin-tab-content" id="bookings-tab">
                    <h4><i class="fas fa-calendar-times"></i> Управление бронированиями</h4>
                    <div class="admin-bookings-list" id="admin-bookings-list">
                        <p class="no-data">Загрузка бронирований...</p>
                    </div>
                    
                    <button class="btn-cancel" id="reset-bookings-btn">
                        <i class="fas fa-redo"></i> Сбросить все брони на сегодня
                    </button>
                </div>
                
                <div class="admin-tab-content" id="system-tab">
                    <h4><i class="fas fa-cog"></i> Системные настройки</h4>
                    
                    <div class="form-group">
                        <label for="admin-password"><i class="fas fa-key"></i> Изменить код администратора</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="password" id="new-admin-code" placeholder="Новый код" style="flex: 1;">
                            <button class="btn-submit" id="change-admin-code">Изменить</button>
                        </div>
                    </div>
                    
                    <div class="form-group" style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn-cancel" id="export-data" style="flex: 1;">
                            <i class="fas fa-download"></i> Экспорт данных
                        </button>
                        <button class="btn-cancel" id="clear-all-data" style="flex: 1;">
                            <i class="fas fa-trash"></i> Очистить все данные
                        </button>
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <button class="btn-cancel" id="logout-admin" style="width: 100%;">
                            <i class="fas fa-sign-out-alt"></i> Выйти из админ режима
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('active');
        
        // Устанавливаем сегодняшнюю дату по умолчанию
        document.getElementById('admin-game-date').value = new Date().toISOString().split('T')[0];
        
        // Загружаем данные
        loadAdminGamesList();
        loadAdminBookingsList();
        
        // Инициализируем админ панель
        initAdminPanel();
    }, 10);
}

function initAdminPanel() {
    // Вкладки
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убираем активный класс у всех
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Добавляем активный класс
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Форма добавления игры
    document.getElementById('admin-add-game-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const gameData = {
            id: Date.now(),
            date: document.getElementById('admin-game-date').value,
            opponent: document.getElementById('admin-opponent').value,
            result: document.getElementById('admin-result').value,
            score: document.getElementById('admin-score').value,
            team: document.getElementById('admin-team').value.split(',').map(name => name.trim()),
            comment: document.getElementById('admin-game-comment').value
        };
        
        // Добавляем игру
        gamesHistory.push(gameData);
        saveGamesToStorage();
        
        // Обновляем отображение
        renderGamesTable();
        updateStats();
        updateInfoStats();
        loadAdminGamesList();
        
        // Сбрасываем форму и показываем уведомление
        this.reset();
        document.getElementById('admin-game-date').value = new Date().toISOString().split('T')[0];
        showNotification('Игра успешно добавлена!', 'success');
    });
    
    // Сброс бронирований
    document.getElementById('reset-bookings-btn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите сбросить ВСЕ бронирования на сегодня?')) {
            resetBookings();
            loadAdminBookingsList();
            showNotification('Все бронирования сброшены!', 'success');
        }
    });
    
    // Изменение кода администратора
    document.getElementById('change-admin-code').addEventListener('click', function() {
        const newCode = document.getElementById('new-admin-code').value;
        if (newCode && newCode.length >= 4) {
            adminPassword = newCode;
            localStorage.setItem('adminPassword', newCode);
            document.getElementById('new-admin-code').value = '';
            showNotification('Код администратора изменен!', 'success');
        } else {
            showNotification('Код должен содержать минимум 4 символа', 'error');
        }
    });
    
    // Экспорт данных
    document.getElementById('export-data').addEventListener('click', function() {
        const data = {
            gamesHistory: gamesHistory,
            bookings: bookings,
            exportDate: new Date().toISOString(),
            team: "JavaTeam"
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `javateam-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Данные успешно экспортированы!', 'success');
    });
    
    // Очистка всех данных
    document.getElementById('clear-all-data').addEventListener('click', function() {
        if (confirm('ВНИМАНИЕ! Это удалит ВСЕ данные (игры и брони). Продолжить?')) {
            gamesHistory = [];
            bookings = [];
            localStorage.clear();
            renderGamesTable();
            updateStats();
            updateInfoStats();
            updateBookingsDisplay();
            updateTimeSlotsFromBookings();
            loadAdminGamesList();
            loadAdminBookingsList();
            showNotification('Все данные очищены!', 'success');
        }
    });
    
    // Выход из админ режима
    document.getElementById('logout-admin').addEventListener('click', function() {
        isAdmin = false;
        localStorage.setItem('isAdmin', 'false');
        closeAdminPanelModal();
        updateAdminUI();
        showNotification('Вы вышли из админ режима', 'info');
    });
    
    // Закрытие админ панели
    document.getElementById('close-admin-panel').addEventListener('click', closeAdminPanelModal);
    
    // Закрытие по клику вне окна
    document.getElementById('admin-panel-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAdminPanelModal();
        }
    });
}

function loadAdminGamesList() {
    const container = document.getElementById('admin-games-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (gamesHistory.length === 0) {
        container.innerHTML = '<p class="no-data">Игр пока нет</p>';
        return;
    }
    
    // Сортируем по дате (новые сверху)
    const sortedGames = [...gamesHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedGames.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'admin-game-item';
        const resultText = game.result === 'win' ? 'Победа' : game.result === 'loss' ? 'Поражение' : 'Ничья';
        const resultClass = game.result;
        
        gameElement.innerHTML = `
            <div class="admin-game-info">
                <strong>${new Date(game.date).toLocaleDateString('ru-RU')}</strong> - 
                ${game.opponent} - 
                <span class="${resultClass}">${resultText} (${game.score})</span>
                <br><small>Состав: ${game.team.join(', ')}</small>
            </div>
            <div class="admin-game-actions">
                <button class="btn-small btn-danger delete-game" data-id="${game.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(gameElement);
    });
    
    // Обработчики для кнопок удаления
    container.querySelectorAll('.delete-game').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameId = parseInt(this.getAttribute('data-id'));
            if (confirm('Удалить эту игру?')) {
                gamesHistory = gamesHistory.filter(game => game.id !== gameId);
                saveGamesToStorage();
                renderGamesTable();
                updateStats();
                updateInfoStats();
                loadAdminGamesList();
                showNotification('Игра удалена!', 'success');
            }
        });
    });
}

function loadAdminBookingsList() {
    const container = document.getElementById('admin-bookings-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="no-data">Бронирований нет</p>';
        return;
    }
    
    // Сортируем по времени
    const sortedBookings = [...bookings].sort((a, b) => {
        const timeA = parseInt(a.time.split(':')[0]);
        const timeB = parseInt(b.time.split(':')[0]);
        return timeA - timeB;
    });
    
    sortedBookings.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.className = 'admin-booking-item';
        
        bookingElement.innerHTML = `
            <div class="admin-booking-info">
                <strong>${booking.time}</strong> - 
                ${booking.teamName} (Капитан: ${booking.captainName})
                <br><small>Карты: ${booking.maps.join(', ')} | Состав: ${booking.teamRoster.join(', ')}</small>
            </div>
            <div class="admin-booking-actions">
                <button class="btn-small btn-danger delete-booking" data-id="${booking.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(bookingElement);
    });
    
    // Обработчики для кнопок удаления
    container.querySelectorAll('.delete-booking').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = parseInt(this.getAttribute('data-id'));
            if (confirm('Удалить это бронирование?')) {
                const booking = bookings.find(b => b.id === bookingId);
                bookings = bookings.filter(b => b.id !== bookingId);
                saveBookingsToStorage();
                updateBookingsDisplay();
                if (booking) {
                    updateTimeSlotStatus(booking.time, 'available');
                }
                loadAdminBookingsList();
                showNotification('Бронирование удалено!', 'success');
            }
        });
    });
}

function closeAdminPanelModal() {
    const modal = document.getElementById('admin-panel-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function updateAdminUI() {
    // Обновляем внешний вид логотипа в зависимости от админ режима
    const logo = document.querySelector('.logo');
    if (logo) {
        if (isAdmin) {
            logo.style.border = '2px solid #ffd700';
            logo.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
            logo.title = 'Админ режим активен';
        } else {
            logo.style.border = '';
            logo.style.boxShadow = '';
            logo.title = 'Нажмите 3 раза для админ панели';
        }
    }
    
    // Убираем кнопку "Добавить игру" из обычного интерфейса
    const addGameBtn = document.getElementById('add-game-btn');
    if (addGameBtn) {
        addGameBtn.style.display = 'none';
    }
}

function initAdminStyles() {
    // Стили уже добавлены в style.css
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    // Определяем иконку по типу
    let icon = 'fa-info-circle';
    let color = '#ffd700';
    
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            color = '#00ff88';
            break;
        case 'error':
            icon = 'fa-times-circle';
            color = '#ff4757';
            break;
        case 'info':
            icon = 'fa-info-circle';
            color = '#0099ff';
            break;
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Стили для уведомления
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
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Кнопка закрытия
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            font-size: 14px;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
            margin-left: auto;
        `;
        
        closeBtn.addEventListener('click', function() {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Автоматическое скрытие
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 3000);
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.openPage = openPage;
window.showNotification = showNotification;