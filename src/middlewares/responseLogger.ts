import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

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
  
  // Color coding for different status codes
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return '\x1b[32m'; // Green
    if (status >= 300 && status < 400) return '\x1b[33m'; // Yellow
    if (status >= 400 && status < 500) return '\x1b[31m'; // Red
    if (status >= 500) return '\x1b[35m'; // Magenta
    return '\x1b[0m'; // Reset
  };
  
  const statusColor = getStatusColor(statusCode);
  const resetColor = '\x1b[0m';
  
  console.log('\n' + '='.repeat(80));
  console.log(`${statusColor}📤 RESPONSE [${statusCode}]${resetColor} ${method} ${url}`);
  
  if (requestId) {
    console.log(`🔍 Request ID: ${requestId}`);
  }
  
  if (responseTime !== undefined) {
    console.log(`⏱️  Response Time: ${responseTime}ms`);
  }
  
  if (responseSize !== undefined) {
    console.log(`📊 Response Size: ${responseSize} bytes`);
  }
  
  // Log response body with pretty formatting
  if (body !== undefined) {
    console.log('📋 Response Body:');
    try {
      if (typeof body === 'string') {
        // Try to parse as JSON for better formatting
        try {
          const parsed = JSON.parse(body);
          console.log(JSON.stringify(parsed, null, 2));
        } catch {
          console.log(body);
        }
      } else {
        console.log(JSON.stringify(body, null, 2));
      }
    } catch (error) {
      console.log('❌ Error formatting response body:', error);
      console.log(body);
    }
  }
  
  console.log('='.repeat(80) + '\n');
}

// Alternative simpler version for less verbose logging
export const simpleResponseLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(body: any) {
    console.log(`📤 [${res.statusCode}] ${req.method} ${req.originalUrl} - Response:`, 
      typeof body === 'string' && body.length > 200 ? body.substring(0, 200) + '...' : body
    );
    return originalSend.call(this, body);
  };
  
  res.json = function(body: any) {
    console.log(`📤 [${res.statusCode}] ${req.method} ${req.originalUrl} - JSON Response:`, body);
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
