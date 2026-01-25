"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const connectDB_1 = require("./db/connectDB");
const PORT = process.env.PORT || 8010;
const startServer = async () => {
    // Check DB connection first
    await (0, connectDB_1.connectDB)();
    // Then start server
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=index.js.map