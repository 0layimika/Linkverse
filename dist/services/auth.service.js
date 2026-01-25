"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const mail_service_1 = require("./mail.service");
const userRepo = new UserRepository_1.UserRepository();
class AuthService {
    static async register(data) {
        try {
            const { password, confirmPassword, ...rest } = data;
            const existingUser = await userRepo.findByEmail(rest.email);
            if (existingUser) {
                return (0, api_response_kit_1.BadRequest)("User already exists");
            }
            const password_hash = await bcryptjs_1.default.hash(password, 10);
            const user = await userRepo.create({
                ...rest,
                password_hash
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.JWT_SECRET, { expiresIn: "10m" });
            const verificationLink = `${env_1.FRONTEND_URL}/verify?token=${token}`;
            // Send verification email
            mail_service_1.MailService.sendVerificationEmail(rest.email, verificationLink);
            return (0, api_response_kit_1.Ok)({ user }, "User Created Successfully. Please check your email to verify your account.");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async verify(token) {
        try {
            const user = await jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
            if (!user) {
                return (0, api_response_kit_1.BadRequest)("Invalid Token");
            }
            const dbUser = await userRepo.findById(Number(user.id));
            if (!dbUser) {
                return (0, api_response_kit_1.NotFound)("User not found");
            }
            const updatedUser = await userRepo.update(Number(user.id), { verified: true });
            const Accesstoken = jsonwebtoken_1.default.sign({
                id: updatedUser.id,
                email: updatedUser.email,
            }, env_1.JWT_SECRET, { expiresIn: "10m" });
            return (0, api_response_kit_1.Ok)({ user: updatedUser, token: Accesstoken }, "User Verified Successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async forgotPassword(email) {
        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                return (0, api_response_kit_1.NotFound)(`User with email ${email} not found`);
            }
            const resetToken = jsonwebtoken_1.default.sign({ id: user.id }, env_1.JWT_SECRET, { expiresIn: "10m" });
            const resetLink = `${env_1.FRONTEND_URL}/reset-password?token=${resetToken}`;
            // Send forgot password email
            mail_service_1.MailService.sendForgotPasswordEmail(email, resetLink);
            return (0, api_response_kit_1.Ok)(null, `Password reset link has been sent to ${email}`);
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async resetPassword(token, newPassword) {
        try {
            const tokenUser = await jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
            if (!tokenUser) {
                return (0, api_response_kit_1.BadRequest)("Invalid Token Sent");
            }
            const user = await userRepo.findById(tokenUser.id);
            if (!user) {
                return (0, api_response_kit_1.NotFound)("User not found");
            }
            const password_hash = await bcryptjs_1.default.hash(newPassword, 10);
            await userRepo.update(tokenUser.id, { password_hash });
            return (0, api_response_kit_1.Ok)(null, "Password reset successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async login({ email, password }) {
        const user = await userRepo.findByEmail(email);
        if (!user) {
            return (0, api_response_kit_1.NotFound)("Email does not exist on system");
        }
        const passwordvalid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordvalid) {
            return (0, api_response_kit_1.Forbidden)("Incorrect Password");
        }
        if (!user.verified) {
            return (0, api_response_kit_1.Forbidden)("Please verify account");
        }
        const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: user.id }, { user: true });
        if (!creator) {
            return (0, api_response_kit_1.Forbidden)("You are yet to set up creator username");
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.JWT_SECRET, { expiresIn: "6h" });
        return (0, api_response_kit_1.Ok)({ creator, token: token }, "Login Successful");
    }
    static async resendVerificationLink(email) {
        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                return (0, api_response_kit_1.NotFound)(`User with email ${email} not found`);
            }
            if (user.verified) {
                return (0, api_response_kit_1.BadRequest)("Account is already verified");
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.JWT_SECRET, { expiresIn: "10m" });
            const verificationLink = `${env_1.FRONTEND_URL}/verify?token=${token}`;
            // Send verification email
            mail_service_1.MailService.sendVerificationEmail(email, verificationLink);
            return (0, api_response_kit_1.Ok)(null, `Verification link has been sent to ${email}`);
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async resendForgotPasswordLink(email) {
        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                return (0, api_response_kit_1.NotFound)(`User with email ${email} not found`);
            }
            const resetToken = jsonwebtoken_1.default.sign({ id: user.id }, env_1.JWT_SECRET, { expiresIn: "10m" });
            const resetLink = `${env_1.FRONTEND_URL}/reset-password?token=${resetToken}`;
            // Send forgot password email
            mail_service_1.MailService.sendForgotPasswordEmail(email, resetLink);
            return (0, api_response_kit_1.Ok)(null, `Password reset link has been sent to ${email}`);
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map