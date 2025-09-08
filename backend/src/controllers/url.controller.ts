import { Request, Response } from 'express';
import UrlModel, { IUrl } from '../models/url.model';
import { nanoid } from 'nanoid';
import { Log } from '../utils/logger';

const APP_URL = process.env.APP_URL || 'http://localhost:8000';

export const createShortUrl = async (req: Request, res: Response) => {
    const requestId = nanoid(8);
    const { url, validity, shortcode } = req.body;
    
    await Log('backend', 'info', 'handler', `[${requestId}] Received request to shorten URL. IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
    await Log('backend', 'debug', 'handler', `[${requestId}] Request body: ${JSON.stringify({ url: url?.substring(0, 100), validity, shortcode })}`);

    if (!url) {
        await Log('backend', 'error', 'handler', `[${requestId}] Validation failed: URL is required.`);
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        new URL(url);
        await Log('backend', 'debug', 'handler', `[${requestId}] URL format validation passed.`);
    } catch (error) {
        await Log('backend', 'error', 'handler', `[${requestId}] Invalid URL format: ${url}`);
        return res.status(400).json({ error: 'Invalid URL format.' });
    }

    if (validity && (!/^\d+$/.test(validity) || parseInt(validity) <= 0 || parseInt(validity) > 43200)) {
        await Log('backend', 'error', 'handler', `[${requestId}] Invalid validity value: ${validity}`);
        return res.status(400).json({ error: 'Validity must be a positive integer (max 43200 minutes).' });
    }

    if (shortcode && (shortcode.length < 3 || shortcode.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(shortcode))) {
        await Log('backend', 'error', 'handler', `[${requestId}] Invalid shortcode format: ${shortcode}`);
        return res.status(400).json({ error: 'Shortcode must be 3-20 characters, alphanumeric with dashes and underscores only.' });
    }

    try {
        await Log('backend', 'info', 'service', `[${requestId}] Starting URL shortening process.`);
        
        let code = shortcode;
        if (code) {
            await Log('backend', 'debug', 'service', `[${requestId}] Checking custom shortcode availability: ${code}`);
            const existing = await UrlModel.findOne({ shortCode: code });
            if (existing) {
                await Log('backend', 'warn', 'service', `[${requestId}] Custom shortcode '${code}' already exists.`);
                return res.status(409).json({ error: 'Custom shortcode already in use.' });
            }
            await Log('backend', 'info', 'service', `[${requestId}] Custom shortcode '${code}' is available.`);
        } else {
            
            let attempts = 0;
            const maxAttempts = 5;
            
            do {
                code = nanoid(7);
                attempts++;
                await Log('backend', 'debug', 'service', `[${requestId}] Generated shortcode attempt ${attempts}: ${code}`);
                
                const existing = await UrlModel.findOne({ shortCode: code });
                if (!existing) {
                    await Log('backend', 'info', 'service', `[${requestId}] Generated unique shortcode: ${code}`);
                    break;
                }
                
                if (attempts >= maxAttempts) {
                    await Log('backend', 'error', 'service', `[${requestId}] Failed to generate unique shortcode after ${maxAttempts} attempts.`);
                    return res.status(500).json({ error: 'Unable to generate unique shortcode. Please try again.' });
                }
            } while (attempts < maxAttempts);
        }

        const validityMinutes = validity ? parseInt(validity, 10) : 30;
        const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);
        
        await Log('backend', 'debug', 'service', `[${requestId}] Setting expiry to ${validityMinutes} minutes: ${expiresAt.toISOString()}`);

        await Log('backend', 'debug', 'db', `[${requestId}] Creating new URL document.`);
        const newUrl: IUrl = new UrlModel({
            longUrl: url,
            shortCode: code,
            expiresAt: expiresAt,
        });

        await Log('backend', 'debug', 'db', `[${requestId}] Saving URL document to database.`);
        await newUrl.save();
        await Log('backend', 'info', 'db', `[${requestId}] Successfully saved new short URL with code: ${code}, expires: ${expiresAt.toISOString()}`);

        const response = {
            shortlink: `${APP_URL}/${code}`,
            expiry: expiresAt.toISOString(),
        };

        await Log('backend', 'info', 'handler', `[${requestId}] URL shortening completed successfully. Response: ${JSON.stringify(response)}`);
        res.status(201).json(response);

    } catch (error: any) {
        await Log('backend', 'fatal', 'handler', `[${requestId}] An unexpected error occurred: ${error.message}`);
        await Log('backend', 'debug', 'handler', `[${requestId}] Error stack: ${error.stack}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const redirectToLongUrl = async (req: Request, res: Response) => {
    const requestId = nanoid(8);
    const { shortcode } = req.params;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip;
    const referer = req.headers['referer'] || 'Direct';
    
    await Log('backend', 'info', 'handler', `[${requestId}] Redirect request for shortcode: ${shortcode}, IP: ${ip}, Referer: ${referer}`);
    await Log('backend', 'debug', 'handler', `[${requestId}] User-Agent: ${userAgent}`);

    // Validate shortcode format
    if (!shortcode || shortcode.length < 3 || shortcode.length > 20) {
        await Log('backend', 'warn', 'handler', `[${requestId}] Invalid shortcode format: ${shortcode}`);
        return res.status(400).send('Invalid shortcode format.');
    }

    try {
        await Log('backend', 'debug', 'db', `[${requestId}] Querying database for shortcode: ${shortcode}`);
        const urlDoc = await UrlModel.findOne({ shortCode: shortcode });

        if (!urlDoc) {
            await Log('backend', 'warn', 'service', `[${requestId}] Shortcode not found: ${shortcode}`);
            return res.status(404).send('URL not found.');
        }

        await Log('backend', 'debug', 'service', `[${requestId}] Found URL document. Expires: ${urlDoc.expiresAt.toISOString()}`);

        const now = new Date();
        if (now > urlDoc.expiresAt) {
            await Log('backend', 'warn', 'service', `[${requestId}] Shortcode expired: ${shortcode}, expired at: ${urlDoc.expiresAt.toISOString()}`);
            return res.status(410).send('URL has expired.');
        }

        await Log('backend', 'info', 'service', `[${requestId}] Valid URL found, preparing redirect to: ${urlDoc.longUrl}`);

        const clickData = {
            timestamp: new Date(),
            source: userAgent,
            ip: ip,
            referer: referer
        };

        await Log('backend', 'debug', 'db', `[${requestId}] Recording click data: ${JSON.stringify(clickData)}`);
        
        urlDoc.clicks.push({
            timestamp: clickData.timestamp,
            source: `${userAgent} | IP: ${ip} | Ref: ${referer}`.substring(0, 500)
        });

        await urlDoc.save();
        await Log('backend', 'info', 'db', `[${requestId}] Click logged for shortcode: ${shortcode}, total clicks: ${urlDoc.clicks.length}`);

        await Log('backend', 'info', 'handler', `[${requestId}] Redirecting to: ${urlDoc.longUrl}`);
        return res.redirect(urlDoc.longUrl);

    } catch (error: any) {
        await Log('backend', 'error', 'handler', `[${requestId}] Redirect failed for ${shortcode}: ${error.message}`);
        await Log('backend', 'debug', 'handler', `[${requestId}] Error stack: ${error.stack}`);
        return res.status(500).send('Internal Server Error');
    }
};

export const getUrlStats = async (req: Request, res: Response) => {
    const requestId = nanoid(8);
    const { limit, offset, sortBy, order } = req.query;
    
    await Log('backend', 'info', 'handler', `[${requestId}] Request received for URL statistics. Query params: ${JSON.stringify(req.query)}`);

    try {
        
        const limitNum = limit ? parseInt(limit as string, 10) : 50;
        const offsetNum = offset ? parseInt(offset as string, 10) : 0;
        const sortField = (sortBy as string) || 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        await Log('backend', 'debug', 'service', `[${requestId}] Parsed parameters - limit: ${limitNum}, offset: ${offsetNum}, sort: ${sortField} ${order}`);

        if (limitNum > 1000) {
            await Log('backend', 'warn', 'handler', `[${requestId}] Limit too high: ${limitNum}, using 1000`);
        }

        await Log('backend', 'debug', 'db', `[${requestId}] Querying database for statistics.`);
        
        const query = UrlModel.find({});
        
        const sortObj: any = {};
        sortObj[sortField] = sortOrder;
        query.sort(sortObj);
        
        query.skip(offsetNum).limit(Math.min(limitNum, 1000));

        const stats = await query.exec();
        
        await Log('backend', 'info', 'db', `[${requestId}] Fetched ${stats.length} records for stats.`);

        const totalStats = {
            totalUrls: stats.length,
            totalClicks: stats.reduce((sum, url) => sum + url.clicks.length, 0),
            activeUrls: stats.filter(url => new Date() <= url.expiresAt).length,
            expiredUrls: stats.filter(url => new Date() > url.expiresAt).length
        };

        await Log('backend', 'debug', 'service', `[${requestId}] Statistics summary: ${JSON.stringify(totalStats)}`);

        const response = {
            data: stats,
            meta: {
                total: stats.length,
                limit: limitNum,
                offset: offsetNum,
                ...totalStats
            }
        };

        await Log('backend', 'info', 'handler', `[${requestId}] Successfully returning statistics response.`);
        res.status(200).json(response);

    } catch (error: any) {
        await Log('backend', 'error', 'db', `[${requestId}] Failed to fetch URL stats: ${error.message}`);
        await Log('backend', 'debug', 'db', `[${requestId}] Error stack: ${error.stack}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};