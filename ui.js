from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
import os

# ==================== БАЗА ДАННЫХ ====================
DB_PATH = os.path.join(os.path.dirname(__file__), 'javateam.db')

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Таблица времени
        c.execute('''CREATE TABLE IF NOT EXISTS times
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      time_value TEXT UNIQUE)''')
        
        # Таблица заявок
        c.execute('''CREATE TABLE IF NOT EXISTS bookings
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      time_value TEXT,
                      team_name TEXT,
                      captain TEXT,
                      captain_id TEXT,
                      maps TEXT,
                      roster TEXT)''')
        
        # Таблица истории
        c.execute('''CREATE TABLE IF NOT EXISTS history
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      opponent TEXT,
                      score TEXT,
                      result TEXT)''')
        
        conn.commit()
        conn.close()
        print("[✅] База данных готова")
        return True
    except Exception as e:
        print(f"[❌] Ошибка: {e}")
        return False

class AdminHandler(BaseHTTPRequestHandler):
    
    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()
    
    def do_GET(self):
        try:
            # Админка HTML
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_cors()
                self.end_headers()
                
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                
                c.execute("SELECT * FROM times")
                times = c.fetchall()
                
                c.execute("SELECT * FROM bookings")
                bookings = c.fetchall()
                
                c.execute("SELECT * FROM history")
                history = c.fetchall()
                
                conn.close()
                
                html = self.generate_html(times, bookings, history)
                self.wfile.write(html.encode('utf-8'))
            
            # API для сайта
            elif self.path == '/api/times':
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT time_value FROM times")
                all_times = [t[0] for t in c.fetchall()]
                c.execute("SELECT time_value FROM bookings")
                busy = [b[0] for b in c.fetchall()]
                conn.close()
                
                free = [t for t in all_times if t not in busy]
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors()
                self.end_headers()
                self.wfile.write(json.dumps(free).encode())
            
            elif self.path == '/api/bookings':
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT time_value, team_name FROM bookings")
                data = [{'time': b[0], 'team': b[1]} for b in c.fetchall()]
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors()
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())
            
            elif self.path == '/api/history':
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT opponent, score, result FROM history")
                data = [{'opponent': h[0], 'score': h[1], 'result': h[2]} for h in c.fetchall()]
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors()
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())
        
        except Exception as e:
            print(f"[❌] Ошибка: {e}")
    
    def do_POST(self):
        try:
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            if self.path == '/add_time':
                time_val = data.get('time')
                if time_val:
                    try:
                        c.execute("INSERT INTO times (time_value) VALUES (?)", (time_val,))
                        conn.commit()
                        print(f"[✅] Время {time_val} добавлено")
                    except:
                        print(f"[⚠️] Время {time_val} уже есть")
            
            elif self.path == '/delete_time':
                time_id = data.get('id')
                c.execute("DELETE FROM times WHERE id=?", (time_id,))
                conn.commit()
                print(f"[🗑️] Время ID {time_id} удалено")
            
            elif self.path == '/new_booking':
                t = data.get('time')
                team = data.get('team')
                cap = data.get('captain')
                cap_id = data.get('captainId')
                maps = data.get('maps')
                roster = data.get('roster', '')
                
                maps_str = ', '.join(maps) if isinstance(maps, list) else maps
                
                c.execute('''INSERT INTO bookings 
                           (time_value, team_name, captain, captain_id, maps, roster) 
                           VALUES (?, ?, ?, ?, ?, ?)''',
                           (t, team, cap, cap_id, maps_str, roster))
                conn.commit()
                print(f"[✅] Заявка от {team} на {t}")
            
            elif self.path == '/delete_booking':
                booking_id = data.get('id')
                c.execute("DELETE FROM bookings WHERE id=?", (booking_id,))
                conn.commit()
                print(f"[🗑️] Заявка ID {booking_id} удалена")
            
            elif self.path == '/add_history':
                opp = data.get('opponent')
                score = data.get('score')
                res = data.get('result')
                
                c.execute("INSERT INTO history (opponent, score, result) VALUES (?, ?, ?)",
                         (opp.upper(), score, res))
                conn.commit()
                print(f"[✅] В историю: {opp} {score}")
            
            elif self.path == '/delete_history':
                hist_id = data.get('id')
                c.execute("DELETE FROM history WHERE id=?", (hist_id,))
                conn.commit()
                print(f"[🗑️] Из истории ID {hist_id} удалено")
            
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True}).encode())
        
        except Exception as e:
            print(f"[❌] Ошибка: {e}")
    
    def generate_html(self, times, bookings, history):
        times_rows = ''
        for t in times:
            times_rows += f'''
            <tr>
                <td>{t[1]}</td>
                <td><button onclick="deleteTime({t[0]})">❌</button></td>
            </tr>
            '''
        
        bookings_rows = ''
        for b in bookings:
            bookings_rows += f'''
            <tr>
                <td>{b[1]}</td>
                <td>{b[2]}</td>
                <td>{b[5]}</td>
                <td><button onclick="deleteBooking({b[0]})">❌</button></td>
            </tr>
            '''
        
        history_rows = ''
        for h in history:
            history_rows += f'''
            <tr>
                <td>{h[1]}</td>
                <td>{h[2]}</td>
                <td>{h[3]}</td>
                <td><button onclick="deleteHistory({h[0]})">❌</button></td>
            </tr>
            '''
        
        return f'''<!DOCTYPE html>
<html>
<head>
    <title>JAVATEAM ADMIN</title>
    <meta charset="utf-8">
    <style>
        body {{ background:#0a0a0a; color:#fff; font-family:monospace; padding:20px; }}
        .container {{ max-width:1200px; margin:0 auto; }}
        h1 {{ color:#0066ff; }}
        .section {{ background:#111; padding:20px; margin:20px 0; border-radius:10px; }}
        input, button {{ padding:10px; margin:5px; background:#222; color:#fff; border:1px solid #333; }}
        button {{ cursor:pointer; background:#0066ff; }}
        table {{ width:100%; }}
        td {{ padding:10px; border-bottom:1px solid #333; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ JAVATEAM ADMIN</h1>
        
        <div class="section">
            <h2>➕ Время</h2>
            <input id="timeInput" placeholder="19:00">
            <button onclick="addTime()">Добавить</button>
            <table>{times_rows}</table>
        </div>
        
        <div class="section">
            <h2>📋 Заявки</h2>
            <table>{bookings_rows}</table>
        </div>
        
        <div class="section">
            <h2>📝 История</h2>
            <input id="oppInput" placeholder="7WEEN">
            <input id="scoreInput" placeholder="13:9">
            <select id="resInput">
                <option value="win">Победа</option>
                <option value="loss">Поражение</option>
            </select>
            <button onclick="addHistory()">Добавить</button>
            <table>{history_rows}</table>
        </div>
    </div>
    
    <script>
        function addTime() {{
            let t = document.getElementById('timeInput').value;
            if(t) fetch('/add_time', {{
                method:'POST',
                headers:{{'Content-Type':'application/json'}},
                body:JSON.stringify({{'time':t}})
            }}).then(()=>location.reload());
        }}
        
        function deleteTime(id) {{
            fetch('/delete_time', {{
                method:'POST',
                headers:{{'Content-Type':'application/json'}},
                body:JSON.stringify({{'id':id}})
            }}).then(()=>location.reload());
        }}
        
        function deleteBooking(id) {{
            fetch('/delete_booking', {{
                method:'POST',
                headers:{{'Content-Type':'application/json'}},
                body:JSON.stringify({{'id':id}})
            }}).then(()=>location.reload());
        }}
        
        function addHistory() {{
            let o = document.getElementById('oppInput').value;
            let s = document.getElementById('scoreInput').value;
            let r = document.getElementById('resInput').value;
            if(o&&s) fetch('/add_history', {{
                method:'POST',
                headers:{{'Content-Type':'application/json'}},
                body:JSON.stringify({{'opponent':o,'score':s,'result':r}})
            }}).then(()=>location.reload());
        }}
        
        function deleteHistory(id) {{
            fetch('/delete_history', {{
                method:'POST',
                headers:{{'Content-Type':'application/json'}},
                body:JSON.stringify({{'id':id}})
            }}).then(()=>location.reload());
        }}
    </script>
</body>
</html>'''

# ==================== ЗАПУСК ====================
def run():
    print("="*50)
    print("🔧 JAVATEAM АДМИНКА")
    print("="*50)
    
    if not init_db():
        return
    
    server = HTTPServer(('0.0.0.0', 8000), AdminHandler)
    print("[✅] http://localhost:8000")
    print("[⚠️] Не закрывай окно")
    print("[❌] Ctrl+C для остановки")
    print("="*50)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[✅] Админка остановлена")

if __name__ == '__main__':
    run()