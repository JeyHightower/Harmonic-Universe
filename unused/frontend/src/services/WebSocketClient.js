import { io } from "socket.io-client";
import {
  addParticipant,
  removeParticipant,
  setConnectionStatus,
  setCurrentRoom,
  setError,
  setMusicData,
  setVisualizationData,
  updateParameters,
} from "../../store/actions/websocket";

class WebSocketClient {
  constructor(store, url = "ws://localhost:5002") {
    this.store = store;
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect() {
    try {
      this.socket = io(this.url, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        query: {
          token: localStorage.getItem("token"), // Add token for authentication
        },
      });

      this.setupEventHandlers();
      return true;
    } catch (error) {
      this.handleError("Connection failed: " + error.message);
      return false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.store.dispatch(setConnectionStatus(false));
    }
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on("connect", () => {
      this.store.dispatch(setConnectionStatus(true));
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on("connect_success", (data) => {
      console.log("Connected with user ID:", data.user_id);
    });

    this.socket.on("connect_error", (error) => {
      this.handleError("Connection error: " + error.message);
      this.handleReconnect();
    });

    this.socket.on("disconnect", () => {
      this.store.dispatch(setConnectionStatus(false));
      this.handleReconnect();
    });

    this.socket.on("error", (error) => {
      this.handleError(error.message || "Unknown error occurred");
    });

    // Room events
    this.socket.on("room_joined", (data) => {
      this.store.dispatch(setCurrentRoom(data.room));
    });

    this.socket.on("room_left", (data) => {
      if (data.room_id === this.store.getState().websocket.currentRoom?.id) {
        this.store.dispatch(setCurrentRoom(null));
      }
    });

    this.socket.on("participant_joined", (data) => {
      this.store.dispatch(addParticipant(data));
    });

    this.socket.on("participant_left", (data) => {
      this.store.dispatch(removeParticipant(data.user_id));
    });

    // Parameter updates
    this.socket.on("parameter_update", (data) => {
      this.store.dispatch(updateParameters(data));
    });

    // Music and visualization updates
    this.socket.on("music_update", (data) => {
      this.store.dispatch(setMusicData(data));
    });

    this.socket.on("visualization_update", (data) => {
      this.store.dispatch(setVisualizationData(data));
    });

    // Audio analysis
    this.socket.on("audio_analysis", (data) => {
      // Handle audio analysis data if needed
      console.log("Received audio analysis:", data);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay *= 1.5; // Exponential backoff
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      this.handleError("Maximum reconnection attempts reached");
    }
  }

  handleError(message) {
    this.store.dispatch(setError(message));
    console.error(message);
  }

  // Room management
  joinRoom(roomId, universeId = null, mode = "view") {
    if (!this.socket?.connected) {
      this.handleError("Not connected to server");
      return false;
    }

    this.socket.emit("join_room", {
      room_id: roomId,
      universe_id: universeId,
      mode: mode,
    });
    return true;
  }

  leaveRoom(roomId) {
    if (!this.socket?.connected) {
      return false;
    }

    this.socket.emit("leave_room", { room_id: roomId });
    return true;
  }

  // Parameter updates
  updateParameters(parameters) {
    if (!this.socket?.connected) {
      this.handleError("Not connected to server");
      return false;
    }

    this.socket.emit("parameter_update", { parameters });
    return true;
  }

  // Music generation
  requestMusicGeneration(duration = 30, startTime = 0) {
    if (!this.socket?.connected) {
      this.handleError("Not connected to server");
      return false;
    }

    this.socket.emit("music_generation", {
      duration,
      start_time: startTime,
    });
    return true;
  }

  // Visualization updates
  requestVisualizationUpdate(width, height, quality = "high") {
    if (!this.socket?.connected) {
      this.handleError("Not connected to server");
      return false;
    }

    this.socket.emit("visualization_update", {
      width,
      height,
      quality,
    });
    return true;
  }

  // Audio analysis
  sendAudioAnalysis(frequencies) {
    if (!this.socket?.connected) {
      this.handleError("Not connected to server");
      return false;
    }

    this.socket.emit("audio_analysis", { frequencies });
    return true;
  }
}

export default WebSocketClient;
