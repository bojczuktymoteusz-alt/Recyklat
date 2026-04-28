/**
 * server.js — Recyklat lokalny serwer HTTP
 *
 * Nasłuchuje na http://localhost:17731
 * Endpoint POST /append dopisuje linię do historia_kontaktow.txt
 *
 * Uruchomienie: node server.js
 * (zostaw okno CMD otwarte w tle podczas pracy z Facebookiem)
 *
 * Zatrzymanie: Ctrl+C w oknie CMD
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 17731;
const FILE    = path.join(__dirname, 'historia_kontaktow.txt');

// Utwórz plik jeśli nie istnieje
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, '# Historia kontaktów Recyklat\n# Format: YYYY-MM-DD HH:MM | Nazwa | Notatka\n\n', 'utf8');
  console.log(`[Recyklat] Utworzono plik: ${FILE}`);
}

const server = http.createServer((req, res) => {
  // CORS — pozwól wtyczce Chrome na fetch do localhost
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS (przeglądarka pyta przed POST)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/append') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { line } = JSON.parse(body);
        if (!line || typeof line !== 'string') throw new Error('Brak pola "line"');

        fs.appendFileSync(FILE, line.trim() + '\n', 'utf8');
        console.log(`[Recyklat] Dopisano: ${line.trim()}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error('[Recyklat] Błąd zapisu:', e.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Inne ścieżki — 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Recyklat server nasłuchuje na http://localhost:${PORT}`);
  console.log(`   Plik historii: ${FILE}`);
  console.log(`   Aby zatrzymać: Ctrl+C`);
});
