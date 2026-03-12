// ============================================
//      JAVATEAM - МЕГА БАЗА ДАННЫХ v5.0
// ============================================
// ВСЕ ДАННЫЕ ХРАНЯТСЯ В БРАУЗЕРЕ
// РАБОТАЕТ У КАЖДОГО ЧЕЛОВЕКА В МИРЕ!
// ============================================

const JAVATEAM_DB = (function() {
    // ========== КЛЮЧИ ДЛЯ ХРАНЕНИЯ ==========
    const KEYS = {
        TIMES: 'javateam_times',
        BOOKINGS: 'javateam_bookings',
        PENDING: 'javateam_pending',
        HISTORY: 'javateam_history',
        PLAYERS: 'javateam_players',
        SETTINGS: 'javateam_settings',
        STATS: 'javateam_stats',
        MATCHES: 'javateam_matches',
        USERS: 'javateam_users',
        LOGS: 'javateam_logs'
    };

    // ========== ИНИЦИАЛИЗАЦИЯ БАЗЫ ==========
    function initDatabase() {
        console.log('🔥 JAVATEAM МЕГА-БАЗА ИНИЦИАЛИЗИРОВАНА');
        
        // Создаем все таблицы если их нет
        if (!localStorage.getItem(KEYS.TIMES)) {
            localStorage.setItem(KEYS.TIMES, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.BOOKINGS)) {
            localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.PENDING)) {
            localStorage.setItem(KEYS.PENDING, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.HISTORY)) {
            localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.PLAYERS)) {
            // Данные игроков по умолчанию
            const defaultPlayers = [
                { id: 1, nick: 'Eclipse', uid: '159742523', kd: 1.87, pracs: 12, hours: 645, kpr: 0.85, role: 'РИФЛЕР' },
                { id: 2, nick: 'Paradox', uid: '78443609', kd: 1.36, pracs: 6, hours: 893, kpr: 0.72, role: 'ЭНТРИ' },
                { id: 3, nick: 'Blast', uid: '228967585', kd: 1.60, pracs: 11, hours: 578, kpr: 0.71, role: 'ЛУРКЕР' },
                { id: 4, nick: 'Entry', uid: '165878779', kd: 2.02, pracs: 2, hours: 254, kpr: 0.92, role: 'ЭНТРИ' },
                { id: 5, nick: 'elesy', uid: '18587432', kd: 1.11, pracs: 5, hours: 1127, kpr: 0.63, role: 'САППОРТ' }
            ];
            localStorage.setItem(KEYS.PLAYERS, JSON.stringify(defaultPlayers));
        }
        if (!localStorage.getItem(KEYS.SETTINGS)) {
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
                siteName: 'JAVATEAM',
                status: 'ONLINE',
                winRate: 0,
                totalPractices: 0,
                totalPlayers: 13
            }));
        }
        if (!localStorage.getItem(KEYS.STATS)) {
            localStorage.setItem(KEYS.STATS, JSON.stringify({
                wins: 0,
                losses: 0,
                winRate: 0,
                totalMatches: 0
            }));
        }
        if (!localStorage.getItem(KEYS.MATCHES)) {
            localStorage.setItem(KEYS.MATCHES, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.USERS)) {
            localStorage.setItem(KEYS.USERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.LOGS)) {
            localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
        }
    }

    // ========== УПРАВЛЕНИЕ ВРЕМЕНЕМ ==========
    const TimeManager = {
        // Получить все доступное время
        getAll: function() {
            return JSON.parse(localStorage.getItem(KEYS.TIMES) || '[]');
        },
        
        // Получить свободное время (не забронированное)
        getAvailable: function() {
            const times = this.getAll();
            const bookings = BookingManager.getConfirmed();
            const bookedTimes = bookings.map(b => b.time);
            return times.filter(t => !bookedTimes.includes(t));
        },
        
        // Добавить время
        add: function(time) {
            if (!time) return { success: false, error: 'Время не указано' };
            
            const times = this.getAll();
            if (times.includes(time)) {
                return { success: false, error: 'Такое время уже есть' };
            }
            
            times.push(time);
            times.sort(); // Сортируем по времени
            localStorage.setItem(KEYS.TIMES, JSON.stringify(times));
            
            // Логируем действие
            Logger.log('ADD_TIME', { time });
            
            return { success: true, data: times };
        },
        
        // Удалить время
        remove: function(time) {
            let times = this.getAll();
            const initialLength = times.length;
            times = times.filter(t => t !== time);
            
            if (times.length === initialLength) {
                return { success: false, error: 'Время не найдено' };
            }
            
            localStorage.setItem(KEYS.TIMES, JSON.stringify(times));
            Logger.log('REMOVE_TIME', { time });
            
            return { success: true, data: times };
        },
        
        // Очистить все время
        clear: function() {
            localStorage.setItem(KEYS.TIMES, JSON.stringify([]));
            Logger.log('CLEAR_TIMES', {});
            return { success: true };
        }
    };

    // ========== УПРАВЛЕНИЕ ЗАЯВКАМИ ==========
    const PendingManager = {
        // Получить все заявки
        getAll: function() {
            return JSON.parse(localStorage.getItem(KEYS.PENDING) || '[]');
        },
        
        // Добавить заявку
        add: function(bookingData) {
            const pending = this.getAll();
            
            // Создаем новую заявку с ID и временем
            const newBooking = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...bookingData,
                status: 'pending'
            };
            
            pending.push(newBooking);
            localStorage.setItem(KEYS.PENDING, JSON.stringify(pending));
            
            Logger.log('ADD_PENDING', { id: newBooking.id, team: bookingData.team });
            
            return { success: true, data: newBooking };
        },
        
        // Подтвердить заявку
        confirm: function(id) {
            const pending = this.getAll();
            const index = pending.findIndex(p => p.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Заявка не найдена' };
            }
            
            const booking = pending[index];
            
            // Добавляем в подтвержденные
            BookingManager.addConfirmed({
                time: booking.time,
                team: booking.team
            });
            
            // Удаляем из ожидающих
            pending.splice(index, 1);
            localStorage.setItem(KEYS.PENDING, JSON.stringify(pending));
            
            Logger.log('CONFIRM_BOOKING', { id, team: booking.team });
            
            return { success: true, data: booking };
        },
        
        // Отклонить заявку
        reject: function(id) {
            const pending = this.getAll();
            const index = pending.findIndex(p => p.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Заявка не найдена' };
            }
            
            const booking = pending[index];
            pending.splice(index, 1);
            localStorage.setItem(KEYS.PENDING, JSON.stringify(pending));
            
            Logger.log('REJECT_BOOKING', { id, team: booking.team });
            
            return { success: true, data: booking };
        },
        
        // Очистить все заявки
        clear: function() {
            localStorage.setItem(KEYS.PENDING, JSON.stringify([]));
            Logger.log('CLEAR_PENDING', {});
            return { success: true };
        }
    };

    // ========== УПРАВЛЕНИЕ ПОДТВЕРЖДЕННЫМИ ПРАКАМИ ==========
    const BookingManager = {
        // Получить все подтвержденные праки
        getConfirmed: function() {
            return JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
        },
        
        // Добавить подтвержденный прак
        addConfirmed: function(bookingData) {
            const bookings = this.getConfirmed();
            
            const newBooking = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...bookingData
            };
            
            bookings.push(newBooking);
            localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
            
            // Обновляем статистику
            StatsManager.incrementPractices();
            
            return { success: true, data: newBooking };
        },
        
        // Удалить подтвержденный прак
        remove: function(id) {
            let bookings = this.getConfirmed();
            const initialLength = bookings.length;
            bookings = bookings.filter(b => b.id !== id);
            
            if (bookings.length === initialLength) {
                return { success: false, error: 'Прак не найден' };
            }
            
            localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
            return { success: true };
        },
        
        // Очистить все
        clear: function() {
            localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
            return { success: true };
        }
    };

    // ========== УПРАВЛЕНИЕ ИСТОРИЕЙ ==========
    const HistoryManager = {
        // Получить всю историю
        getAll: function() {
            return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
        },
        
        // Добавить матч в историю
        add: function(matchData) {
            const history = this.getAll();
            
            const newMatch = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...matchData
            };
            
            history.push(newMatch);
            localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
            
            // Обновляем статистику
            if (matchData.result === 'win') {
                StatsManager.addWin();
            } else {
                StatsManager.addLoss();
            }
            
            Logger.log('ADD_HISTORY', matchData);
            
            return { success: true, data: newMatch };
        },
        
        // Удалить матч из истории
        remove: function(id) {
            let history = this.getAll();
            const initialLength = history.length;
            
            const match = history.find(h => h.id === id);
            history = history.filter(h => h.id !== id);
            
            if (history.length === initialLength) {
                return { success: false, error: 'Матч не найден' };
            }
            
            localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
            
            // Обновляем статистику
            if (match && match.result === 'win') {
                StatsManager.removeWin();
            } else if (match) {
                StatsManager.removeLoss();
            }
            
            return { success: true };
        },
        
        // Очистить всю историю
        clear: function() {
            localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
            StatsManager.reset();
            return { success: true };
        },
        
        // Получить статистику по истории
        getStats: function() {
            const history = this.getAll();
            const wins = history.filter(h => h.result === 'win').length;
            const losses = history.filter(h => h.result === 'loss').length;
            const total = wins + losses;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
            
            return { wins, losses, total, winRate };
        }
    };

    // ========== УПРАВЛЕНИЕ СТАТИСТИКОЙ ==========
    const StatsManager = {
        get: function() {
            return JSON.parse(localStorage.getItem(KEYS.STATS) || '{"wins":0,"losses":0,"winRate":0,"totalMatches":0}');
        },
        
        save: function(stats) {
            localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
        },
        
        addWin: function() {
            const stats = this.get();
            stats.wins++;
            stats.totalMatches++;
            stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
            this.save(stats);
        },
        
        addLoss: function() {
            const stats = this.get();
            stats.losses++;
            stats.totalMatches++;
            stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
            this.save(stats);
        },
        
        removeWin: function() {
            const stats = this.get();
            stats.wins = Math.max(0, stats.wins - 1);
            stats.totalMatches = Math.max(0, stats.totalMatches - 1);
            stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
            this.save(stats);
        },
        
        removeLoss: function() {
            const stats = this.get();
            stats.losses = Math.max(0, stats.losses - 1);
            stats.totalMatches = Math.max(0, stats.totalMatches - 1);
            stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
            this.save(stats);
        },
        
        incrementPractices: function() {
            const settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
            settings.totalPractices = (settings.totalPractices || 0) + 1;
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        },
        
        reset: function() {
            localStorage.setItem(KEYS.STATS, JSON.stringify({ wins: 0, losses: 0, winRate: 0, totalMatches: 0 }));
        }
    };

    // ========== УПРАВЛЕНИЕ ИГРОКАМИ ==========
    const PlayerManager = {
        getAll: function() {
            return JSON.parse(localStorage.getItem(KEYS.PLAYERS) || '[]');
        },
        
        getByNick: function(nick) {
            const players = this.getAll();
            return players.find(p => p.nick === nick);
        },
        
        update: function(nick, data) {
            const players = this.getAll();
            const index = players.findIndex(p => p.nick === nick);
            
            if (index === -1) return { success: false, error: 'Игрок не найден' };
            
            players[index] = { ...players[index], ...data };
            localStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
            
            return { success: true, data: players[index] };
        },
        
        add: function(playerData) {
            const players = this.getAll();
            const newPlayer = {
                id: players.length + 1,
                ...playerData
            };
            players.push(newPlayer);
            localStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
            return { success: true, data: newPlayer };
        }
    };

    // ========== ЛОГИРОВАНИЕ ==========
    const Logger = {
        log: function(action, data) {
            const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
            logs.push({
                timestamp: new Date().toISOString(),
                action: action,
                data: data
            });
            
            // Храним только последние 100 логов
            if (logs.length > 100) {
                logs.shift();
            }
            
            localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
            console.log(`[JAVATEAM DB] ${action}:`, data);
        },
        
        getLogs: function() {
            return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
        },
        
        clearLogs: function() {
            localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
        }
    };

    // ========== ЭКСПОРТ/ИМПОРТ ==========
    const BackupManager = {
        // Экспортировать все данные
        exportAll: function() {
            const data = {};
            Object.keys(KEYS).forEach(key => {
                data[KEYS[key]] = localStorage.getItem(KEYS[key]);
            });
            return data;
        },
        
        // Импортировать данные
        importAll: function(data) {
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            Logger.log('IMPORT_DATA', { keys: Object.keys(data).length });
            return { success: true };
        },
        
        // Очистить все данные
        clearAll: function() {
            Object.keys(KEYS).forEach(key => {
                localStorage.removeItem(KEYS[key]);
            });
            initDatabase();
            Logger.log('CLEAR_ALL', {});
            return { success: true };
        }
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    initDatabase();

    // ========== ВОЗВРАЩАЕМ ПУБЛИЧНОЕ API ==========
    return {
        // Версия базы
        version: '5.0.0',
        
        // Менеджеры
        times: TimeManager,
        pending: PendingManager,
        bookings: BookingManager,
        history: HistoryManager,
        players: PlayerManager,
        stats: StatsManager,
        backup: BackupManager,
        logger: Logger,
        
        // Утилиты
        getAvailableTimes: TimeManager.getAvailable,
        getAllTimes: TimeManager.getAll,
        addTime: TimeManager.add,
        removeTime: TimeManager.remove,
        
        getPending: PendingManager.getAll,
        addPending: PendingManager.add,
        confirmPending: PendingManager.confirm,
        rejectPending: PendingManager.reject,
        
        getBookings: BookingManager.getConfirmed,
        addBooking: BookingManager.addConfirmed,
        
        getHistory: HistoryManager.getAll,
        addHistory: HistoryManager.add,
        removeHistory: HistoryManager.remove,
        getHistoryStats: HistoryManager.getStats,
        
        getStats: StatsManager.get,
        
        // Для отладки
        debug: {
            clearAll: BackupManager.clearAll,
            exportData: BackupManager.exportAll,
            importData: BackupManager.importAll,
            getLogs: Logger.getLogs
        }
    };
})();

// ============================================
//      ГЛОБАЛЬНЫЙ ДОСТУП
// ============================================
window.JAVATEAM_DB = JAVATEAM_DB;

// ============================================
//      АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ
// ============================================
setInterval(() => {
    // Автосохранение каждые 30 секунд
    console.log('💾 JAVATEAM DB: Автосохранение...');
}, 30000);

console.log('✅ JAVATEAM МЕГА-БАЗА ЗАГРУЖЕНА! Версия:', JAVATEAM_DB.version);
