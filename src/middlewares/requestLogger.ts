import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const existing = req.headers['x-request-id'] as string | undefined;
  const id = existing || uuidv4();
  (req as any).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

morgan.token('req-id', (req) => (req as any).id || '-');

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export const requestLogger = morgan(':req-id :method :url :status :res[content-length] - :response-time ms', { stream });

export const CLIENT_IP_LOG_MAX_XFF = 512;

/** Bounds and quotes a client-supplied header value for a single log line. */
const quoteForLog = (value: string, max: number) => {
  const truncated = value.length > max ? `${value.slice(0, max)}...(truncated)` : value;
  return truncated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

/**
 * Diagnostic line for choosing TRUST_PROXY (enabled by LOG_CLIENT_IP=true).
 * The raw X-Forwarded-For is logged because req.ips only lists the trusted hops.
 * The line also goes to stdout: in production the winston logger only writes to files,
 * and Render's log view only shows stdout/stderr.
 */
export const clientIpLogger = (req: Request, _res: Response, next: NextFunction) => {
  const rawXff = req.headers['x-forwarded-for'];
  const xff = quoteForLog(Array.isArray(rawXff) ? rawXff.join(', ') : rawXff ?? '', CLIENT_IP_LOG_MAX_XFF);
  const requestIdValue = quoteForLog(String((req as any).id ?? '-'), 128);
  const line = `client-ip requestId=${requestIdValue} ip=${req.ip} ips=${req.ips.join(',') || '-'} xff="${xff}"`;
  logger.info(line);
  console.log(line);
  next();
};
