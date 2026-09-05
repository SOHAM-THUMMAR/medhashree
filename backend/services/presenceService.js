const alertEmailService = require('./alertEmailService');

/**
 * Service to track real-time online user presence across Sockets and REST heartbeats
 */
class PresenceService {
  constructor() {
    // Socket ID -> User Info { userId, role, connectedAt, lastSeen }
    this.activeSockets = new Map();
    // User ID -> Set of Socket IDs
    this.userSockets = new Map();
    // User ID -> Last Activity Timestamp (ms)
    this.apiHeartbeats = new Map();
    // Reference to Socket.IO server
    this.io = null;

    // Clean up stale API heartbeats every 2 minutes
    setInterval(() => this.cleanStalePresence(), 2 * 60 * 1000);
  }

  setIo(io) {
    this.io = io;
  }

  /**
   * Register socket connection
   */
  handleConnect(socket, userId, role) {
    const socketId = socket.id;
    const now = Date.now();

    this.activeSockets.set(socketId, {
      userId,
      role,
      connectedAt: now,
      lastSeen: now
    });

    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socketId);
      this.apiHeartbeats.set(userId, now);
    }

    this.checkThresholdAndBroadcast();
  }

  /**
   * Register socket disconnection
   */
  handleDisconnect(socketId) {
    const socketInfo = this.activeSockets.get(socketId);
    if (socketInfo) {
      const { userId } = socketInfo;
      if (userId && this.userSockets.has(userId)) {
        const userSocketSet = this.userSockets.get(userId);
        userSocketSet.delete(socketId);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.activeSockets.delete(socketId);
    }

    this.checkThresholdAndBroadcast();
  }

  /**
   * Record HTTP API heartbeat for logged-in user
   */
  recordApiActivity(userId) {
    if (!userId) return;
    this.apiHeartbeats.set(userId, Date.now());
  }

  /**
   * Remove heartbeats older than 5 minutes
   */
  cleanStalePresence() {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [userId, lastSeen] of this.apiHeartbeats.entries()) {
      if (lastSeen < cutoff && !this.userSockets.has(userId)) {
        this.apiHeartbeats.delete(userId);
      }
    }
  }

  /**
   * Get total unique online users (authenticated + socket guest connections)
   */
  getOnlineCount() {
    const uniqueUsers = new Set();

    // Add socket authenticated users
    for (const [socketId, info] of this.activeSockets.entries()) {
      if (info.userId) {
        uniqueUsers.add(String(info.userId));
      } else {
        uniqueUsers.add(`guest_${socketId}`);
      }
    }

    // Add REST API active users (within 5 minutes)
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [userId, lastSeen] of this.apiHeartbeats.entries()) {
      if (lastSeen >= cutoff) {
        uniqueUsers.add(String(userId));
      }
    }

    return uniqueUsers.size;
  }

  /**
   * Broadcast online user count to admin subscribers & check alert thresholds
   */
  async checkThresholdAndBroadcast() {
    const count = this.getOnlineCount();

    // Broadcast via socket to admin room if io is initialized
    if (this.io) {
      this.io.to('admin_room').emit('admin:online-count', { count, timestamp: new Date() });
    }

    // Check alert email trigger asynchronously
    try {
      await alertEmailService.checkOnlineUserThreshold(count);
    } catch (err) {
      console.error('[PresenceService Alert Error]', err.message);
    }
  }
}

module.exports = new PresenceService();
