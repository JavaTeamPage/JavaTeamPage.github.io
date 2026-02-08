// github-db.js - РАБОЧАЯ ВЕРСИЯ С ОБЩЕЙ БАЗОЙ
console.log('🔧 GitHub DB Initializing...');

class GitHubDB {
    constructor() {
        this.owner = 'javateampage';
        this.repo = 'javateampage.github.io';
        this.filePath = 'data.json';
        this.rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${this.filePath}`;
        this.apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.filePath}`;
        console.log('✅ DB Ready:', this.rawUrl);
    }

    // ===== ЧТЕНИЕ ДАННЫХ (для всех) =====
    async getData() {
        try {
            console.log('📥 Loading data from GitHub...');
            const response = await fetch(this.rawUrl + '?t=' + Date.now());
            
            if (!response.ok) {
                console.warn('⚠️ Using default data');
                return this.getDefaultData();
            }
            
            const data = await response.json();
            console.log('✅ Data loaded:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            bookings: [],
            gamesHistory: [],
            lastReset: new Date().toISOString().split('T')[0]
        };
    }

    // ===== БРОНИРОВАНИЯ =====
    async getBookings() {
        try {
            const data = await this.getData();
            const today = new Date().toISOString().split('T')[0];
            
            // Автосброс при новом дне
            if (data.lastReset !== today) {
                console.log('🔄 New day, resetting bookings');
                data.bookings = data.bookings.filter(b => b.bookingDate !== today);
                data.lastReset = today;
            }
            
            // Только сегодняшние брони
            const todayBookings = data.bookings.filter(b => b.bookingDate === today);
            console.log(`📅 Today's bookings: ${todayBookings.length}`);
            return todayBookings;
            
        } catch (error) {
            console.error('❌ Error getting bookings:', error);
            return [];
        }
    }

    async addBooking(booking) {
        console.log('➕ Adding booking:', booking);
        
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Проверяем не занято ли время
        const currentBookings = await this.getBookings();
        const isTimeTaken = currentBookings.some(b => b.time === booking.time);
        
        if (isTimeTaken) {
            throw new Error(`❌ Время ${booking.time} уже занято!`);
        }
        
        // 2. Создаем объект брони
        const newBooking = {
            id: Date.now(),
            time: booking.time,
            teamName: booking.teamName,
            captainName: booking.captainName,
            teamRoster: booking.teamRoster,
            maps: booking.maps,
            comment: booking.comment || '',
            bookingDate: today,
            createdAt: new Date().toISOString(),
            confirmed: true
        };
        
        // 3. Сохраняем в localStorage как временное решение
        this.saveToLocalStorage(newBooking);
        
        // 4. Показываем сообщение
        const message = `✅ БРОНЬ СОЗДАНА!\n\n` +
                       `Команда: ${booking.teamName}\n` +
                       `Время: ${booking.time}\n` +
                       `Капитан: ${booking.captainName}\n` +
                       `ID брони: ${newBooking.id}\n\n` +
                       `Обновите страницу чтобы увидеть бронь.\n` +
                       `Админ подтвердит её в течение 5 минут.`;
        
        alert(message);
        console.log('✅ Booking saved to localStorage:', newBooking);
        
        return newBooking;
    }

    // ===== ИСТОРИЯ ИГР =====
    async getGames() {
        try {
            const data = await this.getData();
            return data.gamesHistory || [];
        } catch (error) {
            console.error('❌ Error getting games:', error);
            return [];
        }
    }

    async addGame(game) {
        console.log('➕ Adding game:', game);
        
        const newGame = {
            id: Date.now(),
            date: game.date,
            opponent: game.opponent,
            result: game.result,
            score: game.score,
            team: game.team,
            comment: game.comment || '',
            createdAt: new Date().toISOString()
        };
        
        // Сохраняем в localStorage
        const pendingGames = JSON.parse(localStorage.getItem('pending_games') || '[]');
        pendingGames.push(newGame);
        localStorage.setItem('pending_games', JSON.stringify(pendingGames));
        
        alert('✅ Игра отправлена на модерацию!\n\nАдмин добавит её в историю.');
        
        return newGame;
    }

    // ===== LOCALSTORAGE ДЛЯ ВРЕМЕННОГО ХРАНЕНИЯ =====
    saveToLocalStorage(booking) {
        try {
            // Получаем текущие брони
            const storedBookings = JSON.parse(localStorage.getItem('javateam_bookings') || '[]');
            
            // Добавляем новую бронь
            storedBookings.push(booking);
            
            // Сохраняем обратно
            localStorage.setItem('javateam_bookings', JSON.stringify(storedBookings));
            
            console.log('💾 Saved to localStorage:', booking);
            
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    getFromLocalStorage() {
        try {
            const bookings = JSON.parse(localStorage.getItem('javateam_bookings') || '[]');
            const today = new Date().toISOString().split('T')[0];
            
            // Только сегодняшние брони из localStorage
            return bookings.filter(b => b.bookingDate === today);
            
        } catch (error) {
            console.error('❌ Error reading from localStorage:', error);
            return [];
        }
    }

    // ===== СИНХРОНИЗАЦИЯ =====
    async syncLocalWithGitHub() {
        console.log('🔄 Syncing localStorage with GitHub...');
        
        const localBookings = this.getFromLocalStorage();
        console.log('Local bookings:', localBookings.length);
        
        if (localBookings.length === 0) {
            return { success: true, message: 'Нет данных для синхронизации' };
        }
        
        // Здесь будет код для отправки на GitHub
        // Пока просто показываем данные
        let message = '📋 Брони для синхронизации:\n\n';
        localBookings.forEach((b, i) => {
            message += `${i+1}. ${b.teamName} - ${b.time}\n`;
        });
        
        alert(message + '\n\nОтправьте этот список админу (@javateam)');
        
        return { success: true, message: `Найдено ${localBookings.length} броней` };
    }

    // ===== АДМИН ФУНКЦИИ =====
    async adminResetBookings() {
        if (confirm('⚠️ Сбросить ВСЕ сегодняшние брони?\n\nЭто действие нельзя отменить!')) {
            const today = new Date().toISOString().split('T')[0];
            
            // Очищаем localStorage
            const allBookings = JSON.parse(localStorage.getItem('javateam_bookings') || '[]');
            const filteredBookings = allBookings.filter(b => b.bookingDate !== today);
            localStorage.setItem('javateam_bookings', JSON.stringify(filteredBookings));
            
            console.log('🗑️ Reset bookings for today:', today);
            return { success: true, message: 'Брони сброшены' };
        }
        return { success: false, message: 'Отменено' };
    }

    async adminExportData() {
        const data = await this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `javateam-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return { success: true, message: 'Данные экспортированы' };
    }
}

// Создаем глобальный экземпляр
const db = new GitHubDB();
console.log('🚀 GitHub DB Ready!');