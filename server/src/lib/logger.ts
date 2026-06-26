
type LogLevel = "info" | "warn" | "error" | "debug";

const colors = {
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
  debug: "\x1b[35m",  // magenta
  reset: "\x1b[0m",
};

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const timestamp = new Date().toISOString();
  const color = colors[level];
  const prefix = `${color}[${level.toUpperCase()}]${colors.reset}`;
  const base = `${prefix} ${timestamp} — ${message}`;

  if (meta && Object.keys(meta).length > 0) {
    console.log(base, meta);
  } else {
    console.log(base);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
};