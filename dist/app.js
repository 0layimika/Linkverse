"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const response_1 = require("./utils/response");
const creator_route_1 = __importDefault(require("./routes/creator.route"));
const media_route_1 = __importDefault(require("./routes/media.route"));
const link_route_1 = __importDefault(require("./routes/link.route"));
const wallet_route_1 = __importDefault(require("./routes/wallet.route"));
const gift_route_1 = __importDefault(require("./routes/gift.route"));
const webhook_route_1 = __importDefault(require("./routes/webhook.route"));
const profile_route_1 = __importDefault(require("./routes/profile.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// CORS configuration - allow all origins in development
// const isDevelopment = process.env.NODE_ENV !== 'production';
app.use((0, cors_1.default)({
    origin: env_1.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// routes
app.use('/api/v1/auth', auth_route_1.default);
app.use('/api/v1/creator', creator_route_1.default);
app.use('/api/v1/media', media_route_1.default);
app.use('/api/v1/links', link_route_1.default);
app.use('/api/v1/wallet', wallet_route_1.default);
app.use('/api/v1/gift', gift_route_1.default);
app.use('/api/v1/webhooks', webhook_route_1.default);
app.use('/api/v1/profile', profile_route_1.default);
app.use('/api/v1/analytics', analytics_route_1.default);
app.use((_req, res) => {
    return (0, response_1.ExpressResponse)(res, (0, response_1.NotFound)("Oops, this route does not exist here"));
});
// global error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message || 'Internal server error'));
});
exports.default = app;
//# sourceMappingURL=app.js.map