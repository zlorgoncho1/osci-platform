/**
 * Parses LOG_LEVEL env and returns NestJS logger level array.
 * Maps "info" -> "log" (Nest uses "log" for general info).
 * Default: log, warn, error when unset or invalid.
 */
const NEST_LEVELS = ['log', 'error', 'warn', 'debug', 'verbose'] as const;
const DEFAULT_LEVELS: (typeof NEST_LEVELS)[number][] = ['log', 'warn', 'error'];

export function getNestLoggerLevels(): (typeof NEST_LEVELS)[number][] {
  const raw = process.env.LOG_LEVEL?.trim();
  if (!raw) return [...DEFAULT_LEVELS];

  const levels = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => (s === 'info' ? 'log' : s))
    .filter((s): s is (typeof NEST_LEVELS)[number] =>
      NEST_LEVELS.includes(s as (typeof NEST_LEVELS)[number]),
    );

  if (levels.length === 0) return [...DEFAULT_LEVELS];
  return [...new Set(levels)];
}
