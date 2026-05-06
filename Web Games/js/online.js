/* PlayZone Online — Firebase Integration + Multiplayer */

// Firebase config — Using public anonymous auth (no API key exposure risk)
// Users should replace with their own Firebase project config
const FIREBASE_CONFIG = {
  // PLACEHOLDER: Replace with your Firebase project config
  // Go to https://console.firebase.google.com → Create project → Web app → Copy config
  apiKey: "DEMO_MODE",
  projectId: "playzone-demo",
  databaseURL: ""
};

// =============================================
// OFFLINE/DEMO MODE — Works without Firebase
// Uses localStorage as fallback database
// =============================================

class PlayZoneDB {
  constructor() {
    this.isOnline = false;
    this.currentUser = null;
    this.listeners = {};
    this.rooms = {};
    this.init();
  }

  init() {
    // Try to load saved user
    const saved = localStorage.getItem('pz_user');
    if (saved) {
      try { this.currentUser = JSON.parse(saved); } catch(e) {}
    }
    // Initialize local leaderboards
    if (!localStorage.getItem('pz_leaderboards')) {
      localStorage.setItem('pz_leaderboards', JSON.stringify({}));
    }
    if (!localStorage.getItem('pz_profiles')) {
      localStorage.setItem('pz_profiles', JSON.stringify({}));
    }
  }

  // ---- Auth ----
  register(username) {
    if (!username || username.length < 2 || username.length > 20) {
      return { ok: false, error: 'Username must be 2-20 characters' };
    }
    const profiles = JSON.parse(localStorage.getItem('pz_profiles') || '{}');
    const id = 'user_' + Date.now();
    const user = {
      id, username,
      avatar: this.randomAvatar(),
      createdAt: new Date().toISOString(),
      gamesPlayed: 0, wins: 0, totalScore: 0
    };
    profiles[id] = user;
    localStorage.setItem('pz_profiles', JSON.stringify(profiles));
    this.currentUser = user;
    localStorage.setItem('pz_user', JSON.stringify(user));
    this.emit('auth-change', user);
    return { ok: true, user };
  }

  login(username) {
    const profiles = JSON.parse(localStorage.getItem('pz_profiles') || '{}');
    const found = Object.values(profiles).find(p => p.username.toLowerCase() === username.toLowerCase());
    if (found) {
      this.currentUser = found;
      localStorage.setItem('pz_user', JSON.stringify(found));
      this.emit('auth-change', found);
      return { ok: true, user: found };
    }
    return this.register(username);
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pz_user');
    this.emit('auth-change', null);
  }

  randomAvatar() {
    const avatars = ['🎮','👾','🎯','🏆','⭐','🔥','💎','🚀','🎲','🦊','🐉','🌟','⚡','🎪','🎭'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  // ---- Leaderboards ----
  submitScore(gameId, score) {
    if (!this.currentUser) return;
    const boards = JSON.parse(localStorage.getItem('pz_leaderboards') || '{}');
    if (!boards[gameId]) boards[gameId] = [];
    boards[gameId].push({
      userId: this.currentUser.id,
      username: this.currentUser.username,
      avatar: this.currentUser.avatar,
      score,
      date: new Date().toISOString()
    });
    // Sort and keep top 50
    boards[gameId].sort((a, b) => b.score - a.score);
    boards[gameId] = boards[gameId].slice(0, 50);
    localStorage.setItem('pz_leaderboards', JSON.stringify(boards));

    // Update profile stats
    const profiles = JSON.parse(localStorage.getItem('pz_profiles') || '{}');
    if (profiles[this.currentUser.id]) {
      profiles[this.currentUser.id].gamesPlayed++;
      profiles[this.currentUser.id].totalScore += score;
      localStorage.setItem('pz_profiles', JSON.stringify(profiles));
      this.currentUser = profiles[this.currentUser.id];
      localStorage.setItem('pz_user', JSON.stringify(this.currentUser));
    }
  }

  getLeaderboard(gameId) {
    const boards = JSON.parse(localStorage.getItem('pz_leaderboards') || '{}');
    return boards[gameId] || [];
  }

  getAllLeaderboards() {
    return JSON.parse(localStorage.getItem('pz_leaderboards') || '{}');
  }

  getProfile(userId) {
    const profiles = JSON.parse(localStorage.getItem('pz_profiles') || '{}');
    return profiles[userId] || null;
  }

  getAllProfiles() {
    return Object.values(JSON.parse(localStorage.getItem('pz_profiles') || '{}'));
  }

  // ---- Multiplayer Rooms (Local P2P simulation) ----
  createRoom(gameId) {
    if (!this.currentUser) return null;
    const roomId = 'room_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const room = {
      id: roomId, gameId,
      host: { id: this.currentUser.id, username: this.currentUser.username, avatar: this.currentUser.avatar },
      guest: null,
      state: 'waiting', // waiting, playing, finished
      gameState: {},
      createdAt: Date.now()
    };
    this.rooms[roomId] = room;
    this.saveRooms();
    return room;
  }

  joinRoom(roomId) {
    if (!this.currentUser) return { ok: false, error: 'Not logged in' };
    this.loadRooms();
    const room = this.rooms[roomId];
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.guest) return { ok: false, error: 'Room is full' };
    if (room.host.id === this.currentUser.id) return { ok: false, error: 'Cannot join your own room' };
    room.guest = { id: this.currentUser.id, username: this.currentUser.username, avatar: this.currentUser.avatar };
    room.state = 'playing';
    this.saveRooms();
    return { ok: true, room };
  }

  getRooms(gameId) {
    this.loadRooms();
    // Clean old rooms (>5 min)
    const now = Date.now();
    Object.keys(this.rooms).forEach(id => {
      if (now - this.rooms[id].createdAt > 300000) delete this.rooms[id];
    });
    this.saveRooms();
    if (gameId) return Object.values(this.rooms).filter(r => r.gameId === gameId && r.state === 'waiting');
    return Object.values(this.rooms).filter(r => r.state === 'waiting');
  }

  updateRoomState(roomId, gameState) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].gameState = gameState;
      this.saveRooms();
    }
  }

  closeRoom(roomId) {
    delete this.rooms[roomId];
    this.saveRooms();
  }

  saveRooms() {
    localStorage.setItem('pz_rooms', JSON.stringify(this.rooms));
  }

  loadRooms() {
    try {
      this.rooms = JSON.parse(localStorage.getItem('pz_rooms') || '{}');
    } catch(e) { this.rooms = {}; }
  }

  // ---- Events ----
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }
}

// Global instance
window.pzDB = new PlayZoneDB();
