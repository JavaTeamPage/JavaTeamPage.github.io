// API функции для работы с сервером

const API_BASE = '';

// Функция для отправки запросов
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

// Получение статистики
export async function getStats() {
    return await apiRequest('/api/stats');
}

// Получение бронирований
export async function getBookings() {
    return await apiRequest('/api/bookings');
}

// Создание бронирования
export async function createBooking(bookingData) {
    return await apiRequest('/api/bookings', 'POST', bookingData);
}

// Получение истории игр
export async function getGames() {
    return await apiRequest('/api/games');
}

// Получение доступных времен
export async function getAvailableTimes() {
    return await apiRequest('/api/available_times');
}

// Админ: авторизация
export async function adminLogin(credentials) {
    return await apiRequest('/api/admin/login', 'POST', credentials);
}

// Админ: проверка статуса
export async function checkAdminStatus() {
    return await apiRequest('/api/admin/check');
}

// Админ: выход
export async function adminLogout() {
    return await apiRequest('/api/admin/logout', 'POST');
}

// Админ: добавление игры
export async function adminAddGame(gameData) {
    return await apiRequest('/api/admin/games', 'POST', gameData);
}

// Админ: удаление игры
export async function adminDeleteGame(gameId) {
    return await apiRequest(`/api/admin/games/${gameId}`, 'DELETE');
}

// Админ: сброс бронирований
export async function adminResetBookings() {
    return await apiRequest('/api/admin/bookings', 'DELETE');
}

// Админ: удаление бронирования
export async function adminDeleteBooking(bookingId) {
    return await apiRequest(`/api/admin/bookings/${bookingId}`, 'DELETE');
}

// Получение конфигурации
export async function getConfig() {
    return await apiRequest('/api/config');
}