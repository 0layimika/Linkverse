import { UserRepository } from "../repositories/UserRepository";
import { BadRequest, Forbidden, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET, FRONTEND_URL } from "../config/env";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { MailService } from "./mail.service";

const userRepo = new UserRepository();

export class AuthService {
    static async register(data: { email: string, password: string, confirmPassword: string }) {
        try {
            const { password, confirmPassword, ...rest } = data
            const existingUser = await userRepo.findByEmail(rest.email);
            if (existingUser) {
                return BadRequest("User already exists");
            }
            const password_hash = await bcrypt.hash(password, 10);
            const user = await userRepo.create({
                ...rest,
                password_hash
            })
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "10m" });
            const verificationLink = `${FRONTEND_URL}/verify?token=${token}`

            // Send verification email
            MailService.sendVerificationEmail(rest.email, verificationLink);

            return Ok({ user }, "User Created Successfully. Please check your email to verify your account.")
        } catch (err: any) {
            return InternalError(err.message)
        }
    }

    static async verify(token: string) {
        try {
            const user = await jwt.verify(token, JWT_SECRET) as JwtPayload
            if (!user) {
                return BadRequest("Invalid Token");
            }
            const dbUser = await userRepo.findById(Number(user.id))
            if (!dbUser) {
                return NotFound("User not found")
            }
            const updatedUser = await userRepo.update(Number(user.id), { verified: true })
            const Accesstoken = jwt.sign({
                id: updatedUser.id,
                email: updatedUser.email,
            }, JWT_SECRET, { expiresIn: "10m" });
            return Ok({ user: updatedUser, token: Accesstoken }, "User Verified Successfully")
        } catch (err: any) {
            return InternalError(err.message)
        }
    }

    static async forgotPassword(email: string) {
        try {
            const user = await userRepo.findByEmail(email)
            if (!user) {
                return NotFound(`User with email ${email} not found`);
            }
            const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10m" });
            const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`

            // Send forgot password email
            MailService.sendForgotPasswordEmail(email, resetLink);

            return Ok(null, `Password reset link has been sent to ${email}`)
        } catch (err: any) {
            return InternalError(err.message)
        }
    }

    static async resetPassword(token: string, newPassword: string) {
        try {
            const tokenUser = await jwt.verify(token, JWT_SECRET) as JwtPayload
            if (!tokenUser) {
                return BadRequest("Invalid Token Sent")
            }
            const user = await userRepo.findById(tokenUser.id)
            if (!user) {
                return NotFound("User not found")
            }
            const password_hash = await bcrypt.hash(newPassword, 10)
            await userRepo.update(tokenUser.id, { password_hash })
            return Ok(null, "Password reset successfully")
        } catch (err: any) {
            return InternalError(err.message)
        }
    }

    static async login({ email, password }: { email: string, password: string }) {
        const user = await userRepo.findByEmail(email)
        if (!user) {
            return NotFound("Email does not exist on system")
        }
        const passwordvalid = await bcrypt.compare(password, user.password_hash)
        if (!passwordvalid) {
            return Forbidden("Incorrect Password")
        }
        if (!user.verified) {
            return Forbidden("Please verify account")
        }
        const creator = await CreatorRepository.getOneWhere({ user_id: user.id }, { user: true })
        if (!creator) {
            return Forbidden("You are yet to set up creator username")
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "6h" })
        return Ok({ creator, token: token }, "Login Successful")
    }

    static async resendVerificationLink(email: string) {
        try {
            const user = await userRepo.findByEmail(email)
            if (!user) {
                return NotFound(`User with email ${email} not found`);
            }
            if (user.verified) {
                return BadRequest("Account is already verified");
            }
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "10m" });
            const verificationLink = `${FRONTEND_URL}/verify?token=${token}`

            // Send verification email
            MailService.sendVerificationEmail(email, verificationLink);

            return Ok(null, `Verification link has been sent to ${email}`)
        } catch (err: any) {
            return InternalError(err.message)
        }
    }

    static async resendForgotPasswordLink(email: string) {
        try {
            const user = await userRepo.findByEmail(email)
            if (!user) {
                return NotFound(`User with email ${email} not found`);
            }
            const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10m" });
            const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`

            // Send forgot password email
            MailService.sendForgotPasswordEmail(email, resetLink);

            return Ok(null, `Password reset link has been sent to ${email}`)
        } catch (err: any) {
            return InternalError(err.message)
        }
    }
}
