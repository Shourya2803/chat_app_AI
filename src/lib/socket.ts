import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Join a conversation
  joinConversation(conversationId: string) {
    this.socket?.emit('join-conversation', conversationId);
  }

  // Leave a conversation
  leaveConversation(conversationId: string) {
    this.socket?.emit('leave-conversation', conversationId);
  }

  // Send a message
  sendMessage(data: {
    receiverId: string;
    content: string;
    conversationId?: string;
    applyTone?: boolean;
    toneType?: 'professional' | 'polite' | 'formal';
    mediaUrl?: string;
  }) {
    this.socket?.emit('send-message', data);
  }

  // Typing indicators
  startTyping(conversationId: string) {
    this.socket?.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing-stop', { conversationId });
  }

  // Mark messages as read
  markAsRead(conversationId: string) {
    this.socket?.emit('mark-read', { conversationId });
  }

  // Heartbeat
  sendHeartbeat() {
    this.socket?.emit('heartbeat');
  }

  // Listen to events
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
export default socketService;
