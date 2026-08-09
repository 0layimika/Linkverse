import express, { Request, NextFunction, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.route';
import { ExpressResponse, NotFound, InternalError } from "./utils/response";
import creatorRoute from "./routes/creator.route";
import mediaRoute from "./routes/media.route";
import linkRoute from "./routes/link.route";
import walletRoute from "./routes/wallet.route";
import giftRoute from "./routes/gift.route";
import webhookRoute from "./routes/webhook.route";
import profileRoute from "./routes/profile.route";
import analyticsRoute from "./routes/analytics.route";
import storeRoute from "./routes/store.route";
import { ALLOWED_ORIGINS, FRONTEND_URL } from "./config/env";
import { MailService } from "./services/mail.service";

const app = express();

//fucking work man

app.use((req, _res, next) => {
    if (req.url.startsWith('/api/api/')) {
        req.url = req.url.replace('/api/api/', '/api/');
    }
    console.log(`🚀 Route Attempt: ${req.method} ${req.url}`);
    next();
});

// CORS configuration
const allowedOriginsList = ALLOWED_ORIGINS
    ? ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [FRONTEND_URL];

console.log('Allowed CORS origins:', allowedOriginsList);

app.use(cors({
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Allow if origin is in allowed list
        if (allowedOriginsList.includes(origin)) {
            return callback(null, true);
        }

        // Allow all localhost origins for development
        if (origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        console.log('CORS blocked origin:', origin);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json({ verify: (req: Request & { rawBody?: string }, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/creator', creatorRoute);
app.use('/api/v1/media', mediaRoute);
app.use('/api/v1/links', linkRoute);
app.use('/api/v1/wallet', walletRoute);
app.use('/api/v1/gift', giftRoute);
app.use('/api/v1/webhooks', webhookRoute);
app.use('/api/v1/profile', profileRoute);
app.use('/api/v1/analytics', analyticsRoute);
app.use('/api/v1/store', storeRoute);

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/debug-cors', (req: Request, res: Response) => {
    res.json({
        incomingOrigin: req.headers.origin,
        allowedOriginsConfig: allowedOriginsList,
        envFrontendUrl: FRONTEND_URL,
        allHeaders: req.headers
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.get('/api/v1/dev/email-previews', (_req: Request, res: Response) => {
        res.type('html').send(MailService.previewGallery());
    });
}

// 404 handler - must be last
app.use((_req: Request, res: Response) => {
    return ExpressResponse(res, NotFound("Oops, this route does not exist here"));
});

// global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    return ExpressResponse(res, InternalError(err.message || 'Internal server error'));
});


export default app;
