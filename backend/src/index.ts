import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createShortUrl, redirectToLongUrl, getUrlStats } from './controllers/url.controller';
import { Log } from './utils/logger';

dotenv.config();

const initializeLogger = async () => {
    await Log('backend', 'info', 'service', 'Logger system initialized.');
    await Log('backend', 'info', 'config', `Node environment: ${process.env.NODE_ENV || 'development'}`);
    await Log('backend', 'info', 'config', `Application URL configured as: ${process.env.APP_URL || 'http://localhost:8000'}`);
};

const validateEnvironment = async () => {
    await Log('backend', 'info', 'config', 'Validating environment variables...');
    
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars: string[] = [];
    
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }
    
    if (missingVars.length > 0) {
        await Log('backend', 'fatal', 'config', `Missing required environment variables: ${missingVars.join(', ')}`);
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }
    
    const optionalVars = ['FRONTEND_URL', 'JWT_SECRET', 'EVALUATION_SERVER_URL'];
    for (const envVar of optionalVars) {
        const status = process.env[envVar] ? 'configured' : 'not configured';
        await Log('backend', 'debug', 'config', `${envVar}: ${status}`);
    }
    
    await Log('backend', 'info', 'config', 'Environment validation completed successfully.');
};

const app = express();
const PORT = process.env.PORT || 8000;

const initializeSystems = async () => {
    await initializeLogger();
    await validateEnvironment();
};

const setupCORS = async () => {
    await Log('backend', 'info', 'middleware', 'Setting up CORS configuration...');
    
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    await Log('backend', 'debug', 'middleware', `CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
    
    app.use(cors({
        origin: (origin, callback) => {
            
            if (!origin) {
                Log('backend', 'debug', 'middleware', 'Request with no origin allowed');
                return callback(null, true);
            }
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                Log('backend', 'debug', 'middleware', `CORS: Origin ${origin} allowed`);
                callback(null, true);
            } else {
                Log('backend', 'warn', 'middleware', `CORS: Origin ${origin} blocked`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        optionsSuccessStatus: 200
    }));

    app.options('*', cors());
    
    await Log('backend', 'info', 'middleware', 'CORS configuration completed.');
};

const setupRequestLogging = async () => {
    await Log('backend', 'info', 'middleware', 'Setting up request logging middleware...');
    
    app.use((req, res, next) => {
        const startTime = Date.now();
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        (req as any).requestId = requestId;
        
        Log('backend', 'info', 'middleware', 
            `[${requestId}] ${req.method} ${req.path} - IP: ${req.ip}, User-Agent: ${req.headers['user-agent'] || 'Unknown'}`
        );
        
        if (req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
            Log('backend', 'debug', 'middleware', 
                `[${requestId}] Request body: ${JSON.stringify(req.body, null, 2).substring(0, 500)}`
            );
        }
        
        const originalSend = res.send;
        res.send = function(body) {
            const duration = Date.now() - startTime;
            Log('backend', 'info', 'middleware', 
                `[${requestId}] Response: ${res.statusCode} - ${duration}ms`
            );
            
            if (res.statusCode >= 400) {
                Log('backend', 'warn', 'middleware', 
                    `[${requestId}] Error response body: ${typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200)}`
                );
            }
            
            return originalSend.call(this, body);
        };
        
        next();
    });
    
    await Log('backend', 'info', 'middleware', 'Request logging middleware setup completed.');
};

const setupMiddleware = async () => {
    await Log('backend', 'info', 'middleware', 'Setting up middleware...');
    
    await setupCORS();
    await setupRequestLogging();
    
    app.use(express.json({ 
        limit: '10mb',
        type: 'application/json'
    }));
    
    app.use(express.urlencoded({ 
        extended: true, 
        limit: '10mb' 
    }));
    
    await Log('backend', 'info', 'middleware', 'All middleware setup completed.');
};

const setupRoutes = async () => {
    await Log('backend', 'info', 'route', 'Setting up API routes...');
    
    app.post('/api/shorturls', async (req, res) => {
        await Log('backend', 'debug', 'route', `POST /api/shorturls called`);
        return createShortUrl(req, res);
    });
    
    app.get('/api/stats', async (req, res) => {
        await Log('backend', 'debug', 'route', `GET /api/stats called`);
        return getUrlStats(req, res);
    });

    app.get('/api/health', async (req, res) => {
        await Log('backend', 'debug', 'route', 'Health check requested');
        
        try {
            
            const dbState = mongoose.connection.readyState;
            const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
            
            await Log('backend', 'debug', 'service', `Database status: ${dbStatus} (state: ${dbState})`);
            
            const healthData = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: dbStatus,
                memory: process.memoryUsage(),
                version: process.version,
                environment: process.env.NODE_ENV || 'development'
            };
            
            await Log('backend', 'info', 'route', `Health check successful: ${JSON.stringify(healthData)}`);
            res.json(healthData);
        } catch (error: any) {
            await Log('backend', 'error', 'route', `Health check failed: ${error.message}`);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    });

    app.get('/:shortcode', async (req, res) => {
        await Log('backend', 'debug', 'route', `GET /:shortcode called with shortcode: ${req.params.shortcode}`);
        return redirectToLongUrl(req, res);
    });

    app.use('*', async (req, res) => {
        await Log('backend', 'warn', 'route', `404 - Route not found: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ error: 'Route not found' });
    });
    
    app.use(async (error: any, req: any, res: any, next: any) => {
        await Log('backend', 'error', 'middleware', `Global error handler: ${error.message}`);
        await Log('backend', 'debug', 'middleware', `Error stack: ${error.stack}`);
        
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    
    await Log('backend', 'info', 'route', 'All routes setup completed.');
};

const connectDatabase = async (): Promise<void> => {
    await Log('backend', 'info', 'db', 'Attempting to connect to MongoDB...');
    await Log('backend', 'debug', 'db', `Connection string: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')}`);
    
    try {
        
        mongoose.connection.on('connecting', async () => {
            await Log('backend', 'info', 'db', 'MongoDB connection establishing...');
        });
        
        mongoose.connection.on('connected', async () => {
            await Log('backend', 'info', 'db', 'MongoDB connected successfully.');
        });
        
        mongoose.connection.on('disconnected', async () => {
            await Log('backend', 'warn', 'db', 'MongoDB disconnected.');
        });
        
        mongoose.connection.on('error', async (error) => {
            await Log('backend', 'error', 'db', `MongoDB connection error: ${error.message}`);
        });
        
        mongoose.connection.on('reconnected', async () => {
            await Log('backend', 'info', 'db', 'MongoDB reconnected.');
        });
        
        const connectionOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        };
        
        await Log('backend', 'debug', 'db', `Connection options: ${JSON.stringify(connectionOptions)}`);
        
        await mongoose.connect(process.env.DATABASE_URL!, connectionOptions);
        
        const connection = mongoose.connection;
        await Log('backend', 'info', 'db', `Connected to database: ${connection.name} on ${connection.host}:${connection.port}`);
        
    } catch (error: any) {
        await Log('backend', 'fatal', 'db', `Failed to connect to MongoDB: ${error.message}`);
        await Log('backend', 'debug', 'db', `Connection error stack: ${error.stack}`);
        throw error;
    }
};

const startServer = async (): Promise<void> => {
    try {
        await Log('backend', 'info', 'service', '🚀 Starting URL Shortener Backend Server...');
        
        await initializeSystems();
        await connectDatabase();
        await setupMiddleware();
        await setupRoutes();
        
        const server = app.listen(PORT, async () => {
            await Log('backend', 'info', 'service', `✅ Server is running on port ${PORT}`);
            await Log('backend', 'info', 'service', `🌐 Backend server available at http://localhost:${PORT}`);
            await Log('backend', 'info', 'service', `📡 API endpoints available at http://localhost:${PORT}/api/`);
            await Log('backend', 'info', 'service', `🏥 Health check available at http://localhost:${PORT}/api/health`);
            
            console.log(`✅ Backend server running at http://localhost:${PORT}`);
            console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
        });
        
        const gracefulShutdown = async (signal: string) => {
            await Log('backend', 'warn', 'service', `🛑 ${signal} received. Initiating graceful shutdown...`);
            
            server.close(async () => {
                await Log('backend', 'info', 'service', '🔌 HTTP server closed.');
                
                try {
                    await mongoose.connection.close();
                    await Log('backend', 'info', 'db', '🔌 Database connection closed.');
                } catch (error: any) {
                    await Log('backend', 'error', 'db', `Error closing database connection: ${error.message}`);
                }
                
                await Log('backend', 'info', 'service', '👋 Graceful shutdown completed.');
                process.exit(0);
            });
            
            setTimeout(async () => {
                await Log('backend', 'fatal', 'service', '⏰ Shutdown timeout reached. Force exiting...');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
    } catch (error: any) {
        await Log('backend', 'fatal', 'service', `❌ Failed to start server: ${error.message}`);
        await Log('backend', 'debug', 'service', `Startup error stack: ${error.stack}`);
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

process.on('uncaughtException', async (error) => {
    await Log('backend', 'fatal', 'service', `Uncaught Exception: ${error.message}`);
    await Log('backend', 'debug', 'service', `Uncaught Exception stack: ${error.stack}`);
    process.exit(1);
});

process.on('unhandledRejection', async (reason: any) => {
    await Log('backend', 'fatal', 'service', `Unhandled Rejection: ${reason?.message || reason}`);
    await Log('backend', 'debug', 'service', `Unhandled Rejection details: ${JSON.stringify(reason)}`);
    process.exit(1);
});

startServer();