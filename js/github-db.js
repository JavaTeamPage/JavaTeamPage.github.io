// github-db.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
console.log('GitHub DB loading...');

class GitHubDB {
    constructor() {
        this.owner = 'javateampage';
        this.repo = 'javateampage.github.io';
        this.filePath = 'data.json';
        this.dataUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${this.filePath}`;
        console.log('DB initialized for:', this.dataUrl);
    }

    async getData() {
        try {
            console.log('Fetching data from:', this.dataUrl);
            const response = await fetch(this.dataUrl + '?t=' + Date.now());
            
            if (!response.ok) {
                console.warn('Response not OK, using default data');
                return this.getDefaultData();
            }
            
            const data = await response.json();
            console.log('Data loaded successfully');
            return data;
            
        } catch (error) {
            console.error('Error loading data:', error);
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

    async getBookings() {
        try {
            const data = await this.getData();
            const today = new Date().toISOString().split('T')[0];
            
            if (data.lastReset !== today) {
                return [];
            }
            
            return data.bookings.filter(b => b.bookingDate === today);
        } catch (error) {
            console.error('Error getting bookings:', error);
            return [];
        }
    }

    async getGames() {
        try {
            const data = await this.getData();
            return data.gamesHistory || [];
        } catch (error) {
            console.error('Error getting games:', error);
            return [];
        }
    }

    async addBooking(booking) {
        console.log('Adding booking:', booking);
        
        const pendingBookings = JSON.parse(localStorage.getItem('pending_bookings') || '[]');
        const newBooking = {
            id: Date.now(),
            ...booking,
            bookingDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        pendingBookings.push(newBooking);
        localStorage.setItem('pending_bookings', JSON.stringify(pendingBookings));
        
        alert(`✅ Бронь отправлена!\n\nКоманда: ${booking.teamName}\nВремя: ${booking.time}\n\nОтправьте скриншот в Telegram для подтверждения.`);
        
        return newBooking;
    }

    async addGame(game) {
        console.log('Adding game:', game);
        
        const pendingGames = JSON.parse(localStorage.getItem('pending_games') || '[]');
        const newGame = {
            id: Date.now(),
            ...game,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        pendingGames.push(newGame);
        localStorage.setItem('pending_games', JSON.stringify(pendingGames));
        
        alert('✅ Игра отправлена на модерацию!');
        return newGame;
    }
}

const db = new GitHubDB();
console.log('GitHub DB ready');