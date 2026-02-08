// github-db-safe.js - БЕЗОПАСНАЯ ВЕРСИЯ
class SafeGitHubDB {
    constructor() {
        this.owner = 'javateampage';
        this.repo = 'javateampage.github.io';
        this.filePath = 'data.json';
        this.baseUrl = 'https://raw.githubusercontent.com';
    }

    // Чтение БЕЗ токена (публичный доступ)
    async getData() {
        try {
            const response = await fetch(
                `${this.baseUrl}/${this.owner}/${this.repo}/main/${this.filePath}?t=${Date.now()}`
            );
            return await response.json();
        } catch (error) {
            return {bookings: [], gamesHistory: [], lastReset: new Date().toISOString().split('T')[0]};
        }
    }

    // Запись через localStorage + ручная синхронизация
    async addBooking(booking) {
        // Сохраняем в localStorage как "ожидающие модерации"
        const pendingBookings = JSON.parse(localStorage.getItem('pending_bookings') || '[]');
        const newBooking = {
            id: Date.now(),
            ...booking,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        pendingBookings.push(newBooking);
        localStorage.setItem('pending_bookings', JSON.stringify(pendingBookings));
        
        // Показываем инструкцию
        alert(`✅ Бронь отправлена!\n\nКоманда: ${booking.teamName}\nВремя: ${booking.time}\n\nОтправьте скриншот @javateam для подтверждения.`);
        
        return newBooking;
    }

    // Админ функция для загрузки всех броней
    async syncBookings() {
        const pending = JSON.parse(localStorage.getItem('pending_bookings') || '[]');
        const confirmed = JSON.parse(localStorage.getItem('confirmed_bookings') || '[]');
        
        return {
            pending: pending.filter(b => b.status === 'pending'),
            confirmed: confirmed
        };
    }
}

const db = new SafeGitHubDB();