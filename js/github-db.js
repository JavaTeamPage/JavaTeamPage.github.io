// github-db.js - ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🚀 GitHub DB Fixed Version Loading...');

class GitHubDB {
    constructor() {
        // === ВАШИ КЛЮЧИ ===
        this.GITHUB_TOKEN = 'ВАШ_ТОКЕН_ghp_...'; // ЗАМЕНИТЕ!
        this.GIST_ID = 'e79bef9cd93ca3b661f51903cb09914a';
        // ==================
        
        this.gistUrl = `https://gist.githubusercontent.com/${this.GIST_ID}/raw`;
        this.apiUrl = `https://api.github.com/gists/${this.GIST_ID}`;
        this.localKey = 'javateam_temp_bookings';
        this.cacheKey = 'javateam_cache';
        this.cacheTime = 5000; // 5 секунд кэш
        
        console.log('✅ DB готов с Gist ID:', this.GIST_ID);
        
        // Проверяем токен
        if (!this.GITHUB_TOKEN || this.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
            console.error('❌ ВНИМАНИЕ: GitHub Token не настроен!');
            alert('Админу: Установите GitHub Token в github-db.js!');
        }
    }

    // ===== 1. ОСНОВНЫЕ МЕТОДЫ =====
    async getBookings() {
        try {
            console.log('[DB] Загрузка броней...');
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Получаем данные из Gist
            let gistData = { bookings: [] };
            try {
                gistData = await this._fetchGistData();
                console.log('[DB] Данные Gist загружены');
            } catch (e) {
                console.warn('[DB] Gist недоступен, используем кэш');
            }
            
            // 2. Брони из Gist за сегодня
            const gistBookings = gistData.bookings.filter(b => b.bookingDate === today);
            
            // 3. Локальные брони (для немедленного отображения)
            const localBookings = this._getLocalBookings();
            
            // 4. Объединяем, убираем дубли
            const allBookingsMap = new Map();
            
            // Сначала добавляем из Gist (приоритет)
            gistBookings.forEach(b => allBookingsMap.set(b.id, b));
            
            // Затем добавляем локальные, если нет дублей
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
            
            console.log(`[DB] Итого броней: ${sortedBookings.length} (Gist: ${gistBookings.length}, Local: ${localBookings.length})`);
            return sortedBookings;
            
        } catch (error) {
            console.error('[DB] Ошибка:', error);
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
            id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
            confirmed: true
        };
        
        console.log('[DB] Создана бронь:', newBooking);
        
        // 3. Сохраняем локально (сразу видно)
        this._saveLocalBooking(newBooking);
        
        // 4. Пытаемся сохранить в Gist (общая база)
        const gistSuccess = await this._saveToGist(newBooking);
        
        if (gistSuccess) {
            // Успешно сохранили в Gist
            alert(`✅ БРОНЬ СОЗДАНА!\n\nКоманда: ${bookingData.teamName}\nВремя: ${bookingData.time}\n\nБронь видна всем пользователям!`);
            return newBooking;
        } else {
            // Не удалось сохранить в Gist, но локально есть
            alert(`⚠️ Бронь создана локально!\n\nКоманда: ${bookingData.teamName}\nВремя: ${bookingData.time}\n\nЧтобы бронь была видна всем, сообщите админу ID: ${newBooking.id}`);
            return newBooking;
        }
    }

    // ===== 2. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
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
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
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

    async _saveToGist(booking) {
        // Если нет токена - пропускаем сохранение в Gist
        if (!this.GITHUB_TOKEN || this.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
            console.warn('[DB] Token не настроен, пропускаем сохранение в Gist');
            return false;
        }
        
        try {
            console.log('[DB] Сохранение в Gist...');
            
            // 1. Получаем текущие данные
            const currentData = await this._fetchGistData();
            
            // 2. Добавляем новую бронь
            currentData.bookings = currentData.bookings || [];
            
            // Удаляем старую версию этой брони если есть
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
                    description: `JavaTeam - ${new Date().toLocaleString('ru-RU')}`,
                    files: {
                        "javateam-data.json": {
                            content: JSON.stringify(currentData, null, 2)
                        }
                    }
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GitHub API: ${response.status} - ${errorText}`);
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

    // ===== 3. ИСТОРИЯ ИГР =====
    async getGames() {
        try {
            const data = await this._fetchGistData();
            return data.games || [];
        } catch (error) {
            console.error('[DB] Ошибка загрузки игр:', error);
            return [];
        }
    }

    async addGame(game) {
        try {
            const gameObj = {
                id: `game_${Date.now()}`,
                date: game.date || new Date().toISOString().split('T')[0],
                opponent: game.opponent,
                result: game.result,
                score: game.score,
                team: game.team,
                comment: game.comment || '',
                addedAt: new Date().toISOString()
            };
            
            // Сохраняем в Gist
            const currentData = await this._fetchGistData();
            currentData.games = currentData.games || [];
            currentData.games.unshift(gameObj);
            
            const success = await this._saveToGistDirect(currentData);
            
            if (success) {
                alert('✅ Игра добавлена в историю!');
                return gameObj;
            } else {
                throw new Error('Не удалось сохранить игру');
            }
        } catch (error) {
            console.error('[DB] Ошибка добавления игры:', error);
            throw error;
        }
    }

    async _saveToGistDirect(data) {
        if (!this.GITHUB_TOKEN || this.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
            return false;
        }
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: {
                        "javateam-data.json": {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            return response.ok;
        } catch (e) {
            console.error('[DB] Ошибка прямого сохранения:', e);
            return false;
        }
    }

    // ===== 4. АДМИН ФУНКЦИИ =====
    async adminResetBookings() {
        if (!confirm('⚠️ Сбросить ВСЕ брони за сегодня?\n\nЭто действие нельзя отменить!')) {
            return { success: false, message: 'Отменено' };
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        try {
            // 1. Очищаем локальные
            localStorage.removeItem(this.localKey);
            
            // 2. Очищаем Gist
            const data = await this._fetchGistData();
            data.bookings = data.bookings.filter(b => b.bookingDate !== today);
            
            if (this.GITHUB_TOKEN && !this.GITHUB_TOKEN.includes('ВАШ_ТОКЕН')) {
                await this._saveToGistDirect(data);
            }
            
            console.log('[DB] Все брони сброшены');
            return { success: true, message: 'Брони сброшены' };
            
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
            
            return { success: true, message: 'Данные экспортированы' };
        } catch (error) {
            return { success: false, message: 'Ошибка экспорта' };
        }
    }
}

// Создаем глобальный экземпляр
const db = new GitHubDB();
console.log('✅ GitHub DB Ready!');
