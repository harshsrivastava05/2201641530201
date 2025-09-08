import { Request, Response } from 'express';
import UrlModel, { IUrl } from '../models/url.model';
import { nanoid } from 'nanoid';
import { Log } from '../utils/logger';

const APP_URL = process.env.APP_URL || 'http://localhost:8000';

export const createShortUrl = async (req: Request, res: Response) => {
    const { url, validity, shortcode } = req.body;
    await Log('backend', 'info', 'handler', 'Received request to shorten URL.');

    if (!url) {
        await Log('backend', 'error', 'handler', 'Validation failed: URL is required.');
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        let code = shortcode;
        if (code) {
            const existing = await UrlModel.findOne({ shortCode: code });
            if (existing) {
                await Log('backend', 'warn', 'service', `Custom shortcode '${code}' already exists.`);
                return res.status(409).json({ error: 'Custom shortcode already in use.' });
            }
        } else {
            code = nanoid(7); // Generate a unique shortcode
        }

        const validityMinutes = validity ? parseInt(validity, 10) : 30;
        const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

        const newUrl: IUrl = new UrlModel({
            longUrl: url,
            shortCode: code,
            expiresAt: expiresAt,
        });

        await newUrl.save();
        await Log('backend', 'info', 'db', `Successfully saved new short URL with code: ${code}`);

        res.status(201).json({
            shortlink: `${APP_URL}/${code}`,
            expiry: expiresAt.toISOString(),
        });

    } catch (error: any) {
        await Log('backend', 'fatal', 'handler', `An unexpected error occurred: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const redirectToLongUrl = async (req: Request, res: Response) => {
    const { shortcode } = req.params;
    await Log('backend', 'info', 'handler', `Redirect request for shortcode: ${shortcode}`);

    try {
        const urlDoc = await UrlModel.findOne({ shortCode: shortcode });

        if (!urlDoc || new Date() > urlDoc.expiresAt) {
            await Log('backend', 'warn', 'service', `Shortcode not found or expired: ${shortcode}`);
            return res.status(404).send('URL not found or expired.');
        }

        urlDoc.clicks.push({
            timestamp: new Date(),
            source: req.headers['user-agent'] || 'Unknown',
        });
        await urlDoc.save();
        await Log('backend', 'info', 'db', `Logged click for shortcode: ${shortcode}`);

        return res.redirect(urlDoc.longUrl);
    } catch (error: any) {
        await Log('backend', 'error', 'handler', `Redirect failed for ${shortcode}: ${error.message}`);
        return res.status(500).send('Internal Server Error');
    }
};

export const getUrlStats = async (req: Request, res: Response) => {
    await Log('backend', 'info', 'handler', 'Request received for URL statistics.');
    try {
        const stats = await UrlModel.find({}).sort({ createdAt: -1 });
        await Log('backend', 'info', 'db', `Fetched ${stats.length} records for stats.`);
        res.status(200).json(stats);
    } catch (error: any) {
        await Log('backend', 'error', 'db', `Failed to fetch URL stats: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};