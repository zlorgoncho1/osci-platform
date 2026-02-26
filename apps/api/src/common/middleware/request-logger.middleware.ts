import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    const ip = first?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = typeof realIp === 'string' ? realIp.trim() : realIp[0]?.trim();
    if (ip) return ip;
  }
  if (req.ip) return req.ip;
  return null;
}

/**
 * Express middleware: logs each request after finish (method, url, status, duration, optional IP).
 * Skips /health to avoid noise from healthchecks.
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/health') {
    return next();
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = getClientIp(req);
    const ipPart = ip ? ` ${ip}` : '';
    const logger = new Logger('HttpRequest');
    logger.log(
      `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms${ipPart}`,
    );
  });
  next();
}
