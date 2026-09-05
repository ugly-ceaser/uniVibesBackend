import { Request, Response } from 'express';
import http from 'http';
import { URL } from 'url';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'http://127.0.0.1:8000';

export const proxyToRagBackend = (req: Request, res: Response) => {
  try {
    const targetUrl = new URL(req.originalUrl, RAG_BACKEND_URL);
    
    // Remove /api/v1 prefix if present for target matching
    let targetPath = targetUrl.pathname;
    if (targetPath.startsWith('/api/v1')) {
      targetPath = targetPath.replace('/api/v1', '');
    }

    const options: http.RequestOptions = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetPath + targetUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${targetUrl.hostname}:${targetUrl.port || 8000}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('[RAG Proxy Error]:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: true, message: 'RAG Backend Service Unavailable' });
      }
    });

    // If body has already been parsed as JSON by express.json middleware
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0 && !req.is('multipart/*')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('content-type', 'application/json');
      proxyReq.setHeader('content-length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end();
    } else {
      req.pipe(proxyReq, { end: true });
    }
  } catch (err: any) {
    console.error('[RAG Proxy Setup Error]:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: true, message: 'Proxy configuration error' });
    }
  }
};
