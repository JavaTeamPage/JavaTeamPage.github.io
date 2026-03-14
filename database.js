// ============================================
//      JAVATEAM - БАЗА ДАННЫХ
//      СТИЛЬ AIREX TEAM
// ============================================

const JAVATEAM_DB = (function() {
    // Ключи для хранения
    const STORAGE_KEYS = {
        TIMES: 'javateam_available_times',
        BOOKINGS: 'javateam_confirmed_bookings',
        PENDING: 'javateam_pending_requests',
        HISTORY: 'javateam_match_history',
        PLAYERS: 'javateam_team_roster'
    };

    // ===== СОСТАВ КОМАНДЫ =====
    const TEAM_ROSTER = {
        main: [
            { nick: 'Эклипсе', id: '159742523', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'LEGENDS', device: '📱' },
            { nick: 'Bloodaim', id: '228967585', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'LEGENDS', device: '📱' },
            { nick: 'D3lrayyy', id: '165878779', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'LEGENDS', device: '📱' },
            { nick: 'Desent', id: '78443609', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'LEGENDS', device: '📱' },
            { nick: 'Lukolivov', id: '18587432', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'LEGENDS', device: '📱' }
        ],
        reserve: [
            { nick: 'Blast', id: '11223344', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'UNRANKED', device: '💻' },
            { nick: 'Qw3ak', id: '55667788', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'UNRANKED', device: '💻' },
            { nick: 'Paradox', id: '99001122', stats: { kd: '0', matches: '0', hours: '0' }, rank: 'UNRANKED', device: '💻' }
        ]
    };

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function init() {
        // Создаем пустые хранилища если их нет
        if (!localStorage.getItem(STORAGE_KEYS.TIMES)) {
            localStorage.setItem(STORAGE_KEYS.TIMES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PENDING)) {
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PLAYERS)) {
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(TEAM_ROSTER));
        }
    }

    init();

    return {
        // ===== ВРЕМЯ (ДЛЯ ПРАКОВ) =====
        getAvailableTimes: function() {
            const times = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMES));
            const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
            const bookedTimes = bookings.map(b => b.time);
            return times.filter(t => !bookedTimes.includes(t));
        },

        getAllTimes: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMES));
        },

        addTime: function(time) {
            const times = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMES));
            if (times.includes(time)) return { success: false, error: 'Время уже существует' };
            times.push(time);
            times.sort();
            localStorage.setItem(STORAGE_KEYS.TIMES, JSON.stringify(times));
            return { success: true };
        },

        removeTime: function(time) {
            let times = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMES));
            times = times.filter(t => t !== time);
            localStorage.setItem(STORAGE_KEYS.TIMES, JSON.stringify(times));
            return { success: true };
        },

        // ===== ЗАЯВКИ =====
        getPending: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING));
        },

        addPending: function(data) {
            const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING));
            const exists = pending.find(p => p.time === data.time);
            if (exists) return { success: false, error: 'Время уже занято' };
            
            const newRequest = {
                id: Date.now(),
                ...data,
                createdAt: new Date().toISOString()
            };
            pending.push(newRequest);
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pending));
            return { success: true, id: newRequest.id };
        },

        confirmRequest: function(id) {
            const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING));
            const index = pending.findIndex(r => r.id == id);
            if (index === -1) return { success: false };
            
            const request = pending[index];
            const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
            bookings.push({
                time: request.time,
                team: request.team,
                confirmedAt: new Date().toISOString()
            });
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
            
            pending.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pending));
            return { success: true, request };
        },

        rejectRequest: function(id) {
            let pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING));
            pending = pending.filter(r => r.id != id);
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pending));
            return { success: true };
        },

        // ===== ПОДТВЕРЖДЕННЫЕ ПРАКИ =====
        getConfirmed: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
        },

        // ===== ИСТОРИЯ МАТЧЕЙ =====
        getHistory: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY));
        },

        addMatchToHistory: function(match) {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY));
            const newMatch = {
                id: Date.now(),
                ...match,
                createdAt: new Date().toISOString()
            };
            history.unshift(newMatch);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return { success: true };
        },

        removeFromHistory: function(id) {
            let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY));
            history = history.filter(m => m.id != id);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return { success: true };
        },

        // ===== СОСТАВ =====
        getMainRoster: function() {
            const roster = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS));
            return roster.main || [];
        },

        getReserveRoster: function() {
            const roster = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS));
            return roster.reserve || [];
        },

        // ===== СБРОС ВСЕХ ДАННЫХ =====
        resetAll: function() {
            localStorage.setItem(STORAGE_KEYS.TIMES, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
            // Состав не сбрасываем!
            return { success: true };
        }
    };
})();

window.JAVATEAM_DB = JAVATEAM_DB;
console.log('✅ JAVATEAM Database Ready');
console.log('📊 Состав загружен');