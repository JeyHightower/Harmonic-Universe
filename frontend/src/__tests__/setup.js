import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";

// Configure testing library
configure({ testIdAttribute: "data-testid" });

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}
global.ResizeObserver = MockResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const storageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = storageMock;
global.sessionStorage = storageMock;

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
  }
  send(data) {
    this.onmessage && this.onmessage({ data });
  }
  close() {
    this.onclose && this.onclose();
  }
}
global.WebSocket = MockWebSocket;
WebSocket.OPEN = 1;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
  }),
);

// Suppress React 18 Strict Mode warnings
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.("ReactDOM.render is no longer supported")) return;
  originalError.call(console, ...args);
};
