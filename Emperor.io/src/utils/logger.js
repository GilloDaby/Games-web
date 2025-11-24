let debugEnabled = false;

export function setDebug(enabled) {
  debugEnabled = enabled;
}

export function debug(...args) {
  if (debugEnabled) console.debug("[DEBUG]", ...args);
}

export function info(...args) {
  console.info("[INFO]", ...args);
}

export function warn(...args) {
  console.warn("[WARN]", ...args);
}

export function error(...args) {
  console.error("[ERROR]", ...args);
}
