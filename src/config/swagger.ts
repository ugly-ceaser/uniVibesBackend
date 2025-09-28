import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX } from '../utils/constants';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'APP NAME Backend API',
      version: '0.1.0',
      description: 'Backend API for APP NAME - A comprehensive university social platform',
      contact: {
        name: 'API Support',
        email: 'support@appname.com',
      },
    },
    servers: [
      {
        url: `http://localhost:3000${API_PREFIX}`,
        description: 'Development server',
      },
      {
        url: `https://api.appname.com${API_PREFIX}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
          required: ['error', 'message', 'statusCode'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
          required: ['success', 'message'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            fullName: {
              type: 'string',
              description: 'User full name',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'email', 'fullName', 'createdAt', 'updatedAt'],
        },
        AuthRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (minimum 6 characters)',
              example: 'password123',
            },
            fullName: {
              type: 'string',
              description: 'User full name (required for registration)',
              example: 'John Doe',
            },
          },
          required: ['email', 'password'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'JWT authentication token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
              required: ['user', 'token'],
            },
          },
          required: ['success', 'message', 'data'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of records',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of records per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
          required: ['total', 'page', 'limit', 'totalPages'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'User Profile',
        description: 'User profile management',
      },
      {
        name: 'Courses',
        description: 'University courses information',
      },
      {
        name: 'Forum',
        description: 'Community forum posts and discussions',
      },
      {
        name: 'Guide',
        description: 'University guides and resources',
      },
      {
        name: 'Map',
        description: 'Campus map locations and navigation',
      },
      {
        name: 'Likes',
        description: 'Content likes and reactions',
      },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.route.ts',
    './src/modules/**/*.controller.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .topbar-wrapper img {
      content: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><text y="15" font-family="Arial" font-size="14" fill="%23000">APP NAME API</text></svg>');
    }
    .swagger-ui .topbar { background-color: #1976d2; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  `,
  customSiteTitle: 'APP NAME API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
};

export { swaggerUi };