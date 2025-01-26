const env = process.env.NODE_ENV || "development";

const config = {
  development: {
    apiUrl: "http://localhost:5001",
    wsUrl: "ws://localhost:5001",
    debug: true,
  },
  test: {
    apiUrl: "http://localhost:5001",
    wsUrl: "ws://localhost:5001",
    debug: true,
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL,
    wsUrl: process.env.REACT_APP_WS_URL,
    debug: false,
  },
};

export default {
  ...config[env],
  env,
  title: "Harmonic Universe",
  description: "A musical universe exploration platform",
  version: process.env.REACT_APP_VERSION || "1.0.0",

  // Feature flags
  features: {
    analytics: true,
    audioVisualization: true,
    collaboration: true,
    preferences: true,
  },

  // API endpoints
  endpoints: {
    auth: "/api/auth",
    universe: "/api/universe",
    audio: "/api/audio",
    users: "/api/users",
    analytics: "/api/analytics",
  },

  // WebSocket events
  wsEvents: {
    connect: "connect",
    disconnect: "disconnect",
    universeUpdate: "universe:update",
    audioSync: "audio:sync",
    userPresence: "user:presence",
  },

  // Constants
  constants: {
    maxAudioDuration: 600, // 10 minutes
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedAudioFormats: [".mp3", ".wav", ".ogg"],
    defaultTheme: "dark",
  },
};
