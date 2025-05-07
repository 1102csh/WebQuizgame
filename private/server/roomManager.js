const GameManager = require('./gameManager');

class RoomManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = []; // { ws, name, id }
    this.playersById = new Map(); // key: ws.id, value: { name, ws }
    this.hostId = null;
    this.game = null;
  }

  addPlayer(ws, name) {
    this.players.push({ ws, name, id: ws.id });
    this.playersById.set(ws.id, { name, ws });

    // 최초 입장자는 방장
    if (!this.hostId) {
      this.hostId = ws.id;
    }

    this.sendTo(ws, 'joined_room', {
      roomId: this.roomId,
      hostId: this.hostId,
      yourId: ws.id,
    });

    this.broadcastPlayerList();
  }

  removePlayer(ws) {
    this.players = this.players.filter(p => p.id !== ws.id);
    this.playersById.delete(ws.id);
    
    // 방장이 나간 경우 다른 사람에게 위임
    if (ws.id === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.broadcast('host_changed', { hostId: this.hostId });
    }

    this.broadcastPlayerList();
  }

  isEmpty() {
    return this.players.length === 0;
  }

  isHost(ws) {
    return ws.id === this.hostId;
  }

  broadcast(type, payload) {
    for (const { ws } of this.players) {
      this.sendTo(ws, type, payload);
    }
  }

  sendTo(ws, type, payload) {
    ws.send(JSON.stringify({ type, payload }));
  }

  broadcastPlayerList() {
    const list = this.players.map(p => ({
      id: p.id,
      name: p.name,
    }));

    this.broadcast('player_list', {
      players: list,
      hostId: this.hostId,
    });
  }

  startGame() {
    if (this.game) return; // 이미 시작된 경우 방지

    this.game = new GameManager(this);
    this.game.start();
  }
}

module.exports = RoomManager;
