"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const knex_1 = __importDefault(require("./knex"));
const connectDB = async () => {
    try {
        // Run a simple query to check connection
        await knex_1.default.raw('SELECT 1+1 AS result');
        console.log('✅ Database connected successfully');
    }
    catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1); // exit if DB is not reachable
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=connectDB.js.map