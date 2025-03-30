import { useDispatch } from "react-redux";

// Safe wrapper for useDispatch hook
export function safeUseDispatch() {
  try {
    return useDispatch();
  } catch (error) {
    console.error("[ensure-redux-provider] Error using useDispatch:", error);
    // Return a no-op dispatch function as fallback
    return () => {
      console.warn(
        "[ensure-redux-provider] Dispatch called without Redux Provider"
      );
      return { type: "NO_OP" };
    };
  }
}
