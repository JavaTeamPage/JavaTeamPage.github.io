// github-db.js - БЕЗОПАСНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🚀 GitHub DB Secure Version Loading...');

class GitHubDB {
    constructor() {
        // === БЕЗОПАСНЫЙ ПОЛУЧЕНИЕ ТОКЕНА ===
        this.GITHUB_TOKEN = this._getSecureToken();
        this.GIST_ID = 'e79bef9cd93ca3b661f51903cb09914a';
        
        this.gistUrl = `https://gist.githubusercontent.com/${this.GIST_ID}/raw`;
        this.apiUrl = `https://api.github.com/gists/${this.GIST_ID}`;
        this.localKey = 'javateam_temp_bookings';
        this.cacheKey = 'javateam_cache';
        this.cacheTime = 5000;
        
        console.log('✅ DB готов с Gist ID:', this.GIST_ID);
        
        // Проверяем токен
        if (!this.GITHUB_TOKEN) {
            console.warn('⚠️ GitHub Token не найден! Работаем в локальном режиме.');
            this._showTokenWarning();
        } else {
            console.log('✅ GitHub Token загружен безопасно');
        }
    }

    // ===== БЕЗОПАСНОЕ ПОЛУЧЕНИЕ ТОКЕНА =====
    _getSecureToken() {
        // Пробуем разные способы получения токена
        const methods = [
            () => localStorage.getItem('gh_token'),
            () => {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'gh_token') return decodeURIComponent(value);
                }
                return null;
            },
            () => {
                const script = document.querySelector('script[data-gh-token]');
                return script ? script.getAttribute('data-gh-token') : null;
            }
        ];
        
        for (let method of methods) {
            try {
                const token = method();
                if (token && token.startsWith('ghp_')) {
                    return token;
                }
            } catch (e) {
                console.warn('Ошибка получения токена:', e);
            }
        }
        
        return null;
    }

    _showTokenWarning() {
        // Показываем предупреждение только админу
        setTimeout(() => {
            const adminBtn = document.querySelector('.admin-panel-btn');
            if (adminBtn && !sessionStorage.getItem('token_warn_shown')) {
                showNotification(
                    'ВНИМАНИЕ: Установите GitHub Token для синхронизации данных между пользователями.',
                    'warning',
                    8000
                );
                sessionStorage.setItem('token_warn_shown', 'true');
            }
        }, 2000);
    }

    // ===== ОСНОВНЫЕ МЕТОДЫ =====
    async getBookings() {
        try {
            console.log('[DB] Загрузка броней...');
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Получаем данные из Gist
            let gistData = { bookings: [], games: [] };
            try {
                gistData = await this._fetchGistData();
                console.log('[DB] Данные Gist загружены');
            } catch (e) {
                console.warn('[DB] Gist недоступен, используем кэш');
            }
            
            // 2. Брони из Gist за сегодня
            const gistBookings = (gistData.bookings || []).filter(b => b.bookingDate === today);
            
            // 3. Локальные брони
            const localBookings = this._getLocalBookings();
            
            // 4. Объединяем, убираем дубли
            const allBookingsMap = new Map();
            gistBookings.forEach(b => allBookingsMap.set(b.id, b));
            localBookings.forEach(b => {
                if (!allBookingsMap.has(b.id)) {
                    allBookingsMap.set(b.id, b);
                }
            });
            
            const allBookings = Array.from(allBookingsMap.values());
            
            // 5. Сортируем по времени
            const sortedBookings = allBookings.sort((a, b) => {
                const timeA = parseInt(a.time.split(':')[0]);
                const timeB = parseInt(b.time.split(':')[0]);
                return timeA - timeB;
            });
            
            console.log(`[DB] Итого броней: ${sortedBookings.length}`);
            return sortedBookings;
            
        } catch (error) {
            console.error('[DB] Ошибка загрузки броней:', error);
            return this._getLocalBookings();
        }
    }

    async addBooking(bookingData) {
        console.log('[DB] Создание брони:', bookingData);
        
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Проверяем доступность времени
        const currentBookings = await this.getBookings();
        const isTimeTaken = currentBookings.some(b => 
            b.time === bookingData.time && b.confirmed !== false
        );
        
        if (isTimeTaken) {
            throw new Error(`❌ Время ${bookingData.time} уже занято! Выберите другое время.`);
        }
        
        // 2. Создаем объект брони
        const newBooking = {
            id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            time: bookingData.time,
            teamName: bookingData.teamName,
            captainName: bookingData.captainName,
            teamRoster: Array.isArray(bookingData.teamRoster) ? 
                bookingData.teamRoster : 
                bookingData.teamRoster.split(',').map(s => s.trim()),
            maps: bookingData.maps,
            comment: bookingData.comment || '',
            bookingDate: today,
            createdAt: new Date().toISOString(),
            createdBy: 'user',
            confirmed: true,
            confirmedBy: 'auto'
        };
        
        console.log('[DB] Создана бронь ID:', newBooking.id);
        
        // 3. Сохраняем локально
        this._saveLocalBooking(newBooking);
        
        // 4. Пытаемся сохранить в Gist
        const gistSuccess = await this._saveBookingToGist(newBooking);
        
        if (gistSuccess) {
            return {
                success: true,
                booking: newBooking,
                message: 'Бронь создана и синхронизирована для всех пользователей!'
            };
        } else {
            return {
                success: true,
                booking: newBooking,
                message: 'Бронь создана локально. Сообщите админу ID для синхронизации.',
                id: newBooking.id
            };
        }
    }

    // ===== РАБОТА С GIST =====
    async _fetchGistData() {
        // Проверяем кэш
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            const cacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp < this.cacheTime) {
                return cacheData.data;
            }
        }
        
        try {
            const response = await fetch(this.gistUrl + '?t=' + Date.now(), {
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                    ...(this.GITHUB_TOKEN && {
                        'Authorization': `token ${this.GITHUB_TOKEN}`
                    })
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    // Gist не существует, создаем начальную структуру
                    return this._createInitialGist();
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Сохраняем в кэш
            localStorage.setItem(this.cacheKey, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
            
            return data;
        } catch (error) {
            console.warn('[DB] Ошибка загрузки Gist:', error);
            throw error;
        }
    }

    async _createInitialGist() {
        const initialData = {
            bookings: [],
            games: [],
            config: {
                created: new Date().toISOString(),
                version: '1.0',
                availableTimes: ['18:00', '19:00', '20:00']
            }
        };
        
        // Пытаемся создать Gist если есть токен
        if (this.GITHUB_TOKEN) {
            try {
                const response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: 'JavaTeam Data Storage',
                        public: false,
                        files: {
                            "javateam-data.json": {
                                content: JSON.stringify(initialData, null, 2)
                            }
                        }
                    })
                });
                
                if (response.ok) {
                    const gist = await response.json();
                    console.log('[DB] Создан новый Gist:', gist.id);
                    return initialData;
                }
            } catch (e) {
                console.warn('[DB] Не удалось создать Gist:', e);
            }
        }
        
        return initialData;
    }

    async _saveBookingToGist(booking) {
        if (!this.GITHUB_TOKEN) {
            console.warn('[DB] Token отсутствует, пропускаем сохранение в Gist');
            return false;
        }
        
        try {
            console.log('[DB] Сохранение брони в Gist...');
            
            // 1. Получаем текущие данные
            const currentData = await this._fetchGistData();
            
            // 2. Добавляем новую бронь
            currentData.bookings = currentData.bookings || [];
            
            // Удаляем старую версию если есть
            currentData.bookings = currentData.bookings.filter(b => b.id !== booking.id);
            
            // Добавляем новую
            currentData.bookings.push(booking);
            
            // 3. Отправляем на GitHub
            const response = await fetch(this.apiUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    description: `JavaTeam - Обновлено: ${new Date().toLocaleString('ru-RU')}`,
                    files: {
                        "javateam-data.json": {
                            content: JSON.stringify(currentData, null, 2)
                        }
                    }
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[DB] Ошибка GitHub API:', errorText);
                return false;
            }
            
            console.log('[DB] Успешно сохранено в Gist!');
            
            // Обновляем кэш
            localStorage.setItem(this.cacheKey, JSON.stringify({
                data: currentData,
                timestamp: Date.now()
            }));
            
            return true;
            
        } catch (error) {
            console.error('[DB] Ошибка сохранения в Gist:', error);
            return false;
        }
    }

    // ===== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ =====
    _saveLocalBooking(booking) {
        try {
            const bookings = JSON.parse(localStorage.getItem(this.localKey) || '[]');
            // Удаляем старую версию если есть
            const filtered = bookings.filter(b => b.id !== booking.id);
            filtered.push(booking);
            localStorage.setItem(this.localKey, JSON.stringify(filtered));
            console.log('[DB] Сохранено локально');
        } catch (e) {
            console.error('[DB] Ошибка локального сохранения:', e);
        }
    }

    _getLocalBookings() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const bookings = JSON.parse(localStorage.getItem(this.localKey) || '[]');
            return bookings.filter(b => b.bookingDate === today);
        } catch (e) {
            console.error('[DB] Ошибка чтения локальных данных:', e);
            return [];
        }
    }

    // ===== ИСТОРИЯ ИГР =====
    async getGames() {
        try {
            const data = await this._fetchGistData();
            return data.games || [];
        } catch (error) {
            console.error('[DB] Ошибка загрузки игр:', error);
            return [];
        }
    }

    async addGame(gameData) {
        try {
            const game = {
                id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                date: gameData.date || new Date().toISOString().split('T')[0],
                opponent: gameData.opponent,
                result: gameData.result,
                score: gameData.score || '',
                team: Array.isArray(gameData.team) ? gameData.team : gameData.team.split(',').map(s => s.trim()),
                comment: gameData.comment || '',
                addedAt: new Date().toISOString(),
                addedBy: 'admin'
            };
            
            // Сохраняем в Gist
            const currentData = await this._fetchGistData();
            currentData.games = currentData.games || [];
            currentData.games.unshift(game); // Добавляем в начало
            
            if (this.GITHUB_TOKEN) {
                const response = await fetch(this.apiUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            "javateam-data.json": {
                                content: JSON.stringify(currentData, null, 2)
                            }
                        }
                    })
                });
                
                if (response.ok) {
                    // Обновляем кэш
                    localStorage.setItem(this.cacheKey, JSON.stringify({
                        data: currentData,
                        timestamp: Date.now()
                    }));
                    
                    return {
                        success: true,
                        game: game,
                        message: 'Игра добавлена в историю!'
                    };
                }
            }
            
            // Если нет токена или не удалось сохранить
            return {
                success: true,
                game: game,
                message: 'Игра добавлена локально'
            };
            
        } catch (error) {
            console.error('[DB] Ошибка добавления игры:', error);
            throw error;
        }
    }

    // ===== АДМИН ФУНКЦИИ =====
    async adminResetBookings() {
        if (!confirm('⚠️ Сбросить ВСЕ брони за сегодня?\n\nЭто действие нельзя отменить!')) {
            return { success: false, message: 'Отменено' };
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        try {
            // 1. Очищаем локальные брони за сегодня
            const allLocalBookings = JSON.parse(localStorage.getItem(this.localKey) || '[]');
            const filteredLocalBookings = allLocalBookings.filter(b => b.bookingDate !== today);
            localStorage.setItem(this.localKey, JSON.stringify(filteredLocalBookings));
            
            // 2. Очищаем Gist
            if (this.GITHUB_TOKEN) {
                const data = await this._fetchGistData();
                const previousBookings = data.bookings.filter(b => b.bookingDate !== today);
                data.bookings = previousBookings;
                
                await fetch(this.apiUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            "javateam-data.json": {
                                content: JSON.stringify(data, null, 2)
                            }
                        }
                    })
                });
                
                // Обновляем кэш
                localStorage.setItem(this.cacheKey, JSON.stringify({
                    data: data,
                    timestamp: Date.now()
                }));
            }
            
            console.log('[DB] Все брони сброшены');
            return { 
                success: true, 
                message: 'Брони за сегодня сброшены',
                resetAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('[DB] Ошибка сброса:', error);
            return { success: false, message: 'Ошибка: ' + error.message };
        }
    }

    async adminExportData() {
        try {
            const data = await this._fetchGistData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `javateam-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            return { 
                success: true, 
                message: 'Данные экспортированы',
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            return { 
                success: false, 
                message: 'Ошибка экспорта: ' + error.message 
            };
        }
    }

    getLocalStorageStats() {
        try {
            const bookings = JSON.parse(localStorage.getItem(this.localKey) || '[]');
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = bookings.filter(b => b.bookingDate === today);
            
            return {
                total: bookings.length,
                today: todayBookings.length,
                lastUpdated: localStorage.getItem(`${this.localKey}_updated`) || null
            };
        } catch (e) {
            return { total: 0, today: 0, lastUpdated: null };
        }
    }

    async syncLocalWithGitHub() {
        if (!this.GITHUB_TOKEN) {
            return { 
                success: false, 
                message: 'GitHub Token не настроен. Установите токен в настройках.' 
            };
        }
        
        try {
            const localBookings = JSON.parse(localStorage.getItem(this.localKey) || '[]');
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = localBookings.filter(b => b.bookingDate === today);
            
            if (todayBookings.length === 0) {
                return { 
                    success: true, 
                    message: 'Нет локальных броней для синхронизации' 
                };
            }
            
            // Загружаем текущие данные из Gist
            const gistData = await this._fetchGistData();
            gistData.bookings = gistData.bookings || [];
            
            // Добавляем локальные брони в Gist
            let addedCount = 0;
            todayBookings.forEach(booking => {
                const exists = gistData.bookings.some(b => b.id === booking.id);
                if (!exists) {
                    gistData.bookings.push(booking);
                    addedCount++;
                }
            });
            
            // Сохраняем в Gist
            const response = await fetch(this.apiUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        "javateam-data.json": {
                            content: JSON.stringify(gistData, null, 2)
                        }
                    }
                })
            });
            
            if (response.ok) {
                // Обновляем кэш
                localStorage.setItem(this.cacheKey, JSON.stringify({
                    data: gistData,
                    timestamp: Date.now()
                }));
                
                return { 
                    success: true, 
                    message: `Синхронизировано ${addedCount} броней`,
                    synced: addedCount
                };
            } else {
                return { 
                    success: false, 
                    message: 'Ошибка синхронизации с GitHub' 
                };
            }
            
        } catch (error) {
            console.error('[DB] Ошибка синхронизации:', error);
            return { 
                success: false, 
                message: 'Ошибка синхронизации: ' + error.message 
            };
        }
    }

    async checkTokenStatus() {
        if (!this.GITHUB_TOKEN) {
            return {
                valid: false,
                message: 'Токен не настроен',
                scopes: []
            };
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                return {
                    valid: true,
                    message: `Токен действителен. Пользователь: ${user.login}`,
                    user: user.login,
                    scopes: ['gist'] // Предполагаем что есть доступ к gist
                };
            } else {
                return {
                    valid: false,
                    message: `Токен недействителен (HTTP ${response.status})`,
                    scopes: []
                };
            }
        } catch (error) {
            return {
                valid: false,
                message: 'Ошибка проверки токена: ' + error.message,
                scopes: []
            };
        }
    }
}

// Создаем глобальный экземпляр
const db = new GitHubDB();

// Вспомогательные функции для работы с UI
function showNotification(message, type = 'info', duration = 5000) {
    // Функция будет реализована в ui.js
    console.log(`[Notification ${type}]: ${message}`);
}

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitHubDB, db };
}

console.log('✅ GitHub DB Secure Version Ready!');
