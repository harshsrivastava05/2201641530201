import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createShortUrl, redirectToLongUrl, getUrlStats } from './controllers/url.controller';
import { Log } from 'middleware-logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/shorturls', createShortUrl);
app.get('/api/stats', getUrlStats);

// Redirect Route
app.get('/:shortcode', redirectToLongUrl);

const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL not defined in .env file");
        }
        await mongoose.connect(process.env.DATABASE_URL);
        await Log('backend', 'info', 'db', 'Successfully connected to MongoDB.');
        
        app.listen(PORT, () => {
            Log('backend', 'info', 'service', `Server is running on port ${PORT}`);
        });
    } catch (error) {
        await Log('backend', 'fatal', 'service', `Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();