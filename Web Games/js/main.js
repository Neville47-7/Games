/* PlayZone Hub — Main Logic with Online Features */

const GAMES = [
  { id:'snake', title:'Snake', emoji:'🐍', desc:'Guide the snake, eat food, grow longer!', category:'classic', controls:'Arrow Keys', gradient:'linear-gradient(135deg,#06b6d4,#3b82f6)', diff:true, mp:2, hasScore:true },
  { id:'tetris', title:'Tetris', emoji:'🧱', desc:'Stack blocks, clear lines, beat your score!', category:'puzzle', controls:'Arrow Keys + Space', gradient:'linear-gradient(135deg,#7c3aed,#a855f7)', diff:true, mp:false, hasScore:true },
  { id:'2048', title:'2048', emoji:'🔢', desc:'Slide tiles, merge numbers, reach 2048!', category:'puzzle', controls:'Arrow Keys', gradient:'linear-gradient(135deg,#fb923c,#f59e0b)', diff:false, mp:false, hasScore:true },
  { id:'memory', title:'Memory Match', emoji:'🃏', desc:'Flip cards, find matching pairs!', category:'puzzle', controls:'Mouse Click', gradient:'linear-gradient(135deg,#f472b6,#ec4899)', diff:true, mp:2, hasScore:true },
  { id:'tictactoe', title:'Tic Tac Toe', emoji:'❌', desc:'Classic X and O — play against AI or a friend!', category:'strategy', controls:'Mouse Click', gradient:'linear-gradient(135deg,#34d399,#10b981)', diff:false, mp:2, online:true },
  { id:'breakout', title:'Breakout', emoji:'🧱', desc:'Bounce the ball, smash all the bricks!', category:'arcade', controls:'Mouse / Arrows', gradient:'linear-gradient(135deg,#ef4444,#f97316)', diff:true, mp:false, hasScore:true },
  { id:'minesweeper', title:'Minesweeper', emoji:'💣', desc:'Clear the board, avoid the mines!', category:'logic', controls:'Mouse Click', gradient:'linear-gradient(135deg,#64748b,#475569)', diff:true, mp:false, hasScore:true },
  { id:'flappy', title:'Flappy Bird', emoji:'🐦', desc:'Tap to fly, dodge the pipes!', category:'arcade', controls:'Space / Click', gradient:'linear-gradient(135deg,#34d399,#06b6d4)', diff:true, mp:false, hasScore:true },
  { id:'pong', title:'Pong', emoji:'🏓', desc:'Classic paddle game for 2 players!', category:'classic', controls:'W/S + Up/Down', gradient:'linear-gradient(135deg,#a855f7,#7c3aed)', diff:true, mp:2, online:true },
  { id:'space-invaders', title:'Space Invaders', emoji:'👾', desc:'Defend Earth from alien invasion!', category:'arcade', controls:'Arrows + Space', gradient:'linear-gradient(135deg,#06b6d4,#7c3aed)', diff:true, mp:false, hasScore:true },
  { id:'car-racing', title:'Car Racing', emoji:'🏎️', desc:'Race at high speed, dodge traffic!', category:'racing', controls:'Arrow Keys', gradient:'linear-gradient(135deg,#ef4444,#dc2626)', diff:true, mp:false, hasScore:true },
  { id:'football', title:'Football', emoji:'⚽', desc:'Score goals in penalty shootout!', category:'sports', controls:'Mouse Drag', gradient:'linear-gradient(135deg,#22c55e,#16a34a)', diff:true, mp:false, hasScore:true },
  { id:'country-conquest', title:'Country Conquest', emoji:'🌍', desc:'Conquer territories, rule the world!', category:'strategy', controls:'Mouse Click', gradient:'linear-gradient(135deg,#f59e0b,#d97706)', diff:false, mp:false },
  { id:'president', title:'President Simulator', emoji:'🏛️', desc:'Run a country! Manage economy, military, diplomacy & more.', category:'simulation', controls:'Mouse Click', gradient:'linear-gradient(135deg,#7c3aed,#1e40af)', diff:true, mp:false },
  { id:'pitch-rivals', title:'Pitch Rivals', emoji:'⚽', desc:'Draft a 5-a-side squad and simulate matches!', category:'sports', controls:'Mouse Click', gradient:'linear-gradient(135deg,#22c55e,#059669)', diff:false, mp:false, hasScore:true },
  { id:'terminal-tactics', title:'Terminal Tactics', emoji:'⌨️', desc:'Hack the enemy node! CLI-based network battler.', category:'strategy', controls:'Keyboard', gradient:'linear-gradient(135deg,#00ff41,#064e3b)', diff:false, mp:false, hasScore:true },
  { id:'riff-rumble', title:'Riff Rumble', emoji:'🎸', desc:'Type fast to deal damage! Heavy metal typing brawler.', category:'action', controls:'Keyboard', gradient:'linear-gradient(135deg,#ef4444,#991b1b)', diff:false, mp:false, hasScore:true },
  { id:'lingo-sprint', title:'Lingo Sprint', emoji:'🌍', desc:'Race by translating words! Multilingual learning game.', category:'education', controls:'Mouse Click', gradient:'linear-gradient(135deg,#3b82f6,#06b6d4)', diff:false, mp:false, hasScore:true },
];

const CATEGORIES = ['all','classic','puzzle','arcade','strategy','logic','racing','sports','simulation','action','education'];
let activeCategory = 'all';
let searchQuery = '';
let selectedDiff = 'medium';
let selectedPlayers = 1;
let pendingGameId = null;
let lbGameFilter = 'all';

function createPlaySVG() {
  return '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
}

function renderCards() {
  const grid = document.getElementById('game-grid');
  const filtered = GAMES.filter(g => {
    const matchCat = activeCategory === 'all' || g.category === activeCategory;
    const matchSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results"><div class="no-results__emoji">🎮</div><div class="no-results__text">No games found</div><div class="no-results__sub">Try a different search or category</div></div>';
    return;
  }
  grid.innerHTML = filtered.map(g => {
    let badges = '';
    if (g.online) badges += '<span class="game-card__badge game-card__badge--online">🌐 Online</span>';
    if (g.mp) badges += '<span class="game-card__badge game-card__badge--mp">👥 Multiplayer</span>';
    if (g.diff) badges += '<span class="game-card__badge game-card__badge--diff">⚙ Modes</span>';
    return `
    <div class="game-card" data-game="${g.id}" onclick="showModeSelector('${g.id}')">
      <div class="game-card__banner-wrap">
        <div class="game-card__banner-bg" style="background:${g.gradient}"></div>
        <div class="game-card__banner">${g.emoji}</div>
        <div class="game-card__play-btn">${createPlaySVG()}</div>
        ${badges ? '<div class="game-card__badges">' + badges + '</div>' : ''}
      </div>
      <div class="game-card__info">
        <div class="game-card__title">${g.title}</div>
        <div class="game-card__desc">${g.desc}</div>
        <div class="game-card__meta">
          <span class="game-card__tag game-card__tag--${g.category}">${g.category}</span>
          <span class="game-card__controls">🎮 ${g.controls}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  container.innerHTML = CATEGORIES.map(c =>
    `<button class="category-tab ${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`
  ).join('');
}

function setCategory(cat) { activeCategory = cat; renderCategoryTabs(); renderCards(); }

/* ---- Mode Selector ---- */
function showModeSelector(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;
  if (!game.diff && !game.mp && !game.online) { launchGame(gameId, 'medium', 1); return; }
  pendingGameId = gameId;
  selectedDiff = 'medium';
  selectedPlayers = 1;
  const modal = document.getElementById('mode-modal');
  const content = document.getElementById('mode-modal-content');
  let html = `<div class="mode-modal__header"><div class="mode-modal__emoji">${game.emoji}</div><div class="mode-modal__title">${game.title}</div></div>`;
  if (game.diff) {
    html += `<div class="mode-modal__section"><div class="mode-modal__label">⚙️ Difficulty</div>
      <div class="mode-modal__options" id="diff-options">
        <button class="mode-opt" onclick="selectDiff('easy',this)"><span class="mode-opt__icon">😊</span>Easy<span class="mode-opt__sub">Relaxed</span></button>
        <button class="mode-opt selected" onclick="selectDiff('medium',this)"><span class="mode-opt__icon">😐</span>Medium<span class="mode-opt__sub">Balanced</span></button>
        <button class="mode-opt" onclick="selectDiff('hard',this)"><span class="mode-opt__icon">😈</span>Hard<span class="mode-opt__sub">Intense</span></button>
      </div></div>`;
  }
  if (game.mp || game.online) {
    html += `<div class="mode-modal__section"><div class="mode-modal__label">👥 Players</div>
      <div class="mode-modal__options" id="player-options">
        <button class="mode-opt selected" onclick="selectPlayers(1,this)"><span class="mode-opt__icon">🧑</span>Solo<span class="mode-opt__sub">vs AI</span></button>
        <button class="mode-opt" onclick="selectPlayers(2,this)"><span class="mode-opt__icon">👥</span>2 Players<span class="mode-opt__sub">Local</span></button>
        ${game.online ? '<button class="mode-opt" onclick="selectPlayers(\'online\',this)"><span class="mode-opt__icon">🌐</span>Online<span class="mode-opt__sub">vs Player</span></button>' : ''}
      </div></div>`;
  }
  html += `<div class="mode-modal__actions"><button class="mode-modal__cancel" onclick="closeModeSelector()">Cancel</button>
    <button class="mode-modal__play" onclick="playFromSelector()">▶ Play Now</button></div>`;
  content.innerHTML = html;
  modal.classList.add('active');
}

function selectDiff(diff, btn) { selectedDiff = diff; btn.parentElement.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); }
function selectPlayers(n, btn) { selectedPlayers = n; btn.parentElement.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); }
function closeModeSelector() { document.getElementById('mode-modal').classList.remove('active'); pendingGameId = null; }

function playFromSelector() {
  const gameId = pendingGameId;
  const diff = selectedDiff;
  const players = selectedPlayers;
  closeModeSelector();
  if (!gameId) return;
  if (players === 'online') {
    if (!window.pzDB || !window.pzDB.currentUser) { showLogin(); return; }
    launchGame(gameId, diff, 'online');
  } else {
    launchGame(gameId, diff, players);
  }
}

function launchGame(gameId, diff, players) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;
  const overlay = document.getElementById('game-overlay');
  const frame = document.getElementById('game-frame');
  const title = document.getElementById('overlay-title');
  title.textContent = game.emoji + ' ' + game.title;
  const userParam = (window.pzDB && window.pzDB.currentUser) ? '&user=' + encodeURIComponent(window.pzDB.currentUser.username) : '';
  frame.src = 'games/' + game.id + '.html?diff=' + diff + '&mp=' + players + userParam;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Focus the iframe so keyboard events work
  setTimeout(() => { frame.focus(); }, 100);
}

function closeGame() {
  const overlay = document.getElementById('game-overlay');
  const frame = document.getElementById('game-frame');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { frame.src = ''; }, 300);
}

// Listen for score submissions from game iframes
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'score-submit') {
    if (window.pzDB && window.pzDB.currentUser) {
      window.pzDB.submitScore(e.data.gameId, e.data.score);
    }
  }
});

/* ---- Auth ---- */
function renderAuth() {
  const bar = document.getElementById('auth-bar');
  const user = window.pzDB ? window.pzDB.currentUser : null;
  if (user) {
    bar.innerHTML = `<div class="user-pill" onclick="toggleLeaderboard()">
      <span class="avatar">${user.avatar}</span>
      <span class="name">${user.username}</span>
    </div>`;
  } else {
    bar.innerHTML = `<button class="login-btn" onclick="showLogin()">👤 Sign In</button>`;
  }
  // Update player count
  const profiles = window.pzDB ? window.pzDB.getAllProfiles() : [];
  const el = document.getElementById('total-players');
  if (el) el.textContent = profiles.length;
}

function showLogin() { document.getElementById('login-modal').classList.add('active'); document.getElementById('login-username').focus(); }
function closeLogin() { document.getElementById('login-modal').classList.remove('active'); }

function doLogin() {
  const input = document.getElementById('login-username');
  const username = input.value.trim();
  if (!username) return;
  const result = window.pzDB.login(username);
  if (result.ok) {
    closeLogin();
    renderAuth();
  }
}

/* ---- Leaderboard ---- */
function toggleLeaderboard() {
  const panel = document.getElementById('lb-panel');
  const overlay = document.getElementById('lb-overlay');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  if (!isOpen) renderLeaderboard();
}

function renderLeaderboard() {
  // Profile
  const profileDiv = document.getElementById('lb-profile');
  const user = window.pzDB.currentUser;
  if (user) {
    profileDiv.innerHTML = `<div class="profile-section">
      <div class="profile-row">
        <span class="profile-avatar">${user.avatar}</span>
        <div><div class="profile-name">${user.username}</div>
        <div class="profile-stats"><span>🎮 <b>${user.gamesPlayed}</b> played</span><span>⭐ <b>${user.totalScore}</b> pts</span></div></div>
      </div>
      <button class="logout-btn" onclick="doLogout()">Logout</button>
    </div>`;
  } else {
    profileDiv.innerHTML = `<div class="profile-section" style="text-align:center">
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:8px">Sign in to track your scores!</p>
      <button class="login-btn" onclick="showLogin();toggleLeaderboard();" style="padding:8px 20px;border-radius:8px;background:var(--gradient-primary);color:white;font-size:0.85rem;font-weight:600">👤 Sign In</button>
    </div>`;
  }

  // Tabs
  const scorableGames = GAMES.filter(g => g.hasScore);
  const tabsDiv = document.getElementById('lb-tabs');
  tabsDiv.innerHTML = `<button class="lb-tab ${lbGameFilter==='all'?'active':''}" onclick="setLbFilter('all')">All</button>` +
    scorableGames.map(g => `<button class="lb-tab ${lbGameFilter===g.id?'active':''}" onclick="setLbFilter('${g.id}')">${g.emoji}</button>`).join('');

  // Entries
  const contentDiv = document.getElementById('lb-content');
  const boards = window.pzDB.getAllLeaderboards();
  let entries = [];
  if (lbGameFilter === 'all') {
    Object.entries(boards).forEach(([gid, scores]) => {
      const game = GAMES.find(g => g.id === gid);
      scores.forEach(s => entries.push({...s, gameEmoji: game ? game.emoji : '🎮'}));
    });
    entries.sort((a, b) => b.score - a.score);
  } else {
    entries = (boards[lbGameFilter] || []).map(s => ({...s, gameEmoji: ''}));
  }
  entries = entries.slice(0, 20);

  if (entries.length === 0) {
    contentDiv.innerHTML = '<div class="lb-empty">🏆 No scores yet!<br>Play games to appear here.</div>';
    return;
  }
  contentDiv.innerHTML = entries.map((e, i) => {
    const rankClass = i < 3 ? ` r${i+1}` : '';
    const topClass = i < 3 ? ` top-${i+1}` : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
    return `<div class="lb-entry${topClass}">
      <span class="lb-rank${rankClass}">${medal}</span>
      <span class="lb-avatar">${e.avatar || '🎮'}</span>
      <span class="lb-name">${e.username}${e.gameEmoji ? ' '+e.gameEmoji : ''}</span>
      <span class="lb-score">${e.score.toLocaleString()}</span>
    </div>`;
  }).join('');
}

function setLbFilter(gameId) { lbGameFilter = gameId; renderLeaderboard(); }
function doLogout() { window.pzDB.logout(); renderAuth(); renderLeaderboard(); }

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryTabs();
  renderCards();
  renderAuth();

  document.getElementById('search-input').addEventListener('input', (e) => { searchQuery = e.target.value; renderCards(); });
  document.getElementById('login-username').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('login-modal').classList.contains('active')) closeLogin();
      else if (document.getElementById('mode-modal').classList.contains('active')) closeModeSelector();
      else if (document.getElementById('lb-panel').classList.contains('open')) toggleLeaderboard();
      else closeGame();
    }
  });

  document.getElementById('game-count').textContent = GAMES.length;
  if (window.pzDB) window.pzDB.on('auth-change', () => { renderAuth(); });
});
