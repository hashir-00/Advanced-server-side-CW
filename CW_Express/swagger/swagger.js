const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config/config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Influencer Platform API',
      version: '1.0.0',
      description: 'API documentation for the Alumni Influencer Platform with blind bidding system',
      contact: {
        name: 'API Support',
        email: 'support@university.edu'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['alumni', 'admin']
            }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer'
            },
            linkedinUrl: {
              type: 'string'
            },
            bio: {
              type: 'string'
            },
            profileImagePath: {
              type: 'string'
            }
          }
        },
        Bid: {
          type: 'object',
          properties: {
            bidId: {
              type: 'integer'
            },
            userId: {
              type: 'integer'
            },
            bidAmount: {
              type: 'number',
              format: 'decimal'
            },
            targetDate: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['active', 'won', 'lost', 'withdrawn']
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
