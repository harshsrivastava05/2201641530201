import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createShortUrl, redirectToLongUrl, getUrlStats } from './controllers/url.controller';
import { Log } from './utils/logger';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const app = express();
const PORT = process.env.PORT || 8000;

// Enhanced CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.post('/api/shorturls', createShortUrl);
app.get('/api/stats', getUrlStats);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Redirect Route
app.get('/:shortcode', redirectToLongUrl);

const startServer = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL!);
        await Log('backend', 'info', 'db', 'Successfully connected to MongoDB.');
        
        app.listen(PORT, () => {
            Log('backend', 'info', 'service', `Server is running on port ${PORT}`);
            console.log(`Backend server running at http://localhost:${PORT}`);
            console.log(`API endpoints available at http://localhost:${PORT}/api/`);
        });
    } catch (error: any) {
        await Log('backend', 'fatal', 'service', `Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();