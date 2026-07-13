import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface ResponseData {
  statusCode: number;
  method: string;
  url: string;
  responseTime?: number;
  responseSize?: number;
  requestId?: string;
  body?: any;
}

export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store the original send function
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send
  res.send = function(body: any) {
    logResponse({
      statusCode: res.statusCode,
      method: req.method,
      url: req.originalUrl,
      responseTime: Date.now() - startTime,
      responseSize: Buffer.byteLength(body || '', 'utf8'),
      requestId: (req as any).id,
      body: body
    });
    
    return originalSend.call(this, body);
  };
  
  // Override res.json
  res.json = function(body: any) {
    const jsonBody = JSON.stringify(body);
    logResponse({
      statusCode: res.statusCode,
      method: req.method,
      url: req.originalUrl,
      responseTime: Date.now() - startTime,
      responseSize: Buffer.byteLength(jsonBody, 'utf8'),
      requestId: (req as any).id,
      body: body
    });
    
    return originalJson.call(this, body);
  };
  
  next();
};

function logResponse(data: ResponseData) {
  const { statusCode, method, url, responseTime, responseSize, requestId, body } = data;
  
  let logMsg = `\n================================================================================\n`;
  logMsg += `📤 RESPONSE [${statusCode}] ${method} ${url}\n`;
  
  if (requestId) {
    logMsg += `🔍 Request ID: ${requestId}\n`;
  }
  
  if (responseTime !== undefined) {
    logMsg += `⏱️  Response Time: ${responseTime}ms\n`;
  }
  
  if (responseSize !== undefined) {
    logMsg += `📊 Response Size: ${responseSize} bytes\n`;
  }
  
  // Log response body with pretty formatting
  if (body !== undefined) {
    logMsg += '📋 Response Body:\n';
    try {
      if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          logMsg += JSON.stringify(parsed, null, 2);
        } catch {
          logMsg += body;
        }
      } else {
        logMsg += JSON.stringify(body, null, 2);
      }
    } catch (error) {
      logMsg += `❌ Error formatting response body: ${error}\n${body}`;
    }
  }
  
  logMsg += `\n================================================================================\n`;
  
  logger.debug(logMsg);
}

// Alternative simpler version for less verbose logging
export const simpleResponseLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(body: any) {
    logger.debug(`📤 [${res.statusCode}] ${req.method} ${req.originalUrl} - Response: ${
      typeof body === 'string' && body.length > 200 ? body.substring(0, 200) + '...' : body
    }`);
    return originalSend.call(this, body);
  };
  
  res.json = function(body: any) {
    logger.debug(`📤 [${res.statusCode}] ${req.method} ${req.originalUrl} - JSON Response: ${JSON.stringify(body)}`);
    return originalJson.call(this, body);
  };
  
  next();
};

// Conditional logger based on environment
export const conditionalResponseLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!env.enableResponseLogging) {
    return next();
  }
  
  switch (env.responseLogLevel) {
    case 'simple':
      return simpleResponseLogger(req, res, next);
    case 'detailed':
      return responseLogger(req, res, next);
    case 'none':
      return next();
    default:
      return responseLogger(req, res, next);
  }
};
