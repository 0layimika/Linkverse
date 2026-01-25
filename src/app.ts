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
import { FRONTEND_URL } from "./config/env";

const app = express();

// CORS configuration - allow all origins in development
// const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
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

app.use((_req: Request, res: Response) => {
    return ExpressResponse(res, NotFound("Oops, this route does not exist here"));
});

// global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    return ExpressResponse(res, InternalError(err.message || 'Internal server error'));
});


export default app;