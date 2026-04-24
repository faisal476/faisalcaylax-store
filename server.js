const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  || 'nightcity2024';
const FIVEM_API_KEY   = process.env.FIVEM_API_KEY   || 'nightcity-secret-key-2024';

// ── Middleware ─────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── In-Memory State ────────────────────────────────
const state = {
  online: false,
  name: 'NightCity RP',
  maxPlayers: 48,
  players: [],
  uptime: 0,
  map: 'fivem-map-skater',
  gamemode: 'roleplay',
  lastHeartbeat: null,
};

const pendingCommands = [];
const commandHistory  = [];
const adminTokens     = new Set();
let   themeColor      = '#00e5ff';

// ── Helpers ────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function requireFivem(req, res, next) {
  const key = req.headers['x-api-key'] || req.body?.apiKey;
  if (key !== FIVEM_API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireAdmin(req, res, next) {
  const auth  = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (!adminTokens.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Health ─────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'NightCity API running' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ── Theme (public GET) ─────────────────────────────
app.get('/api/admin/theme', (req, res) => res.json({ color: themeColor }));

// ── Admin Auth ─────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === ADMIN_PASSWORD) {
    const token = genId();
    adminTokens.add(token);
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// ── Admin Routes ───────────────────────────────────
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const online = state.online && state.lastHeartbeat
    ? Date.now() - state.lastHeartbeat < 60000
    : false;
  res.json({
    online,
    name:           state.name,
    playerCount:    state.players.length,
    maxPlayers:     state.maxPlayers,
    uptime:         state.uptime,
    map:            state.map,
    gamemode:       state.gamemode,
    lastHeartbeat:  state.lastHeartbeat,
    pendingCommands: pendingCommands.length,
  });
});

app.get('/api/admin/players', requireAdmin, (req, res) => {
  res.json({ players: state.players });
});

app.post('/api/admin/command', requireAdmin, (req, res) => {
  const { type, targetId, reason, message, value } = req.body;
  if (!type) return res.status(400).json({ error: 'Missing type' });
  const cmd = { id: genId(), type, targetId, reason, message, value, queuedAt: Date.now(), status: 'pending' };
  pendingCommands.push(cmd);
  res.json({ ok: true, command: cmd });
});

app.get('/api/admin/history', requireAdmin, (req, res) => {
  res.json({ history: commandHistory.slice(0, 50) });
});

app.put('/api/admin/theme', requireAdmin, (req, res) => {
  const { color } = req.body;
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color))
    return res.status(400).json({ error: 'Invalid color' });
  themeColor = color;
  res.json({ ok: true, color });
});

// ── FiveM Routes ───────────────────────────────────
app.post('/api/fivem/heartbeat', requireFivem, (req, res) => {
  const { players = [], uptime = 0, name, map, gamemode, maxPlayers } = req.body;
  state.online        = true;
  state.players       = players;
  state.uptime        = uptime;
  state.lastHeartbeat = Date.now();
  if (name)       state.name       = name;
  if (map)        state.map        = map;
  if (gamemode)   state.gamemode   = gamemode;
  if (maxPlayers) state.maxPlayers = maxPlayers;
  res.json({ ok: true });
});

app.get('/api/fivem/commands', requireFivem, (req, res) => {
  res.json({ commands: pendingCommands.filter(c => c.status === 'pending') });
});

app.post('/api/fivem/command-result', requireFivem, (req, res) => {
  const { id, success } = req.body;
  const idx = pendingCommands.findIndex(c => c.id === id);
  if (idx !== -1) {
    const cmd = pendingCommands.splice(idx, 1)[0];
    cmd.status      = success !== false ? 'executed' : 'failed';
    cmd.executedAt  = Date.now();
    commandHistory.unshift(cmd);
    if (commandHistory.length > 100) commandHistory.pop();
  }
  res.json({ ok: true });
});

// ── Auto offline after 60s no heartbeat ───────────
setInterval(() => {
  if (state.lastHeartbeat && Date.now() - state.lastHeartbeat > 60000) {
    state.online = false;
  }
}, 15000);

// ── Start ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`NightCity API running on port ${PORT}`);
});
