// Данные
let times = [];
let bookings = [];
let history = [];
let selectedTime = '';

// Загрузка
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    // Обновление КАЖДУЮ СЕКУНДУ
    setInterval(loadData, 1000);
    
    // Кнопка отправки
    document.querySelector('.btn-blue').onclick = (e) => {
        e.preventDefault();
        submit();
    };
    
    // Карты - максимум 3
    document.querySelectorAll('.map-item input').forEach(cb => {
        cb.onchange = function() {
            if (document.querySelectorAll('.map-item input:checked').length > 3) {
                this.checked = false;
                alert('Максимум 3 карты');
            }
        };
    });
});

// Загрузка данных
function loadData() {
    fetch('http://localhost:8000/api/times')
        .then(r => r.json())
        .then(d => { times = d; render(); });
    
    fetch('http://localhost:8000/api/bookings')
        .then(r => r.json())
        .then(d => { bookings = d; render(); });
    
    fetch('http://localhost:8000/api/history')
        .then(r => r.json())
        .then(d => { history = d; render(); });
}

// Отрисовка
function render() {
    // Время
    let block = document.getElementById('availableTimeBlock');
    if (block) {
        let free = times.filter(t => !bookings.some(b => b.time === t));
        if (free.length === 0) {
            block.innerHTML = '<div class="no-time">СЕГОДНЯ ПРАКОВ НЕТ</div>';
        } else {
            let html = '<div class="time-selector"><span class="time-label">ДОСТУПНОЕ ВРЕМЯ:</span>';
            free.forEach(t => {
                html += `<button class="time-btn ${selectedTime === t ? 'selected' : ''}" 
                               onclick="selectTime('${t}')">${t}</button>`;
            });
            block.innerHTML = html + '</div>';
        }
    }
    
    // Заявки
    let list = document.getElementById('practiceList');
    if (list) {
        if (bookings.length === 0) {
            list.innerHTML = '<div class="empty-state">Нет забронированных праков</div>';
        } else {
            list.innerHTML = bookings.map(b => `
                <div class="practice-item confirmed">
                    <div class="practice-time">${b.time}</div>
                    <div class="practice-teams">JAVATEAM vs ${b.team}</div>
                    <div class="practice-status confirmed">ПОДТВЕРЖДЕН</div>
                </div>
            `).join('');
        }
    }
    
    // История
    let histList = document.getElementById('historyList');
    if (histList) {
        if (history.length === 0) {
            histList.innerHTML = '<div class="empty-state">История пуста</div>';
        } else {
            histList.innerHTML = history.map(h => `
                <div class="history-item ${h.result}">
                    <span class="history-type">ПРАК</span>
                    <span class="history-opponent">VS ${h.opponent}</span>
                    <span class="history-score">${h.score}</span>
                    <span class="history-result">${h.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</span>
                </div>
            `).join('');
        }
    }
}

// Выбор времени
function selectTime(t) {
    selectedTime = t;
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === t);
    });
}

// Отправка
function submit() {
    if (!selectedTime) return alert('Выберите время');
    
    let team = document.getElementById('teamName').value;
    let captain = document.getElementById('captainTag').value;
    let captainId = document.getElementById('captainId').value;
    
    let maps = [];
    document.querySelectorAll('.map-item input:checked').forEach(cb => maps.push(cb.value));
    
    if (!team || !captain || !captainId || maps.length === 0) {
        return alert('Заполните все поля');
    }
    
    fetch('http://localhost:8000/new_booking', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({time: selectedTime, team, maps})
    }).then(() => {
        alert('✅ Отправлено');
        selectedTime = '';
        document.getElementById('teamName').value = '';
        document.getElementById('captainTag').value = '';
        document.getElementById('captainId').value = '';
        document.querySelectorAll('.map-item input:checked').forEach(cb => cb.checked = false);
    });
}

// Навигация
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({behavior: 'smooth'});
}
